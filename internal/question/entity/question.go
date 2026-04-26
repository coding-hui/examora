package entity

import "time"

const (
	TypeSingleChoice   = "SINGLE_CHOICE"
	TypeMultipleChoice = "MULTIPLE_CHOICE"
	TypeTrueFalse      = "TRUE_FALSE"
	TypeFillBlank      = "FILL_BLANK"
	TypeShortAnswer    = "SHORT_ANSWER"
	TypeProgramming    = "PROGRAMMING"
	StatusDraft        = "DRAFT"
	StatusPublished    = "PUBLISHED"
)

type Question struct {
	ID            uint64         `json:"id"`
	Type          string         `json:"type"`
	Title         string         `json:"title"`
	Content       map[string]any `json:"content"`
	Answer        map[string]any `json:"answer,omitempty"`
	Difficulty    *string        `json:"difficulty,omitempty"`
	Language      *string        `json:"language,omitempty"`
	StarterCode   *string        `json:"starter_code,omitempty"`
	TimeLimitMS   int            `json:"time_limit_ms"`
	MemoryLimitMB int            `json:"memory_limit_mb"`
	Status        string         `json:"status"`
	CreatedBy     uint64         `json:"created_by"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
}

type TestCase struct {
	ID             uint64    `json:"id"`
	QuestionID     uint64    `json:"question_id"`
	Input          string    `json:"input"`
	ExpectedOutput string    `json:"expected_output,omitempty"`
	TimeLimitMS    int       `json:"time_limit_ms"`
	MemoryLimitMB  int       `json:"memory_limit_mb"`
	IsSample       bool      `json:"is_sample"`
	IsHidden       bool      `json:"is_hidden"`
	SortOrder      int       `json:"sort_order"`
	CreatedAt      time.Time `json:"created_at"`
}
