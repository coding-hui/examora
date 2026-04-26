package database

import (
	"time"

	"gorm.io/datatypes"
)

type UserModel struct {
	ID              uint64  `gorm:"primaryKey"`
	Username        *string `gorm:"size:64;uniqueIndex"`
	Email           *string `gorm:"size:128"`
	PasswordHash    string
	ExternalSubject string `gorm:"uniqueIndex"`
	AuthProvider    string
	DisplayName     *string
	RoleCode        *string
	Status          string
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

func (UserModel) TableName() string { return "users" }

type QuestionModel struct {
	ID            uint64 `gorm:"primaryKey"`
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
	CreatedBy     uint64
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

func (QuestionModel) TableName() string { return "questions" }

type TestCaseModel struct {
	ID             uint64 `gorm:"primaryKey"`
	QuestionID     uint64
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
	ID          uint64 `gorm:"primaryKey"`
	Title       string
	Description string
	Status      string
	CreatedBy   uint64
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

func (PaperModel) TableName() string { return "papers" }

type PaperQuestionModel struct {
	ID         uint64 `gorm:"primaryKey"`
	PaperID    uint64
	QuestionID uint64
	Score      float64
	SortOrder  int
	CreatedAt  time.Time
}

func (PaperQuestionModel) TableName() string { return "paper_questions" }

type ExamModel struct {
	ID              uint64 `gorm:"primaryKey"`
	Title           string
	Description     string
	PaperID         uint64
	Status          string
	StartTime       *time.Time
	EndTime         *time.Time
	DurationMinutes int
	CreatedBy       uint64
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

func (ExamModel) TableName() string { return "exams" }

type SubmissionModel struct {
	ID          uint64 `gorm:"primaryKey"`
	ExamID      uint64
	UserID      uint64
	QuestionID  uint64
	Answer      datatypes.JSON
	Code        string
	Language    string
	Status      string
	Score       float64
	Result      datatypes.JSON
	SubmittedAt time.Time
	JudgedAt    *time.Time
}

func (SubmissionModel) TableName() string { return "submissions" }

type JudgeTaskModel struct {
	ID            uint64 `gorm:"primaryKey"`
	SubmissionID  uint64
	QuestionID    uint64
	UserID        uint64
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
	ID        uint64 `gorm:"primaryKey"`
	ExamID    uint64
	UserID    uint64
	DeviceID  *string
	EventType string
	Payload   datatypes.JSON
	CreatedAt time.Time
}

func (ClientEventModel) TableName() string { return "client_events" }
