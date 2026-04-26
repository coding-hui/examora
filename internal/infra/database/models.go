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
