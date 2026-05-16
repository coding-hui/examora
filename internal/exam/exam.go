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

func (s *Service) ListExamSessionsByUser(ctx context.Context, userID uint64) ([]ExamSession, error) {
	return s.store.ListExamSessionsByUser(ctx, userID)
}

func (s *Service) GetExam(ctx context.Context, id uint64) (*Exam, error) {
	return s.store.GetExam(ctx, id)
}

func (s *Service) GetExamSnapshot(ctx context.Context, id uint64) (*ExamSnapshot, error) {
	return s.store.GetExamSnapshot(ctx, id)
}

func (s *Service) ListAvailableExams(ctx context.Context, userID uint64) ([]ExamSessionItem, error) {
	snapshots, err := s.store.ListExamSnapshots(ctx)
	if err != nil {
		return nil, err
	}
	sessions, err := s.store.ListExamSessionsByUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	sessionMap := make(map[uint64]*ExamSession, len(sessions))
	for i := range sessions {
		sessionMap[sessions[i].ExamSnapshotID] = &sessions[i]
	}
	items := make([]ExamSessionItem, 0, len(snapshots))
	for _, snap := range snapshots {
		exam, err := s.store.GetExam(ctx, snap.ExamID)
		if err != nil {
			return nil, err
		}
		if exam.Status == StatusClosed || exam.Status == StatusArchived {
			continue
		}
		status := SessionStatusNotStarted
		if sess, ok := sessionMap[snap.ID]; ok {
			status = sess.Status
		}
		items = append(items, ExamSessionItem{
			ID:     snap.ExamID,
			Title:  exam.Title,
			Status: status,
		})
	}
	return items, nil
}

type ExamSessionItem struct {
	ID     uint64 `json:"id"`
	Title  string `json:"title"`
	Status string `json:"status"`
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

type PaperSectionSnapshot struct {
	ID              uint64    `json:"id"`
	ExamSnapshotID  uint64    `json:"exam_snapshot_id"`
	SourceSectionID uint64    `json:"source_section_id"`
	Title           string    `json:"title"`
	Description     string    `json:"description"`
	SortOrder       int       `json:"sort_order"`
	QuestionCount   int       `json:"question_count"`
	TotalScore      float64   `json:"total_score"`
	CreatedAt       time.Time `json:"created_at"`
}

type QuestionSnapshot struct {
	ID                uint64         `json:"id"`
	ExamSnapshotID    uint64         `json:"exam_snapshot_id"`
	SectionSnapshotID uint64         `json:"section_snapshot_id"`
	QuestionID        uint64         `json:"question_id"`
	Type              string         `json:"type"`
	Title             string         `json:"title"`
	Content           map[string]any `json:"content"`
	Score             float64        `json:"score"`
	SortOrder         int            `json:"sort_order"`
	QuestionSortOrder int            `json:"question_sort_order"`
	Answer            map[string]any `json:"-"` // Internal only, never exposed to candidate
	TestCases         []TestCase     `json:"-"` // Internal only, never exposed to candidate
	StarterCode       *string        `json:"starter_code,omitempty"`
	TimeLimitMs       int            `json:"time_limit_ms"`
	MemoryLimitMb     int            `json:"memory_limit_mb"`
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

const (
	ResultStatusGraded         = "GRADED"
	ResultStatusJudging        = "JUDGING"
	ResultStatusManualRequired = "MANUAL_REQUIRED"
)

const (
	QuestionResultStatusCorrect        = "CORRECT"
	QuestionResultStatusIncorrect      = "INCORRECT"
	QuestionResultStatusUnanswered     = "UNANSWERED"
	QuestionResultStatusJudging        = "JUDGING"
	QuestionResultStatusManualRequired = "MANUAL_REQUIRED"
)

type ExamResult struct {
	ID             uint64              `json:"id"`
	ExamID         uint64              `json:"exam_id"`
	ExamSnapshotID uint64              `json:"exam_snapshot_id"`
	ExamSessionID  uint64              `json:"exam_session_id"`
	UserID         uint64              `json:"user_id"`
	Status         string              `json:"status"`
	Score          float64             `json:"score"`
	MaxScore       float64             `json:"max_score"`
	SubmittedAt    time.Time           `json:"submitted_at"`
	GradedAt       *time.Time          `json:"graded_at,omitempty"`
	Sections       []ExamResultSection `json:"sections,omitempty"`
	Questions      []QuestionResult    `json:"questions,omitempty"`
}

type ExamResultSection struct {
	SectionSnapshotID uint64           `json:"section_snapshot_id"`
	Title             string           `json:"title"`
	Description       string           `json:"description"`
	SortOrder         int              `json:"sort_order"`
	Score             float64          `json:"score"`
	MaxScore          float64          `json:"max_score"`
	QuestionCount     int              `json:"question_count"`
	Questions         []QuestionResult `json:"questions,omitempty"`
}

type QuestionResult struct {
	ID                 uint64         `json:"id"`
	ExamResultID       uint64         `json:"exam_result_id"`
	ExamSessionID      uint64         `json:"exam_session_id"`
	SectionSnapshotID  uint64         `json:"section_snapshot_id"`
	QuestionSnapshotID uint64         `json:"question_snapshot_id"`
	QuestionID         uint64         `json:"question_id"`
	Type               string         `json:"type"`
	SortOrder          int            `json:"sort_order"`
	QuestionSortOrder  int            `json:"question_sort_order"`
	Answer             map[string]any `json:"answer,omitempty"`
	Status             string         `json:"status"`
	Score              float64        `json:"score"`
	MaxScore           float64        `json:"max_score"`
	Result             map[string]any `json:"result,omitempty"`
	SubmissionID       *uint64        `json:"submission_id,omitempty"`
	JudgedAt           *time.Time     `json:"judged_at,omitempty"`
}
