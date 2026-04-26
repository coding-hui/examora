package auth

import (
	"context"
	"time"
)

type UserStore interface {
	FindByID(ctx context.Context, id uint64) (*User, error)
	FindByUsername(ctx context.Context, username string) (*User, error)
	FindByExternalSubject(ctx context.Context, sub string) (*User, error)
	Create(ctx context.Context, user *User, passwordHash string) error
	UpdatePassword(ctx context.Context, id uint64, hash string) error
	UpdateStatus(ctx context.Context, id uint64, status string) error
	HasUsers(ctx context.Context) (bool, error)
	LinkExternalSubject(ctx context.Context, userID uint64, sub string) error
	EnsureDefaultAdmin(ctx context.Context, defaultPWHash string) (uint64, error)
	VerifyPassword(ctx context.Context, username, password string) (*User, bool, error)
}

type Claims struct {
	Subject        string
	Name           *string
	Email          *string
	ExpiresAt      time.Time
	Scope          string
	Scopes         []string
	Audience       []string
	ClientID       string
	OrganizationID *string
}

type TokenVerifier interface {
	Verify(ctx context.Context, token string) (*Claims, error)
}

type AuthMeData struct {
	ID              uint64              `json:"id"`
	Username        string              `json:"username"`
	DisplayName     *string             `json:"display_name,omitempty"`
	Roles           []string            `json:"roles,omitempty"`
	Permissions     map[string][]string `json:"permissions,omitempty"`
	ExternalSubject *string             `json:"external_subject,omitempty"`
}

type AuthConfig struct {
	AuthMode      string `json:"auth_mode"`
	LogtoEnabled  bool   `json:"logto_enabled"`
	HasLocalUsers bool   `json:"has_local_users"`
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token     string      `json:"token"`
	ExpiresAt int64       `json:"expires_at"`
	User      *AuthMeData `json:"user,omitempty"`
}
