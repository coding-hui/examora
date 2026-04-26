package usecase

import (
	"context"

	judgeentity "github.com/coding-hui/examora/internal/judge/entity"
	"github.com/coding-hui/examora/internal/submission/entity"
)

type Repository interface {
	Create(ctx context.Context, submission *entity.Submission) error
	FindByID(ctx context.Context, id uint64) (*entity.Submission, error)
}

type JudgeCreator interface {
	CreateAndEnqueue(ctx context.Context, submissionID, questionID, userID uint64, language string) (*judgeentity.Task, error)
}

type Usecase struct {
	repo  Repository
	judge JudgeCreator
}

func New(repo Repository, judge JudgeCreator) *Usecase { return &Usecase{repo: repo, judge: judge} }

type CreateSubmissionRequest struct {
	QuestionID uint64         `json:"question_id"`
	Answer     map[string]any `json:"answer"`
	Code       string         `json:"code"`
	Language   string         `json:"language"`
}

type CreatedSubmission struct {
	Submission *entity.Submission `json:"submission"`
	JudgeTask  *judgeentity.Task  `json:"judge_task,omitempty"`
}

func (u *Usecase) Create(ctx context.Context, examID, userID uint64, req CreateSubmissionRequest) (*CreatedSubmission, error) {
	status := entity.StatusPending
	s := &entity.Submission{ExamID: examID, UserID: userID, QuestionID: req.QuestionID, Answer: req.Answer, Code: req.Code, Language: req.Language, Status: status}
	if err := u.repo.Create(ctx, s); err != nil {
		return nil, err
	}
	var task *judgeentity.Task
	if req.Code != "" && req.Language != "" {
		var err error
		task, err = u.judge.CreateAndEnqueue(ctx, s.ID, s.QuestionID, s.UserID, s.Language)
		if err != nil {
			return nil, err
		}
		s.Status = entity.StatusQueued
	}
	return &CreatedSubmission{Submission: s, JudgeTask: task}, nil
}

func (u *Usecase) Get(ctx context.Context, id, userID uint64) (*entity.Submission, error) {
	s, err := u.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if s.UserID != userID {
		return nil, ErrForbidden
	}
	return s, nil
}

var ErrForbidden = forbiddenError{}

type forbiddenError struct{}

func (forbiddenError) Error() string { return "submission does not belong to current user" }
