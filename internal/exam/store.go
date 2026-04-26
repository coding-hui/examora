package exam

import (
	"context"

	"github.com/coding-hui/examora/internal/page"
)

type JudgeDispatcher interface {
	CreateAndEnqueue(ctx context.Context, submissionID, questionID, userID uint64, language string) error
}

type Store interface {
	ExamStore
	SubmissionStore
	ClientEventStore
	SubmissionReader
}

type ExamStore interface {
	ListExams(ctx context.Context, query page.Query) ([]Exam, int64, error)
	GetExam(ctx context.Context, id uint64) (*Exam, error)
	CreateExam(ctx context.Context, e *Exam) error
	UpdateExam(ctx context.Context, e *Exam) error
}

type SubmissionStore interface {
	CreateSubmission(ctx context.Context, s *Submission) error
	GetSubmission(ctx context.Context, id uint64) (*Submission, error)
	UpdateSubmissionStatus(ctx context.Context, id uint64, status string) error
}

type ClientEventStore interface {
	CreateClientEvent(ctx context.Context, ev *ClientEvent) error
}

type JudgeSubmission struct {
	ID         uint64
	QuestionID uint64
	UserID     uint64
	Code       string
	Language   string
}

type SubmissionReader interface {
	FindForJudge(ctx context.Context, id uint64) (*JudgeSubmission, error)
	UpdateJudgeResult(ctx context.Context, submissionID uint64, status string, score float64, result map[string]any) error
}
