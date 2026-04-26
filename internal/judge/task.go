package judge

import (
	"errors"
	"time"
)

const (
	StatusPending             = "PENDING"
	StatusQueued              = "QUEUED"
	StatusRunning             = "RUNNING"
	StatusAccepted            = "ACCEPTED"
	StatusWrongAnswer         = "WRONG_ANSWER"
	StatusCompileError        = "COMPILE_ERROR"
	StatusRuntimeError        = "RUNTIME_ERROR"
	StatusTimeLimitExceeded   = "TIME_LIMIT_EXCEEDED"
	StatusMemoryLimitExceeded = "MEMORY_LIMIT_EXCEEDED"
	StatusSystemError         = "SYSTEM_ERROR"
	StatusCanceled            = "CANCELED"
)

var ErrInvalidStatusTransition = errors.New("invalid judge status transition")

type Task struct {
	ID            uint64         `json:"id"`
	SubmissionID  uint64         `json:"submission_id"`
	QuestionID    uint64         `json:"question_id"`
	UserID        uint64         `json:"user_id"`
	Language      string         `json:"language"`
	Status        string         `json:"status"`
	RetryCount    int            `json:"retry_count"`
	MaxRetryCount int            `json:"max_retry_count"`
	ErrorMessage  *string        `json:"error_message"`
	ResultSummary map[string]any `json:"result_summary,omitempty"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	StartedAt     *time.Time     `json:"started_at"`
	FinishedAt    *time.Time     `json:"finished_at"`
}

func NewTask(submissionID, questionID, userID uint64, language string) (*Task, error) {
	if submissionID == 0 || questionID == 0 || userID == 0 || language == "" {
		return nil, errors.New("invalid judge task")
	}
	return &Task{SubmissionID: submissionID, QuestionID: questionID, UserID: userID, Language: language, Status: StatusPending, MaxRetryCount: 3}, nil
}

func (t *Task) MarkQueued() error {
	if t.Status != StatusPending {
		return ErrInvalidStatusTransition
	}
	t.Status = StatusQueued
	return nil
}

func (t *Task) MarkRunning(now time.Time) error {
	if t.Status != StatusQueued {
		return ErrInvalidStatusTransition
	}
	t.Status = StatusRunning
	t.StartedAt = &now
	return nil
}

func (t *Task) Complete(status string, summary map[string]any, errMessage *string, now time.Time) error {
	if t.Status != StatusRunning {
		return ErrInvalidStatusTransition
	}
	t.Status = status
	t.ResultSummary = summary
	t.ErrorMessage = errMessage
	t.FinishedAt = &now
	return nil
}
