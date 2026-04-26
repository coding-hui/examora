package usecase

import (
	"context"

	"github.com/coding-hui/examora/internal/judge/entity"
	"github.com/coding-hui/examora/internal/kernel"
)

type JudgeRepository interface {
	Create(ctx context.Context, task *entity.Task) error
	FindByID(ctx context.Context, id uint64) (*entity.Task, error)
	Update(ctx context.Context, task *entity.Task) error
	List(ctx context.Context, query kernel.PageQuery) ([]entity.Task, int64, error)
}

type SubmissionRepository interface {
	FindForJudge(ctx context.Context, id uint64) (*SubmissionDTO, error)
	UpdateJudgeResult(ctx context.Context, submissionID uint64, status string, score float64, result map[string]any) error
}

type QuestionReader interface {
	ListJudgeTestCases(ctx context.Context, questionID uint64) ([]TestCaseDTO, error)
}

type JudgeQueue interface {
	EnqueueJudgeTask(ctx context.Context, payload JudgeTaskPayload) error
}

type SandboxRunner interface {
	Run(ctx context.Context, req SandboxRunRequest) (*SandboxRunResult, error)
}

type TransactionManager interface {
	WithTx(ctx context.Context, fn func(ctx context.Context) error) error
}
