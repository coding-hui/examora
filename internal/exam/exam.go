package exam

import (
	"context"
	"errors"
	"time"

	"github.com/coding-hui/examora/internal/library"
)

const (
	StatusDraft     = "DRAFT"
	StatusPublished = "PUBLISHED"
	StatusRunning   = "RUNNING"
	StatusClosed    = "CLOSED"
	StatusArchived  = "ARCHIVED"
)

const (
	QuestionTypeProgramming = "PROGRAMMING"
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

func (s *Service) ListExams(ctx context.Context, pageNum, pageSize int) ([]Exam, int64, error) {
	return s.store.ListExams(ctx, pageNum, pageSize)
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

// =====================================================================
// M1: Snapshot models for exam publishing
// =====================================================================

type ExamSnapshot struct {
	ID              uint64    `json:"id"`
	ExamID          uint64    `json:"exam_id"`
	PaperSnapshotID uint64    `json:"paper_snapshot_id"`
	StartTime       time.Time `json:"start_time"`
	EndTime         time.Time `json:"end_time"`
	DurationMinutes int       `json:"duration_minutes"`
	PublishedAt     time.Time `json:"published_at"`
}

type QuestionSnapshot struct {
	ID             uint64         `json:"id"`
	ExamSnapshotID uint64         `json:"exam_snapshot_id"`
	QuestionID     uint64         `json:"question_id"`
	Type           string         `json:"type"`
	Title          string         `json:"title"`
	Content        map[string]any `json:"content"`
	Score          float64        `json:"score"`
	SortOrder      int            `json:"sort_order"`
	Answer         map[string]any `json:"-"` // Internal only, never exposed to candidate
	TestCases      []TestCase     `json:"-"` // Internal only, never exposed to candidate
	StarterCode    *string        `json:"starter_code,omitempty"`
	TimeLimitMs    int            `json:"time_limit_ms"`
	MemoryLimitMb  int            `json:"memory_limit_mb"`
}

type TestCase struct {
	ID             uint64 `json:"id,omitempty"`
	Input          string `json:"input"`
	ExpectedOutput string `json:"expected_output"`
	TimeLimitMS    int    `json:"time_limit_ms,omitempty"`
	MemoryLimitMB  int    `json:"memory_limit_mb,omitempty"`
	IsSample       bool   `json:"is_sample"`
	IsHidden       bool   `json:"is_hidden"`
	SortOrder      int    `json:"sort_order,omitempty"`
}

// AnswerDraft stores candidate answer drafts
type AnswerDraft struct {
	ID            uint64
	ExamSessionID uint64
	QuestionID    uint64
	Answer        map[string]any
}
