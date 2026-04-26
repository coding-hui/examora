package usecase

import (
	"context"

	"github.com/coding-hui/examora/internal/kernel"
	"github.com/coding-hui/examora/internal/question/entity"
)

type Repository interface {
	List(ctx context.Context, query kernel.PageQuery) ([]entity.Question, int64, error)
	FindByID(ctx context.Context, id uint64) (*entity.Question, error)
	Create(ctx context.Context, question *entity.Question) error
	Update(ctx context.Context, question *entity.Question) error
	Delete(ctx context.Context, id uint64) error
	AddTestCase(ctx context.Context, tc *entity.TestCase) error
	ListTestCases(ctx context.Context, questionID uint64, includeHidden bool) ([]entity.TestCase, error)
	Exists(ctx context.Context, id uint64) (bool, error)
}

type Usecase struct {
	repo Repository
}

func New(repo Repository) *Usecase {
	return &Usecase{repo: repo}
}

type SaveQuestionRequest struct {
	Type          string         `json:"type"`
	Title         string         `json:"title"`
	Content       map[string]any `json:"content"`
	Answer        map[string]any `json:"answer"`
	Difficulty    *string        `json:"difficulty"`
	Language      *string        `json:"language"`
	StarterCode   *string        `json:"starter_code"`
	TimeLimitMS   int            `json:"time_limit_ms"`
	MemoryLimitMB int            `json:"memory_limit_mb"`
	Status        string         `json:"status"`
	CreatedBy     uint64         `json:"-"`
}

type SaveTestCaseRequest struct {
	Input          string `json:"input"`
	ExpectedOutput string `json:"expected_output"`
	TimeLimitMS    int    `json:"time_limit_ms"`
	MemoryLimitMB  int    `json:"memory_limit_mb"`
	IsSample       bool   `json:"is_sample"`
	IsHidden       bool   `json:"is_hidden"`
	SortOrder      int    `json:"sort_order"`
}

func (u *Usecase) List(ctx context.Context, query kernel.PageQuery) (kernel.PageResult[entity.Question], error) {
	items, total, err := u.repo.List(ctx, query.Normalize())
	if err != nil {
		return kernel.PageResult[entity.Question]{}, err
	}
	query = query.Normalize()
	return kernel.PageResult[entity.Question]{Items: items, Total: total, Page: query.Page, PageSize: query.PageSize}, nil
}

func (u *Usecase) Get(ctx context.Context, id uint64) (*entity.Question, error) {
	return u.repo.FindByID(ctx, id)
}

func (u *Usecase) Exists(ctx context.Context, id uint64) (bool, error) {
	return u.repo.Exists(ctx, id)
}

func (u *Usecase) Create(ctx context.Context, req SaveQuestionRequest) (*entity.Question, error) {
	q := fromRequest(req)
	if q.Status == "" {
		q.Status = entity.StatusDraft
	}
	if q.TimeLimitMS == 0 {
		q.TimeLimitMS = 2000
	}
	if q.MemoryLimitMB == 0 {
		q.MemoryLimitMB = 256
	}
	if err := u.repo.Create(ctx, q); err != nil {
		return nil, err
	}
	return q, nil
}

func (u *Usecase) Update(ctx context.Context, id uint64, req SaveQuestionRequest) (*entity.Question, error) {
	q := fromRequest(req)
	q.ID = id
	if err := u.repo.Update(ctx, q); err != nil {
		return nil, err
	}
	return q, nil
}

func (u *Usecase) Delete(ctx context.Context, id uint64) error {
	return u.repo.Delete(ctx, id)
}

func (u *Usecase) AddTestCase(ctx context.Context, questionID uint64, req SaveTestCaseRequest) (*entity.TestCase, error) {
	tc := &entity.TestCase{
		QuestionID:     questionID,
		Input:          req.Input,
		ExpectedOutput: req.ExpectedOutput,
		TimeLimitMS:    req.TimeLimitMS,
		MemoryLimitMB:  req.MemoryLimitMB,
		IsSample:       req.IsSample,
		IsHidden:       req.IsHidden,
		SortOrder:      req.SortOrder,
	}
	if tc.TimeLimitMS == 0 {
		tc.TimeLimitMS = 2000
	}
	if tc.MemoryLimitMB == 0 {
		tc.MemoryLimitMB = 256
	}
	if err := u.repo.AddTestCase(ctx, tc); err != nil {
		return nil, err
	}
	return tc, nil
}

func (u *Usecase) ListTestCases(ctx context.Context, questionID uint64, includeHidden bool) ([]entity.TestCase, error) {
	return u.repo.ListTestCases(ctx, questionID, includeHidden)
}

func fromRequest(req SaveQuestionRequest) *entity.Question {
	return &entity.Question{
		Type:          req.Type,
		Title:         req.Title,
		Content:       req.Content,
		Answer:        req.Answer,
		Difficulty:    req.Difficulty,
		Language:      req.Language,
		StarterCode:   req.StarterCode,
		TimeLimitMS:   req.TimeLimitMS,
		MemoryLimitMB: req.MemoryLimitMB,
		Status:        req.Status,
		CreatedBy:     req.CreatedBy,
	}
}
