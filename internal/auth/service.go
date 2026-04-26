package auth

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"

	"github.com/casbin/casbin/v2"

	authcasbin "github.com/coding-hui/examora/internal/auth/casbin"
	authtoken "github.com/coding-hui/examora/internal/auth/token"
	"github.com/coding-hui/examora/internal/infra/config"
	"github.com/coding-hui/examora/internal/transport/http/response"
)

type Service struct {
	cfg           config.Config
	userRepo      UserStore
	jwtService    *authtoken.JWTService
	pwdService    *authtoken.PasswordService
	casbin        *casbin.Enforcer
	blacklist     *authtoken.BlacklistService
	logtoVerifier LogtoVerifier
}

type LogtoVerifier interface {
	Verify(ctx context.Context, token string) (*Claims, error)
	VerifyIDToken(ctx context.Context, token string) (*Claims, error)
}

func ProvideService(
	userRepo UserStore,
	jwtService *authtoken.JWTService,
	pwdService *authtoken.PasswordService,
	casbinEnforcer *casbin.Enforcer,
	cfg config.Config,
	blacklist *authtoken.BlacklistService,
	logtoVerifier LogtoVerifier,
) (*Service, error) {
	s := &Service{
		userRepo:      userRepo,
		jwtService:    jwtService,
		pwdService:    pwdService,
		casbin:        casbinEnforcer,
		cfg:           cfg,
		blacklist:     blacklist,
		logtoVerifier: logtoVerifier,
	}
	if err := s.init(context.Background()); err != nil {
		return nil, err
	}
	return s, nil
}

func (u *Service) init(ctx context.Context) error {
	adminHash, err := u.pwdService.Hash(u.cfg.AdminDefaultPW)
	if err != nil {
		return fmt.Errorf("hash default admin password: %w", err)
	}
	adminID, err := u.userRepo.EnsureDefaultAdmin(ctx, adminHash)
	if err != nil {
		return fmt.Errorf("ensure default admin: %w", err)
	} else if adminID > 0 {
		if _, err := authcasbin.AddRoleForUser(u.casbin, adminID, "admin"); err != nil {
			return fmt.Errorf("add default admin role: %w", err)
		}
	}
	if err := authcasbin.SeedPolicies(u.casbin); err != nil {
		return fmt.Errorf("seed casbin policies: %w", err)
	}
	return nil
}

func (u *Service) Login(ctx context.Context, req *LoginRequest) (*LoginResponse, error) {
	if req.Username == "" || req.Password == "" {
		return nil, &response.AppError{Status: 400, Code: 40000, Message: "username and password are required"}
	}

	user, valid, err := u.userRepo.VerifyPassword(ctx, req.Username, req.Password)
	if err != nil {
		return nil, response.Unauthorized("invalid credentials")
	}
	if !valid {
		return nil, response.Unauthorized("invalid credentials")
	}

	if user.Status != "ACTIVE" {
		return nil, response.Forbidden("account is not active")
	}

	if user.AuthProvider != nil && *user.AuthProvider == "logto" {
		return nil, &response.AppError{Status: 400, Code: 40000, Message: "this account uses SSO login"}
	}

	roles, _ := authcasbin.GetRolesForUser(u.casbin, user.ID)
	if len(roles) == 0 {
		roles = []string{"user"}
	}

	token, expiresAt, err := u.jwtService.Generate(user.ID, user.Username, roles)
	if err != nil {
		return nil, response.Internal("failed to generate token")
	}

	return &LoginResponse{
		Token:     token,
		ExpiresAt: expiresAt.Unix(),
	}, nil
}

func (u *Service) Logout(ctx context.Context, tokenString string) error {
	h := sha256.Sum256([]byte(tokenString))
	tokenHash := hex.EncodeToString(h[:])
	return u.blacklist.Blacklist(ctx, tokenHash, 24*3600*1000000000)
}

func (u *Service) Me(ctx context.Context, tokenString string) (*AuthMeData, error) {
	user, err := u.Authenticate(ctx, tokenString)
	if err != nil {
		return nil, err
	}

	permissions := make(map[string][]string)
	objects := []string{"admin_dashboard", "questions", "papers", "exams", "submissions", "judge_tasks", "client_events"}
	actions := []string{"read", "write", "delete"}

	for _, role := range user.Roles {
		for _, obj := range objects {
			for _, act := range actions {
				allowed, _ := authcasbin.Enforce(u.casbin, role, obj, act)
				if allowed {
					permissions[obj] = append(permissions[obj], act)
				}
			}
		}
	}

	return &AuthMeData{
		ID:              user.ID,
		Username:        user.Username,
		DisplayName:     user.DisplayName,
		Roles:           user.Roles,
		Permissions:     permissions,
		ExternalSubject: user.ExternalSubject,
	}, nil
}

func (u *Service) GetConfig(ctx context.Context) *AuthConfig {
	hasLocalUsers, _ := u.userRepo.HasUsers(ctx)
	return &AuthConfig{
		AuthMode:      "local",
		LogtoEnabled:  u.cfg.IsLogtoEnabled(),
		HasLocalUsers: hasLocalUsers,
	}
}

func (u *Service) Authenticate(ctx context.Context, tokenString string) (*AuthenticatedUser, error) {
	h := sha256.Sum256([]byte(tokenString))
	tokenHash := hex.EncodeToString(h[:])
	blacklisted, err := u.blacklist.IsBlacklisted(ctx, tokenHash)
	if err != nil {
		return nil, response.Internal("blacklist check failed")
	}
	if blacklisted {
		return nil, response.Unauthorized("token has been revoked")
	}

	claims, err := u.jwtService.Validate(tokenString)
	if err != nil {
		return nil, response.Unauthorized("invalid token")
	}

	user, err := u.userRepo.FindByID(ctx, claims.UserID)
	if err != nil {
		return nil, response.Unauthorized("user not found")
	}

	if user.Status != "ACTIVE" {
		return nil, response.Forbidden("account is not active")
	}

	roles, _ := authcasbin.GetRolesForUser(u.casbin, user.ID)

	return &AuthenticatedUser{
		ID:              user.ID,
		Username:        user.Username,
		Roles:           roles,
		Scopes:          roles,
		DisplayName:     user.DisplayName,
		ExternalSubject: user.ExternalSubject,
	}, nil
}

func RequirePermission(casbinEnforcer *casbin.Enforcer, user *AuthenticatedUser, object, action string) error {
	for _, role := range user.Roles {
		allowed, err := authcasbin.Enforce(casbinEnforcer, role, object, action)
		if err != nil {
			return response.Internal("authorization check failed")
		}
		if allowed {
			return nil
		}
	}
	return response.Forbidden(fmt.Sprintf("%s:%s permission required", object, action))
}

func (u *Service) RequireAdmin(user *AuthenticatedUser) error {
	return RequirePermission(u.casbin, user, "admin_dashboard", "write")
}

func (u *Service) RequireClient(user *AuthenticatedUser) error {
	return RequirePermission(u.casbin, user, "client", "access")
}

func (u *Service) VerifyLogtoToken(ctx context.Context, accessToken string) (*Claims, error) {
	if u.logtoVerifier == nil {
		return nil, response.Internal("logto not configured")
	}
	return u.logtoVerifier.Verify(ctx, accessToken)
}

func (u *Service) VerifyLogtoIDToken(ctx context.Context, idToken string) (*Claims, error) {
	if u.logtoVerifier == nil {
		return nil, response.Internal("logto not configured")
	}
	return u.logtoVerifier.VerifyIDToken(ctx, idToken)
}

func (u *Service) LoginWithLogto(ctx context.Context, subject string, email *string) (*LoginResponse, error) {
	var user *User
	var err error

	existing, err := u.userRepo.FindByExternalSubject(ctx, subject)
	switch {
	case err == nil && existing != nil:
		user = existing
	case errors.Is(err, ErrUserNotFound):
		authProv := "logto"
		displayName := ""
		if email != nil {
			displayName = *email
		}
		newUser := &User{
			Username:        displayName,
			Status:          "ACTIVE",
			DisplayName:     &displayName,
			AuthProvider:    &authProv,
			ExternalSubject: &subject,
		}
		if err := u.userRepo.Create(ctx, newUser, ""); err != nil {
			return nil, response.Internal("failed to create user")
		}
		user = newUser
	default:
		return nil, response.Internal("failed to find user")
	}

	if user.Status != "ACTIVE" {
		return nil, response.Forbidden("account is not active")
	}

	roles, _ := authcasbin.GetRolesForUser(u.casbin, user.ID)
	if len(roles) == 0 {
		// New Logto users get client role by default so they can access candidate endpoints
		_, _ = authcasbin.AddRoleForUser(u.casbin, user.ID, "client")
		roles = []string{"client"}
	}

	token, expiresAt, err := u.jwtService.Generate(user.ID, user.Username, roles)
	if err != nil {
		return nil, response.Internal("failed to generate token")
	}

	return &LoginResponse{
		Token:     token,
		ExpiresAt: expiresAt.Unix(),
	}, nil
}
