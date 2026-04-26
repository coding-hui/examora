package usecase

import (
	"context"

	"github.com/coding-hui/examora/internal/auth/entity"
	"github.com/coding-hui/examora/internal/transport/http/response"
)

type AuthMeData struct {
	UserID          uint64  `json:"user_id"`
	ExternalSubject string  `json:"external_subject"`
	DisplayName     *string `json:"display_name"`
	Email           *string `json:"email,omitempty"`
	Role            *string `json:"role"`
	RoleCode        *string `json:"role_code"`
	Status          string  `json:"status"`
}

type Usecase struct {
	users    UserRepository
	verifier TokenVerifier
}

func New(users UserRepository, verifier TokenVerifier) *Usecase {
	return &Usecase{users: users, verifier: verifier}
}

func (u *Usecase) Authenticate(ctx context.Context, token string) (*entity.User, error) {
	claims, err := u.verifier.Verify(ctx, token)
	if err != nil {
		return nil, response.Unauthorized("invalid token")
	}

	user, err := u.users.FindByExternalSubject(ctx, entity.ProviderLogto, claims.Subject)
	if err == nil {
		return user, nil
	}

	now := claims.ExpiresAt
	if now.IsZero() {
		now = now.UTC()
	}
	user = &entity.User{
		ExternalSubject: claims.Subject,
		AuthProvider:    entity.ProviderLogto,
		DisplayName:     claims.DisplayName,
		Email:           claims.Email,
		Status:          entity.StatusPending,
	}
	if err := u.users.CreateMapping(ctx, user); err != nil {
		return nil, response.Internal("create local user mapping failed")
	}
	return user, nil
}

func RequireAdmin(user *entity.User) error {
	if !user.IsActive() {
		return response.Forbidden("user is not active")
	}
	if !user.IsAdmin() {
		return response.Forbidden("admin access required")
	}
	return nil
}

func RequireClient(user *entity.User) error {
	if !user.IsActive() {
		return response.Forbidden("user is not active")
	}
	if !user.IsStudent() && !user.IsAdmin() {
		return response.Forbidden("client access required")
	}
	return nil
}

func ToAuthMe(user *entity.User) AuthMeData {
	return AuthMeData{
		UserID:          user.ID,
		ExternalSubject: user.ExternalSubject,
		DisplayName:     user.DisplayName,
		Email:           user.Email,
		Role:            user.RoleCode,
		RoleCode:        user.RoleCode,
		Status:          user.Status,
	}
}
