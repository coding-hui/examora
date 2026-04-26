package usecase

import (
	"context"
	"strings"
	"time"

	"github.com/coding-hui/examora/internal/judge/entity"
	"github.com/coding-hui/examora/internal/kernel"
)

type Usecase struct {
	tasks       JudgeRepository
	submissions SubmissionRepository
	questions   QuestionReader
	queue       JudgeQueue
	sandbox     SandboxRunner
	tx          TransactionManager
}

func New(tasks JudgeRepository, submissions SubmissionRepository, questions QuestionReader, queue JudgeQueue, sandbox SandboxRunner, tx TransactionManager) *Usecase {
	return &Usecase{tasks: tasks, submissions: submissions, questions: questions, queue: queue, sandbox: sandbox, tx: tx}
}

func (u *Usecase) CreateAndEnqueue(ctx context.Context, submissionID, questionID, userID uint64, language string) (*entity.Task, error) {
	task, err := entity.NewTask(submissionID, questionID, userID, language)
	if err != nil {
		return nil, err
	}
	if err := task.MarkQueued(); err != nil {
		return nil, err
	}
	if err := u.tasks.Create(ctx, task); err != nil {
		return nil, err
	}
	payload := JudgeTaskPayload{JudgeTaskID: task.ID, SubmissionID: submissionID, QuestionID: questionID, UserID: userID, Language: language}
	if err := u.queue.EnqueueJudgeTask(ctx, payload); err != nil {
		return nil, err
	}
	return task, nil
}

func (u *Usecase) List(ctx context.Context, q kernel.PageQuery) (kernel.PageResult[entity.Task], error) {
	items, total, err := u.tasks.List(ctx, q.Normalize())
	if err != nil {
		return kernel.PageResult[entity.Task]{}, err
	}
	q = q.Normalize()
	return kernel.PageResult[entity.Task]{Items: items, Total: total, Page: q.Page, PageSize: q.PageSize}, nil
}

func (u *Usecase) Get(ctx context.Context, id uint64) (*entity.Task, error) {
	return u.tasks.FindByID(ctx, id)
}

func (u *Usecase) ProcessTask(ctx context.Context, payload JudgeTaskPayload) error {
	task, err := u.tasks.FindByID(ctx, payload.JudgeTaskID)
	if err != nil {
		return err
	}
	now := time.Now().UTC()
	if err := task.MarkRunning(now); err != nil {
		return err
	}
	if err := u.tasks.Update(ctx, task); err != nil {
		return err
	}

	submission, err := u.submissions.FindForJudge(ctx, payload.SubmissionID)
	if err != nil {
		return err
	}
	testCases, err := u.questions.ListJudgeTestCases(ctx, submission.QuestionID)
	if err != nil {
		return err
	}

	status := entity.StatusAccepted
	var errMessage *string
	passed := 0
	for _, tc := range testCases {
		result, err := u.sandbox.Run(ctx, SandboxRunRequest{Language: submission.Language, SourceCode: submission.Code, Stdin: tc.Input, TimeLimitMS: tc.TimeLimitMS, MemoryLimitMB: tc.MemoryLimitMB})
		if err != nil {
			status = entity.StatusSystemError
			msg := err.Error()
			errMessage = &msg
			break
		}
		status = result.Status
		if result.Status != entity.StatusAccepted {
			msg := result.Stderr
			errMessage = &msg
			break
		}
		if normalize(result.Stdout) != normalize(tc.ExpectedOutput) {
			status = entity.StatusWrongAnswer
			msg := "output mismatch"
			errMessage = &msg
			break
		}
		passed++
	}
	score := 100.0
	if len(testCases) > 0 {
		score = float64(passed) / float64(len(testCases)) * 100
	}
	summary := map[string]any{"total_cases": len(testCases), "passed_cases": passed, "final_status": status}
	if err := task.Complete(status, summary, errMessage, time.Now().UTC()); err != nil {
		return err
	}
	if err := u.tasks.Update(ctx, task); err != nil {
		return err
	}
	return u.submissions.UpdateJudgeResult(ctx, submission.ID, status, score, summary)
}

func normalize(s string) string {
	return strings.TrimSpace(strings.ReplaceAll(s, "\r\n", "\n"))
}
