package database

import (
	"time"

	"gorm.io/datatypes"
)

type UserModel struct {
	ID              uint64  `gorm:"primaryKey;autoIncrement"`
	Username        string  `gorm:"size:64;not null;uniqueIndex"`
	PasswordHash    string  `gorm:"column:password_hash;size:255;not null"`
	Status          string  `gorm:"size:32;not null;default:ACTIVE"`
	DisplayName     *string `gorm:"size:128"`
	Email           *string `gorm:"column:email;size:255;index"`
	AuthProvider    *string `gorm:"column:auth_provider;size:32"`
	ExternalSubject *string `gorm:"column:external_subject;size:128;uniqueIndex"`
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

func (UserModel) TableName() string { return "users" }

type QuestionModel struct {
	ID            uint64 `gorm:"primaryKey;autoIncrement"`
	Type          string
	Title         string
	Content       datatypes.JSON
	Answer        datatypes.JSON
	Difficulty    *string
	Language      *string
	StarterCode   *string
	TimeLimitMS   int
	MemoryLimitMB int
	Status        string
	CreatedBy     uint64 `gorm:"default:0"`
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

func (QuestionModel) TableName() string { return "questions" }

type TestCaseModel struct {
	ID             uint64 `gorm:"primaryKey;autoIncrement"`
	QuestionID     uint64 `gorm:"index"`
	Input          string
	ExpectedOutput string
	TimeLimitMS    int
	MemoryLimitMB  int
	IsSample       bool
	IsHidden       bool
	SortOrder      int
	CreatedAt      time.Time
}

func (TestCaseModel) TableName() string { return "test_cases" }

type PaperModel struct {
	ID          uint64 `gorm:"primaryKey;autoIncrement"`
	Title       string
	Description string
	Status      string
	CreatedBy   uint64 `gorm:"default:0"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

func (PaperModel) TableName() string { return "papers" }

type PaperQuestionModel struct {
	ID         uint64 `gorm:"primaryKey;autoIncrement"`
	PaperID    uint64 `gorm:"index"`
	QuestionID uint64 `gorm:"index"`
	Score      float64
	SortOrder  int
	CreatedAt  time.Time
}

func (PaperQuestionModel) TableName() string { return "paper_questions" }

type ExamModel struct {
	ID              uint64 `gorm:"primaryKey;autoIncrement"`
	Title           string
	Description     string
	PaperID         *uint64 `gorm:"index"`
	Status          string
	StartTime       *time.Time
	EndTime         *time.Time
	DurationMinutes int
	CreatedBy       uint64 `gorm:"default:0"`
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

func (ExamModel) TableName() string { return "exams" }

type SubmissionModel struct {
	ID          uint64 `gorm:"primaryKey;autoIncrement"`
	ExamID      uint64 `gorm:"index"`
	UserID      uint64 `gorm:"index;default:0"`
	QuestionID  uint64
	Answer      datatypes.JSON
	Code        string
	Language    string
	Status      string
	Score       float64
	Result      datatypes.JSON
	SubmittedAt time.Time `gorm:"index"`
	JudgedAt    *time.Time
}

func (SubmissionModel) TableName() string { return "submissions" }

type JudgeTaskModel struct {
	ID            uint64 `gorm:"primaryKey;autoIncrement"`
	SubmissionID  uint64 `gorm:"index"`
	QuestionID    uint64
	UserID        uint64 `gorm:"index;default:0"`
	Language      string
	Status        string
	RetryCount    int
	MaxRetryCount int
	ErrorMessage  *string
	ResultSummary datatypes.JSON
	CreatedAt     time.Time
	UpdatedAt     time.Time
	StartedAt     *time.Time
	FinishedAt    *time.Time
}

func (JudgeTaskModel) TableName() string { return "judge_tasks" }

type ClientEventModel struct {
	ID        uint64 `gorm:"primaryKey;autoIncrement"`
	ExamID    uint64 `gorm:"index"`
	UserID    uint64 `gorm:"index;default:0"`
	DeviceID  *string
	EventType string
	Payload   datatypes.JSON
	CreatedAt time.Time `gorm:"index"`
}

func (ClientEventModel) TableName() string { return "client_events" }

// =====================================================================
// M1: Snapshot models for exam publishing
// =====================================================================

type ExamSnapshotModel struct {
	ID              uint64    `gorm:"primaryKey;autoIncrement"`
	ExamID          uint64    `gorm:"uniqueIndex"`
	PaperSnapshotID uint64    // Currently points to paper_id directly; future: paper_snapshot table
	StartTime       time.Time `gorm:"not null"`
	EndTime         time.Time `gorm:"not null"`
	DurationMinutes int       `gorm:"not null"`
	PublishedAt     time.Time `gorm:"not null"`
}

func (ExamSnapshotModel) TableName() string { return "exam_snapshots" }

type QuestionSnapshotModel struct {
	ID             uint64         `gorm:"primaryKey;autoIncrement"`
	ExamSnapshotID uint64         `gorm:"index"`
	QuestionID     uint64         `gorm:"index"`
	Type           string         `gorm:"size:32;not null"`
	Title          string         `gorm:"size:255;not null"`
	Content        datatypes.JSON `gorm:"not null;default:'{}'"`
	Score          float64        `gorm:"not null;default:0"`
	SortOrder      int            `gorm:"not null;default:0"`
	// Internal-only fields (candidate API must never expose these)
	Answer        datatypes.JSON
	TestCases     datatypes.JSON `gorm:"type:jsonb"`
	StarterCode   *string
	TimeLimitMS   int       `gorm:"default:2000"`
	MemoryLimitMB int       `gorm:"default:256"`
	CreatedAt     time.Time `gorm:"not null"`
}

func (QuestionSnapshotModel) TableName() string { return "question_snapshots" }

type ExamSessionModel struct {
	ID               uint64 `gorm:"primaryKey;autoIncrement"`
	ExamSnapshotID   uint64 `gorm:"index;uniqueIndex:idx_exam_sessions_exam_user;not null"`
	UserID           uint64 `gorm:"index;uniqueIndex:idx_exam_sessions_exam_user;not null;default:0"`
	Status           string `gorm:"size:32;not null;default:NOT_STARTED"`
	StartedAt        *time.Time
	SubmittedAt      *time.Time
	RemainingSeconds *int
	IPAddress        *string   `gorm:"size:64"`
	DeviceID         *string   `gorm:"size:128"`
	CreatedAt        time.Time `gorm:"not null"`
	UpdatedAt        time.Time `gorm:"not null"`
}

func (ExamSessionModel) TableName() string { return "exam_sessions" }

// AnswerDraftModel stores candidate answer drafts for objective questions
type AnswerDraftModel struct {
	ID            uint64         `gorm:"primaryKey;autoIncrement"`
	ExamSessionID uint64         `gorm:"uniqueIndex:idx_answer_draft_session_question"`
	QuestionID    uint64         `gorm:"uniqueIndex:idx_answer_draft_session_question"`
	Answer        datatypes.JSON `gorm:"type:jsonb"`
	SavedAt       time.Time      `gorm:"not null"`
}

func (AnswerDraftModel) TableName() string { return "answer_drafts" }
