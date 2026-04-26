package library

import (
	"context"
	"time"

	"github.com/coding-hui/examora/internal/page"
)

const (
	PaperStatusDraft     = "DRAFT"
	PaperStatusPublished = "PUBLISHED"
)

type Paper struct {
	ID          uint64    `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Status      string    `json:"status"`
	CreatedBy   uint64    `json:"created_by"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type PaperQuestion struct {
	ID         uint64    `json:"id"`
	PaperID    uint64    `json:"paper_id"`
	QuestionID uint64    `json:"question_id"`
	Score      float64   `json:"score"`
	SortOrder  int       `json:"sort_order"`
	CreatedAt  time.Time `json:"created_at"`
}

type SavePaperCommand struct {
	Title       string
	Description string
	Status      string
	CreatedBy   uint64
}

type AddPaperQuestionCommand struct {
	QuestionID uint64
	Score      float64
	SortOrder  int
}

func (s *Service) ListPapers(ctx context.Context, q page.Query) (page.Result[Paper], error) {
	items, total, err := s.store.ListPapers(ctx, q.Normalize())
	if err != nil {
		return page.Result[Paper]{}, err
	}
	q = q.Normalize()
	return page.Result[Paper]{Items: items, Total: total, Page: q.Page, PageSize: q.PageSize}, nil
}

func (s *Service) GetPaper(ctx context.Context, id uint64) (*Paper, error) {
	return s.store.GetPaper(ctx, id)
}

func (s *Service) PaperExists(ctx context.Context, id uint64) (bool, error) {
	return s.store.PaperExists(ctx, id)
}

func (s *Service) DeletePaper(ctx context.Context, id uint64) error {
	return s.store.DeletePaper(ctx, id)
}

func (s *Service) CreatePaper(ctx context.Context, cmd SavePaperCommand) (*Paper, error) {
	status := cmd.Status
	if status == "" {
		status = PaperStatusDraft
	}
	p := &Paper{Title: cmd.Title, Description: cmd.Description, Status: status, CreatedBy: cmd.CreatedBy}
	if err := s.store.CreatePaper(ctx, p); err != nil {
		return nil, err
	}
	return p, nil
}

func (s *Service) UpdatePaper(ctx context.Context, id uint64, cmd SavePaperCommand) (*Paper, error) {
	p := &Paper{ID: id, Title: cmd.Title, Description: cmd.Description, Status: cmd.Status, CreatedBy: cmd.CreatedBy}
	if err := s.store.UpdatePaper(ctx, p); err != nil {
		return nil, err
	}
	return p, nil
}

func (s *Service) AddPaperQuestion(ctx context.Context, paperID uint64, cmd AddPaperQuestionCommand) (*PaperQuestion, error) {
	item := &PaperQuestion{PaperID: paperID, QuestionID: cmd.QuestionID, Score: cmd.Score, SortOrder: cmd.SortOrder}
	if err := s.store.AddPaperQuestion(ctx, item); err != nil {
		return nil, err
	}
	return item, nil
}

func (s *Service) RemovePaperQuestion(ctx context.Context, paperID, questionID uint64) error {
	return s.store.RemovePaperQuestion(ctx, paperID, questionID)
}
