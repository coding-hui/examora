package usecase

import (
	"context"
	"errors"

	"github.com/coding-hui/examora/internal/user/entity"
	"gorm.io/gorm"
)

func (u *Usecase) EnsureSeedAdmin(ctx context.Context, subject, displayName string) error {
	if subject == "" {
		return errors.New("seed admin subject is required")
	}

	_, err := u.repo.FindByRoleCode(ctx, entity.RoleSuperAdmin)
	if err == nil {
		return nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}

	displayNamePtr := displayName
	if displayNamePtr == "" {
		displayNamePtr = "Admin"
	}
	err = u.repo.Create(ctx, &entity.User{
		ExternalSubject: subject,
		DisplayName:     &displayNamePtr,
		RoleCode:       ptr(entity.RoleSuperAdmin),
		Status:         entity.StatusActive,
		AuthProvider:   "LOGTO",
	})
	return err
}

func ptr(s string) *string {
	return &s
}
