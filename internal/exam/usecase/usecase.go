package usecase

import (
	"context"

	"github.com/coding-hui/examora/internal/exam/entity"
	"github.com/coding-hui/examora/internal/kernel"
	"github.com/coding-hui/examora/internal/transport/http/response"
)

type Repository interface {
	List(ctx context.Context, query kernel.PageQuery) ([]entity.Exam, int64, error)
	FindByID(ctx context.Context, id uint64) (*entity.Exam, error)
	Create(ctx context.Context, exam *entity.Exam) error
	Update(ctx context.Context, exam *entity.Exam) error
}

type PaperReader interface {
	Exists(ctx context.Context, id uint64) (bool, error)
}

type Usecase struct {
	repo   Repository
	papers PaperReader
}

func New(repo Repository, papers PaperReader) *Usecase { return &Usecase{repo: repo, papers: papers} }

type SaveExamRequest struct {
	Title           string `json:"title"`
	Description     string `json:"description"`
	PaperID         uint64 `json:"paper_id"`
	Status          string `json:"status"`
	DurationMinutes int    `json:"duration_minutes"`
	CreatedBy       uint64 `json:"-"`
}

func (u *Usecase) List(ctx context.Context, q kernel.PageQuery) (kernel.PageResult[entity.Exam], error) {
	items, total, err := u.repo.List(ctx, q.Normalize())
	if err != nil {
		return kernel.PageResult[entity.Exam]{}, err
	}
	q = q.Normalize()
	return kernel.PageResult[entity.Exam]{Items: items, Total: total, Page: q.Page, PageSize: q.PageSize}, nil
}
func (u *Usecase) Get(ctx context.Context, id uint64) (*entity.Exam, error) {
	return u.repo.FindByID(ctx, id)
}
func (u *Usecase) Create(ctx context.Context, req SaveExamRequest) (*entity.Exam, error) {
	if req.PaperID != 0 {
		ok, err := u.papers.Exists(ctx, req.PaperID)
		if err != nil {
			return nil, err
		}
		if !ok {
			return nil, response.NotFound("paper not found")
		}
	}
	status := req.Status
	if status == "" {
		status = entity.StatusDraft
	}
	e := &entity.Exam{Title: req.Title, Description: req.Description, PaperID: req.PaperID, Status: status, DurationMinutes: req.DurationMinutes, CreatedBy: req.CreatedBy}
	if err := u.repo.Create(ctx, e); err != nil {
		return nil, err
	}
	return e, nil
}
func (u *Usecase) Update(ctx context.Context, id uint64, req SaveExamRequest) (*entity.Exam, error) {
	e := &entity.Exam{ID: id, Title: req.Title, Description: req.Description, PaperID: req.PaperID, Status: req.Status, DurationMinutes: req.DurationMinutes, CreatedBy: req.CreatedBy}
	if err := u.repo.Update(ctx, e); err != nil {
		return nil, err
	}
	return e, nil
}
func (u *Usecase) Publish(ctx context.Context, id uint64) error {
	e, err := u.repo.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if err := e.Publish(); err != nil {
		return response.Conflict(err.Error())
	}
	return u.repo.Update(ctx, e)
}
func (u *Usecase) Close(ctx context.Context, id uint64) error {
	e, err := u.repo.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if err := e.Close(); err != nil {
		return response.Conflict(err.Error())
	}
	return u.repo.Update(ctx, e)
}
