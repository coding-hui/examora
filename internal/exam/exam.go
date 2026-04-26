package exam

import (
	"context"
	"errors"
	"time"

	"github.com/coding-hui/examora/internal/library"
	"github.com/coding-hui/examora/internal/page"
)

const (
	StatusDraft     = "DRAFT"
	StatusPublished = "PUBLISHED"
	StatusRunning   = "RUNNING"
	StatusClosed    = "CLOSED"
	StatusArchived  = "ARCHIVED"
)

type Exam struct {
	ID              uint64     `json:"id"`
	Title           string     `json:"title"`
	Description     string     `json:"description"`
	PaperID         *uint64    `json:"paper_id"`
	Status          string     `json:"status"`
	StartTime       *time.Time `json:"start_time"`
	EndTime         *time.Time `json:"end_time"`
	DurationMinutes int        `json:"duration_minutes"`
	CreatedBy       uint64     `json:"created_by"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

func (e *Exam) Publish() error {
	if e.Status != StatusDraft {
		return ErrInvalidExamStatusTransition
	}
	e.Status = StatusPublished
	return nil
}

func (e *Exam) Close() error {
	if e.Status != StatusPublished && e.Status != StatusRunning {
		return ErrInvalidExamStatusTransition
	}
	e.Status = StatusClosed
	return nil
}

type SaveExamCommand struct {
	Title           string
	Description     string
	PaperID         *uint64
	Status          string
	DurationMinutes int
	CreatedBy       uint64
}

func (s *Service) ListExams(ctx context.Context, q page.Query) (page.Result[Exam], error) {
	items, total, err := s.store.ListExams(ctx, q.Normalize())
	if err != nil {
		return page.Result[Exam]{}, err
	}
	q = q.Normalize()
	return page.Result[Exam]{Items: items, Total: total, Page: q.Page, PageSize: q.PageSize}, nil
}

func (s *Service) GetExam(ctx context.Context, id uint64) (*Exam, error) {
	return s.store.GetExam(ctx, id)
}

func (s *Service) CreateExam(ctx context.Context, cmd SaveExamCommand) (*Exam, error) {
	if cmd.PaperID != nil {
		ok, err := s.papers.PaperExists(ctx, *cmd.PaperID)
		if err != nil {
			return nil, err
		}
		if !ok {
			return nil, library.ErrPaperNotFound
		}
	}
	status := cmd.Status
	if status == "" {
		status = StatusDraft
	}
	e := &Exam{Title: cmd.Title, Description: cmd.Description, PaperID: cmd.PaperID, Status: status, DurationMinutes: cmd.DurationMinutes, CreatedBy: cmd.CreatedBy}
	if err := s.store.CreateExam(ctx, e); err != nil {
		return nil, err
	}
	return e, nil
}

func (s *Service) UpdateExam(ctx context.Context, id uint64, cmd SaveExamCommand) (*Exam, error) {
	e := &Exam{ID: id, Title: cmd.Title, Description: cmd.Description, PaperID: cmd.PaperID, Status: cmd.Status, DurationMinutes: cmd.DurationMinutes, CreatedBy: cmd.CreatedBy}
	if err := s.store.UpdateExam(ctx, e); err != nil {
		return nil, err
	}
	return e, nil
}

func (s *Service) PublishExam(ctx context.Context, id uint64) error {
	e, err := s.store.GetExam(ctx, id)
	if err != nil {
		return err
	}
	if err := e.Publish(); err != nil {
		return errors.Join(ErrInvalidExamStatusTransition, err)
	}
	return s.store.UpdateExam(ctx, e)
}

func (s *Service) CloseExam(ctx context.Context, id uint64) error {
	e, err := s.store.GetExam(ctx, id)
	if err != nil {
		return err
	}
	if err := e.Close(); err != nil {
		return errors.Join(ErrInvalidExamStatusTransition, err)
	}
	return s.store.UpdateExam(ctx, e)
}
