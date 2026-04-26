package entity

import "time"

const (
	StatusDraft     = "DRAFT"
	StatusPublished = "PUBLISHED"
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
