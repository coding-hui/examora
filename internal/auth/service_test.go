package auth_test

import (
	"errors"
	"net/http"
	"path/filepath"
	"testing"
	"time"

	"github.com/stretchr/testify/require"

	"github.com/coding-hui/examora/internal/auth"
	authcasbin "github.com/coding-hui/examora/internal/auth/casbin"
	authstore "github.com/coding-hui/examora/internal/auth/store"
	authtoken "github.com/coding-hui/examora/internal/auth/token"
	"github.com/coding-hui/examora/internal/infra/config"
	"github.com/coding-hui/examora/internal/infra/database"
	"github.com/coding-hui/examora/internal/transport/http/response"
)

func newAuthService(t *testing.T, cfg config.Config) (*auth.Service, *authstore.UserStore) {
	t.Helper()

	db, err := database.Open(filepath.Join(t.TempDir(), "examora-auth-test.db"))
	require.NoError(t, err)
	require.NoError(t, database.AutoMigrate(db))

	userStore := authstore.NewUserStore(db)
	enforcer, err := authcasbin.NewEnforcer(db)
	require.NoError(t, err)

	service, err := auth.ProvideService(
		userStore,
		authtoken.NewJWTService(cfg.JWTSecret, cfg.JWTAccessTokenTTL),
		authtoken.NewPasswordService(),
		enforcer,
		cfg,
		authtoken.NewBlacklistService(nil),
		nil,
	)
	require.NoError(t, err)
	return service, userStore
}

func testAuthConfig() config.Config {
	return config.Config{
		JWTSecret:               "test-secret",
		JWTAccessTokenTTL:       time.Hour,
		AdminDefaultUsername:    "root",
		AdminDefaultDisplayName: "Root Admin",
		AdminDefaultEmail:       "root@example.com",
		AdminDefaultPW:          "secret",
	}
}

func TestProvideServiceCreatesConfiguredDefaultAdmin(t *testing.T) {
	service, _ := newAuthService(t, testAuthConfig())

	user, err := service.GetUser(t.Context(), 1)
	require.NoError(t, err)
	require.Equal(t, "root", user.Username)
	require.NotNil(t, user.DisplayName)
	require.Equal(t, "Root Admin", *user.DisplayName)
	require.NotNil(t, user.Email)
	require.Equal(t, "root@example.com", *user.Email)

	roles, err := authcasbin.GetRolesForUser(service.Casbin(), user.ID)
	require.NoError(t, err)
	require.Contains(t, roles, "admin")
}

func TestConfiguredDefaultAdminCannotBeDeleted(t *testing.T) {
	service, _ := newAuthService(t, testAuthConfig())

	err := service.DeleteUser(t.Context(), 1)
	require.Error(t, err)

	var appErr *response.AppError
	require.True(t, errors.As(err, &appErr))
	require.Equal(t, http.StatusForbidden, appErr.Status)
}

func TestDefaultAdminDeletionProtectionUsesStartupID(t *testing.T) {
	service, _ := newAuthService(t, testAuthConfig())

	user, err := service.GetUser(t.Context(), 1)
	require.NoError(t, err)
	user.Username = "renamed-root"
	require.NoError(t, service.UpdateUser(t.Context(), user))

	err = service.DeleteUser(t.Context(), user.ID)
	require.Error(t, err)

	var appErr *response.AppError
	require.True(t, errors.As(err, &appErr))
	require.Equal(t, http.StatusForbidden, appErr.Status)
}
