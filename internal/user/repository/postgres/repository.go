package postgres

import (
	"context"

	"github.com/coding-hui/examora/internal/kernel"
	"github.com/coding-hui/examora/internal/platform/database"
	"github.com/coding-hui/examora/internal/platform/transaction"
	"github.com/coding-hui/examora/internal/user/entity"
	"gorm.io/gorm"
)

type Repository struct {
	db *gorm.DB
}

func New(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) List(ctx context.Context, query kernel.PageQuery) ([]entity.User, int64, error) {
	db := transaction.DBFromContext(ctx, r.db).Model(&database.UserModel{})
	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var rows []database.UserModel
	err := db.Order("id DESC").Offset(query.Offset()).Limit(query.Normalize().PageSize).Find(&rows).Error
	if err != nil {
		return nil, 0, err
	}
	items := make([]entity.User, 0, len(rows))
	for _, row := range rows {
		items = append(items, *toEntity(&row))
	}
	return items, total, nil
}

func (r *Repository) FindByID(ctx context.Context, id uint64) (*entity.User, error) {
	var row database.UserModel
	if err := transaction.DBFromContext(ctx, r.db).First(&row, id).Error; err != nil {
		return nil, err
	}
	return toEntity(&row), nil
}

func (r *Repository) FindByRoleCode(ctx context.Context, roleCode string) (*entity.User, error) {
	var row database.UserModel
	if err := transaction.DBFromContext(ctx, r.db).Where("role_code = ?", roleCode).First(&row).Error; err != nil {
		return nil, err
	}
	return toEntity(&row), nil
}

func (r *Repository) Create(ctx context.Context, user *entity.User) error {
	row := toModel(user)
	if err := transaction.DBFromContext(ctx, r.db).Create(row).Error; err != nil {
		return err
	}
	*user = *toEntity(row)
	return nil
}

func (r *Repository) Update(ctx context.Context, user *entity.User) error {
	row := toModel(user)
	return transaction.DBFromContext(ctx, r.db).Save(row).Error
}

func (r *Repository) Delete(ctx context.Context, id uint64) error {
	return transaction.DBFromContext(ctx, r.db).Delete(&database.UserModel{}, id).Error
}

func toEntity(m *database.UserModel) *entity.User {
	return &entity.User{
		ID:              m.ID,
		Username:        stringValue(m.Username),
		Email:           m.Email,
		ExternalSubject: m.ExternalSubject,
		AuthProvider:    m.AuthProvider,
		DisplayName:     m.DisplayName,
		RoleCode:        m.RoleCode,
		Status:          m.Status,
		CreatedAt:       m.CreatedAt,
		UpdatedAt:       m.UpdatedAt,
	}
}

func toModel(e *entity.User) *database.UserModel {
	return &database.UserModel{
		ID:              e.ID,
		Username:        stringPtr(e.Username),
		Email:           e.Email,
		ExternalSubject: e.ExternalSubject,
		AuthProvider:    e.AuthProvider,
		DisplayName:     e.DisplayName,
		RoleCode:        e.RoleCode,
		Status:          e.Status,
	}
}

func stringValue(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}

func stringPtr(value string) *string {
	if value == "" {
		return nil
	}
	return &value
}
