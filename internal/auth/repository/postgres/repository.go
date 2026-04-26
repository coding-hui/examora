package postgres

import (
	"context"

	"github.com/coding-hui/examora/internal/auth/entity"
	"github.com/coding-hui/examora/internal/platform/database"
	"github.com/coding-hui/examora/internal/platform/transaction"
	"gorm.io/gorm"
)

type Repository struct {
	db *gorm.DB
}

func New(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) FindByExternalSubject(ctx context.Context, provider string, subject string) (*entity.User, error) {
	var model database.UserModel
	if err := transaction.DBFromContext(ctx, r.db).
		Where("auth_provider = ? AND external_subject = ?", provider, subject).
		First(&model).Error; err != nil {
		return nil, err
	}
	return toEntity(&model), nil
}

func (r *Repository) CreateMapping(ctx context.Context, user *entity.User) error {
	model := &database.UserModel{
		ExternalSubject: user.ExternalSubject,
		AuthProvider:    user.AuthProvider,
		DisplayName:     user.DisplayName,
		Email:           user.Email,
		Status:          user.Status,
	}
	if err := transaction.DBFromContext(ctx, r.db).Create(model).Error; err != nil {
		return err
	}
	user.ID = model.ID
	user.CreatedAt = model.CreatedAt
	user.UpdatedAt = model.UpdatedAt
	return nil
}

func toEntity(m *database.UserModel) *entity.User {
	return &entity.User{
		ID:              m.ID,
		ExternalSubject: m.ExternalSubject,
		AuthProvider:    m.AuthProvider,
		DisplayName:     m.DisplayName,
		Email:           m.Email,
		RoleCode:        m.RoleCode,
		Status:          m.Status,
		CreatedAt:       m.CreatedAt,
		UpdatedAt:       m.UpdatedAt,
	}
}
