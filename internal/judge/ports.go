package judge

import (
	"context"

	"github.com/coding-hui/examora/internal/exam"
	"github.com/coding-hui/examora/internal/library"
)

type TaskStore interface {
	Create(ctx context.Context, task *Task) error
	FindByID(ctx context.Context, id uint64) (*Task, error)
	Update(ctx context.Context, task *Task) error
	Delete(ctx context.Context, id uint64) error
	List(ctx context.Context, pageNum, pageSize int) ([]Task, int64, error)
}

type SubmissionReceiver interface {
	FindForJudge(ctx context.Context, id uint64) (*exam.JudgeSubmission, error)
	UpdateJudgeResult(ctx context.Context, submissionID uint64, status string, score float64, result map[string]any) error
}

type QuestionReceiver interface {
	ListJudgeTestCases(ctx context.Context, questionID uint64) ([]library.JudgeTestCase, error)
}

type Queue interface {
	EnqueueJudgeTask(ctx context.Context, payload TaskPayload) error
}

type SandboxRunner interface {
	Run(ctx context.Context, req SandboxRunRequest) (*SandboxRunResult, error)
}

type TransactionManager interface {
	WithTx(ctx context.Context, fn func(ctx context.Context) error) error
}

type TaskPayload struct {
	JudgeTaskID  uint64 `json:"judge_task_id"`
	SubmissionID uint64 `json:"submission_id"`
	QuestionID   uint64 `json:"question_id"`
	UserID       uint64 `json:"user_id"`
	Language     string `json:"language"`
}

type SandboxRunRequest struct {
	Language      string `json:"language"`
	SourceCode    string `json:"source_code"`
	Stdin         string `json:"stdin"`
	TimeLimitMS   int    `json:"time_limit_ms"`
	MemoryLimitMB int    `json:"memory_limit_mb"`
}

type SandboxRunResult struct {
	Status   string `json:"status"`
	Stdout   string `json:"stdout"`
	Stderr   string `json:"stderr"`
	ExitCode int    `json:"exit_code"`
	TimeMS   int64  `json:"time_ms"`
	MemoryKB int64  `json:"memory_kb"`
}
