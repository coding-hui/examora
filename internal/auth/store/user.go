package store

import (
	"context"
	"errors"
	"strings"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"github.com/coding-hui/examora/internal/auth"
	"github.com/coding-hui/examora/internal/infra/database"
	"github.com/coding-hui/examora/internal/infra/transaction"
)

type UserStore struct {
	db *gorm.DB
}

var _ auth.UserStore = (*UserStore)(nil)

func NewUserStore(db *gorm.DB) *UserStore {
	return &UserStore{db: db}
}

func (r *UserStore) FindByID(ctx context.Context, id uint64) (*auth.User, error) {
	var row database.UserModel
	if err := transaction.DBFromContext(ctx, r.db).First(&row, id).Error; err != nil {
		return nil, database.MapNotFound(err, auth.ErrUserNotFound)
	}
	return toUser(&row), nil
}

func (r *UserStore) FindByUsername(ctx context.Context, username string) (*auth.User, error) {
	var row database.UserModel
	if err := transaction.DBFromContext(ctx, r.db).Where("username = ?", username).First(&row).Error; err != nil {
		return nil, database.MapNotFound(err, auth.ErrUserNotFound)
	}
	return toUser(&row), nil
}

func (r *UserStore) FindByExternalSubject(ctx context.Context, sub string) (*auth.User, error) {
	var row database.UserModel
	if err := transaction.DBFromContext(ctx, r.db).Where("external_subject = ?", sub).First(&row).Error; err != nil {
		return nil, database.MapNotFound(err, auth.ErrUserNotFound)
	}
	return toUser(&row), nil
}

func (r *UserStore) Create(ctx context.Context, user *auth.User, passwordHash string) error {
	row := &database.UserModel{
		Username:     user.Username,
		PasswordHash: passwordHash,
		Status:       user.Status,
	}
	if user.DisplayName != nil {
		row.DisplayName = user.DisplayName
	}
	if user.Email != nil {
		row.Email = user.Email
	}
	if user.AuthProvider != nil {
		row.AuthProvider = user.AuthProvider
	}
	if user.ExternalSubject != nil {
		row.ExternalSubject = user.ExternalSubject
	}
	if err := transaction.DBFromContext(ctx, r.db).Create(row).Error; err != nil {
		return err
	}
	user.ID = row.ID
	return nil
}

func (r *UserStore) UpdatePassword(ctx context.Context, id uint64, hash string) error {
	return transaction.DBFromContext(ctx, r.db).Model(&database.UserModel{}).Where("id = ?", id).Update("password_hash", hash).Error
}

func (r *UserStore) UpdateStatus(ctx context.Context, id uint64, status string) error {
	return transaction.DBFromContext(ctx, r.db).Model(&database.UserModel{}).Where("id = ?", id).Update("status", status).Error
}

func (r *UserStore) HasUsers(ctx context.Context) (bool, error) {
	var count int64
	err := transaction.DBFromContext(ctx, r.db).Model(&database.UserModel{}).Count(&count).Error
	return count > 0, err
}

func (r *UserStore) LinkExternalSubject(ctx context.Context, userID uint64, sub string) error {
	return transaction.DBFromContext(ctx, r.db).Model(&database.UserModel{}).
		Where("id = ?", userID).
		Updates(map[string]any{
			"external_subject": sub,
			"auth_provider":    "logto",
		}).Error
}

func (r *UserStore) EnsureDefaultAdmin(ctx context.Context, admin auth.DefaultAdmin, defaultPWHash string) (uint64, error) {
	if existing, err := r.FindByUsername(ctx, admin.Username); err == nil {
		return existing.ID, nil
	} else if err != nil && !errors.Is(err, auth.ErrUserNotFound) {
		return 0, err
	}

	authProv := "local"
	row := &database.UserModel{
		Username:     admin.Username,
		PasswordHash: defaultPWHash,
		Status:       "ACTIVE",
		AuthProvider: &authProv,
	}
	if admin.DisplayName != "" {
		row.DisplayName = &admin.DisplayName
	}
	if admin.Email != "" {
		row.Email = &admin.Email
	}
	if err := transaction.DBFromContext(ctx, r.db).Create(row).Error; err != nil {
		return 0, err
	}
	return row.ID, nil
}

func (r *UserStore) VerifyPassword(ctx context.Context, username, password string) (*auth.User, bool, error) {
	var row database.UserModel
	if err := transaction.DBFromContext(ctx, r.db).Where("username = ?", username).First(&row).Error; err != nil {
		return nil, false, database.MapNotFound(err, auth.ErrUserNotFound)
	}
	user := toUser(&row)
	err := bcrypt.CompareHashAndPassword([]byte(row.PasswordHash), []byte(password))
	return user, err == nil, nil
}

func (r *UserStore) Update(ctx context.Context, id uint64, username, displayName, email, status string) error {
	return transaction.DBFromContext(ctx, r.db).Model(&database.UserModel{}).Where("id = ?", id).Updates(map[string]any{
		"username":     username,
		"display_name": displayName,
		"email":        email,
		"status":       status,
	}).Error
}

func (r *UserStore) Delete(ctx context.Context, id uint64) error {
	return transaction.DBFromContext(ctx, r.db).Delete(&database.UserModel{}, id).Error
}

func (r *UserStore) List(ctx context.Context, page, pageSize int, filter auth.UserListFilter) ([]auth.User, int64, error) {
	query := transaction.DBFromContext(ctx, r.db).Model(&database.UserModel{})
	if keyword := strings.TrimSpace(filter.Keyword); keyword != "" {
		like := "%" + keyword + "%"
		query = query.Where("username LIKE ? OR email LIKE ? OR display_name LIKE ?", like, like, like)
	}
	if status := strings.TrimSpace(filter.Status); status != "" {
		query = query.Where("status = ?", status)
	}
	if source := strings.TrimSpace(filter.Source); source != "" {
		if source == "LOCAL" {
			query = query.Where("auth_provider IS NULL OR auth_provider = '' OR auth_provider = ?", "LOCAL")
		} else {
			query = query.Where("auth_provider = ?", source)
		}
	}
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var rows []database.UserModel
	offset := (page - 1) * pageSize
	if err := query.Order("id desc").Offset(offset).Limit(pageSize).Find(&rows).Error; err != nil {
		return nil, 0, err
	}
	users := make([]auth.User, 0, len(rows))
	for _, row := range rows {
		users = append(users, *toUser(&row))
	}
	return users, total, nil
}

func toUser(m *database.UserModel) *auth.User {
	return &auth.User{
		ID:              m.ID,
		Username:        m.Username,
		Status:          m.Status,
		DisplayName:     m.DisplayName,
		Email:           m.Email,
		AuthProvider:    m.AuthProvider,
		ExternalSubject: m.ExternalSubject,
		CreatedAt:       m.CreatedAt.Format("2006-01-02T15:04:05Z"),
	}
}
