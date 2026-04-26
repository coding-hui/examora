package entity

import "time"

const (
	StatusPending = "PENDING"
	StatusQueued  = "QUEUED"
)

type Submission struct {
	ID          uint64         `json:"id"`
	ExamID      uint64         `json:"exam_id"`
	UserID      uint64         `json:"user_id"`
	QuestionID  uint64         `json:"question_id"`
	Answer      map[string]any `json:"answer,omitempty"`
	Code        string         `json:"code,omitempty"`
	Language    string         `json:"language,omitempty"`
	Status      string         `json:"status"`
	Score       float64        `json:"score"`
	Result      map[string]any `json:"result,omitempty"`
	SubmittedAt time.Time      `json:"submitted_at"`
	JudgedAt    *time.Time     `json:"judged_at"`
}
