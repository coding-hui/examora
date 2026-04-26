package exam

import (
	"context"
	"time"
)

const (
	SubmissionStatusPending = "PENDING"
	SubmissionStatusQueued  = "QUEUED"
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

type CreateSubmissionCommand struct {
	QuestionID uint64
	Answer     map[string]any
	Code       string
	Language   string
}

type CreatedSubmission struct {
	Submission *Submission `json:"submission"`
}

func (s *Service) CreateSubmission(ctx context.Context, examID uint64, userID uint64, cmd CreateSubmissionCommand) (*CreatedSubmission, error) {
	status := SubmissionStatusPending
	sub := &Submission{ExamID: examID, UserID: userID, QuestionID: cmd.QuestionID, Answer: cmd.Answer, Code: cmd.Code, Language: cmd.Language, Status: status}
	if err := s.store.CreateSubmission(ctx, sub); err != nil {
		return nil, err
	}
	if cmd.Code != "" && cmd.Language != "" {
		if err := s.judge.CreateAndEnqueue(ctx, sub.ID, sub.QuestionID, sub.UserID, sub.Language); err != nil {
			return nil, err
		}
		sub.Status = SubmissionStatusQueued
		if err := s.store.UpdateSubmissionStatus(ctx, sub.ID, SubmissionStatusQueued); err != nil {
			return nil, err
		}
	}
	return &CreatedSubmission{Submission: sub}, nil
}

func (s *Service) GetSubmission(ctx context.Context, id uint64, userID uint64) (*Submission, error) {
	sub, err := s.store.GetSubmission(ctx, id)
	if err != nil {
		return nil, err
	}
	if sub.UserID != userID {
		return nil, ErrForbidden
	}
	return sub, nil
}
