package usecase

import (
	"context"
	"time"

	"github.com/coding-hui/examora/internal/auth/entity"
)

type Claims struct {
	Subject     string
	DisplayName *string
	Email       *string
	ExpiresAt   time.Time
}

type UserRepository interface {
	FindByExternalSubject(ctx context.Context, provider string, subject string) (*entity.User, error)
	CreateMapping(ctx context.Context, user *entity.User) error
}

type TokenVerifier interface {
	Verify(ctx context.Context, token string) (*Claims, error)
}
