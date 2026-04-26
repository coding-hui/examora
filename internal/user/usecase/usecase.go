package usecase

import (
	"context"

	"github.com/coding-hui/examora/internal/kernel"
	"github.com/coding-hui/examora/internal/user/entity"
)

type Repository interface {
	List(ctx context.Context, query kernel.PageQuery) ([]entity.User, int64, error)
	FindByID(ctx context.Context, id uint64) (*entity.User, error)
	FindByRoleCode(ctx context.Context, roleCode string) (*entity.User, error)
	Create(ctx context.Context, user *entity.User) error
	Update(ctx context.Context, user *entity.User) error
	Delete(ctx context.Context, id uint64) error
}

type Usecase struct {
	repo Repository
}

func New(repo Repository) *Usecase {
	return &Usecase{repo: repo}
}

type CreateUserRequest struct {
	Username        string  `json:"username"`
	Email           *string `json:"email"`
	ExternalSubject string  `json:"external_subject"`
	DisplayName     *string `json:"display_name"`
	RoleCode        *string `json:"role_code"`
	Status          string  `json:"status"`
}

type UpdateUserRequest struct {
	Email       *string `json:"email"`
	DisplayName *string `json:"display_name"`
	RoleCode    *string `json:"role_code"`
	Status      string  `json:"status"`
}

func (u *Usecase) List(ctx context.Context, query kernel.PageQuery) (kernel.PageResult[entity.User], error) {
	items, total, err := u.repo.List(ctx, query.Normalize())
	if err != nil {
		return kernel.PageResult[entity.User]{}, err
	}
	query = query.Normalize()
	return kernel.PageResult[entity.User]{Items: items, Total: total, Page: query.Page, PageSize: query.PageSize}, nil
}

func (u *Usecase) Get(ctx context.Context, id uint64) (*entity.User, error) {
	return u.repo.FindByID(ctx, id)
}

func (u *Usecase) Create(ctx context.Context, req CreateUserRequest) (*entity.User, error) {
	status := req.Status
	if status == "" {
		status = entity.StatusActive
	}
	user := &entity.User{
		Username:        req.Username,
		Email:           req.Email,
		ExternalSubject: req.ExternalSubject,
		AuthProvider:    "LOGTO",
		DisplayName:     req.DisplayName,
		RoleCode:        req.RoleCode,
		Status:          status,
	}
	if err := u.repo.Create(ctx, user); err != nil {
		return nil, err
	}
	return user, nil
}

func (u *Usecase) Update(ctx context.Context, id uint64, req UpdateUserRequest) (*entity.User, error) {
	user, err := u.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	user.Email = req.Email
	user.DisplayName = req.DisplayName
	user.RoleCode = req.RoleCode
	if req.Status != "" {
		user.Status = req.Status
	}
	if err := u.repo.Update(ctx, user); err != nil {
		return nil, err
	}
	return user, nil
}

func (u *Usecase) Delete(ctx context.Context, id uint64) error {
	return u.repo.Delete(ctx, id)
}
