package usecase

import (
	"context"

	"github.com/coding-hui/examora/internal/kernel"
	"github.com/coding-hui/examora/internal/paper/entity"
)

type Repository interface {
	List(ctx context.Context, query kernel.PageQuery) ([]entity.Paper, int64, error)
	FindByID(ctx context.Context, id uint64) (*entity.Paper, error)
	Create(ctx context.Context, paper *entity.Paper) error
	Update(ctx context.Context, paper *entity.Paper) error
	Delete(ctx context.Context, id uint64) error
	AddQuestion(ctx context.Context, item *entity.PaperQuestion) error
	RemoveQuestion(ctx context.Context, paperID, questionID uint64) error
	Exists(ctx context.Context, id uint64) (bool, error)
}

type QuestionReader interface {
	Exists(ctx context.Context, id uint64) (bool, error)
}

type Usecase struct {
	repo      Repository
	questions QuestionReader
}

func New(repo Repository, questions QuestionReader) *Usecase {
	return &Usecase{repo: repo, questions: questions}
}

type SavePaperRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Status      string `json:"status"`
	CreatedBy   uint64 `json:"-"`
}

type AddQuestionRequest struct {
	QuestionID uint64  `json:"question_id"`
	Score      float64 `json:"score"`
	SortOrder  int     `json:"sort_order"`
}

func (u *Usecase) List(ctx context.Context, q kernel.PageQuery) (kernel.PageResult[entity.Paper], error) {
	items, total, err := u.repo.List(ctx, q.Normalize())
	if err != nil {
		return kernel.PageResult[entity.Paper]{}, err
	}
	q = q.Normalize()
	return kernel.PageResult[entity.Paper]{Items: items, Total: total, Page: q.Page, PageSize: q.PageSize}, nil
}

func (u *Usecase) Get(ctx context.Context, id uint64) (*entity.Paper, error) {
	return u.repo.FindByID(ctx, id)
}
func (u *Usecase) Exists(ctx context.Context, id uint64) (bool, error) { return u.repo.Exists(ctx, id) }
func (u *Usecase) Delete(ctx context.Context, id uint64) error         { return u.repo.Delete(ctx, id) }

func (u *Usecase) Create(ctx context.Context, req SavePaperRequest) (*entity.Paper, error) {
	status := req.Status
	if status == "" {
		status = entity.StatusDraft
	}
	p := &entity.Paper{Title: req.Title, Description: req.Description, Status: status, CreatedBy: req.CreatedBy}
	if err := u.repo.Create(ctx, p); err != nil {
		return nil, err
	}
	return p, nil
}

func (u *Usecase) Update(ctx context.Context, id uint64, req SavePaperRequest) (*entity.Paper, error) {
	p := &entity.Paper{ID: id, Title: req.Title, Description: req.Description, Status: req.Status, CreatedBy: req.CreatedBy}
	if err := u.repo.Update(ctx, p); err != nil {
		return nil, err
	}
	return p, nil
}

func (u *Usecase) AddQuestion(ctx context.Context, paperID uint64, req AddQuestionRequest) (*entity.PaperQuestion, error) {
	item := &entity.PaperQuestion{PaperID: paperID, QuestionID: req.QuestionID, Score: req.Score, SortOrder: req.SortOrder}
	if err := u.repo.AddQuestion(ctx, item); err != nil {
		return nil, err
	}
	return item, nil
}

func (u *Usecase) RemoveQuestion(ctx context.Context, paperID, questionID uint64) error {
	return u.repo.RemoveQuestion(ctx, paperID, questionID)
}
