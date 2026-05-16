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
	ExamID     uint64
	QuestionID uint64
	Answer     map[string]any
	Code       string
	Language   string
}

type CreatedSubmission struct {
	Submission *Submission `json:"submission"`
}

func (s *Service) CreateSubmission(ctx context.Context, examID uint64, userID uint64, cmd CreateSubmissionCommand) (*CreatedSubmission, error) {
	if cmd.ExamID != 0 && cmd.ExamID != examID {
		return nil, ErrForbidden
	}
	if err := s.ensureCandidateExamOpen(ctx, examID); err != nil {
		return nil, err
	}
	snapshot, err := s.store.GetExamSnapshotByExamID(ctx, examID)
	if err != nil {
		return nil, err
	}
	session, err := s.store.GetExamSession(ctx, snapshot.ID, userID)
	if err != nil {
		return nil, ErrForbidden
	}
	if session.Status != SessionStatusInProgress {
		return nil, ErrForbidden
	}
	questionSnapshots, err := s.store.ListQuestionSnapshots(ctx, snapshot.ID)
	if err != nil {
		return nil, err
	}
	resolvedQuestionID := uint64(0)
	for _, questionSnapshot := range questionSnapshots {
		if questionSnapshot.ID == cmd.QuestionID {
			resolvedQuestionID = questionSnapshot.ID
			break
		}
		if questionSnapshot.QuestionID == cmd.QuestionID {
			resolvedQuestionID = questionSnapshot.ID
		}
	}
	if resolvedQuestionID == 0 {
		return nil, ErrForbidden
	}
	status := SubmissionStatusPending
	sub := &Submission{ExamID: examID, UserID: userID, QuestionID: resolvedQuestionID, Answer: cmd.Answer, Code: cmd.Code, Language: cmd.Language, Status: status}
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
