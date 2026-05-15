package store

import (
	"context"
	"time"

	"github.com/coding-hui/examora/internal/exam"
	"github.com/coding-hui/examora/internal/infra/database"
)

func (s *Store) SaveAnswerDraft(ctx context.Context, sessionID, questionID uint64, answer map[string]any) error {
	row := &database.AnswerDraftModel{
		ExamSessionID: sessionID,
		QuestionID:    questionID,
		Answer:        mapToJSON(answer),
		SavedAt:       time.Now(),
	}
	return s.db(ctx).
		Where("exam_session_id = ? AND question_id = ?", sessionID, questionID).
		Assign(database.AnswerDraftModel{Answer: row.Answer, SavedAt: row.SavedAt}).
		FirstOrCreate(row).Error
}

func (s *Store) GetAnswerDraft(ctx context.Context, sessionID, questionID uint64) (*exam.AnswerDraft, error) {
	var row database.AnswerDraftModel
	if err := s.db(ctx).Where("exam_session_id = ? AND question_id = ?", sessionID, questionID).First(&row).Error; err != nil {
		return nil, err
	}
	return &exam.AnswerDraft{
		ID:            row.ID,
		ExamSessionID: row.ExamSessionID,
		QuestionID:    row.QuestionID,
		Answer:        jsonToMap(row.Answer),
	}, nil
}

func (s *Store) ListAnswerDrafts(ctx context.Context, sessionID uint64) ([]exam.AnswerDraft, error) {
	var rows []database.AnswerDraftModel
	if err := s.db(ctx).Where("exam_session_id = ?", sessionID).Find(&rows).Error; err != nil {
		return nil, err
	}
	items := make([]exam.AnswerDraft, 0, len(rows))
	for _, row := range rows {
		items = append(items, exam.AnswerDraft{
			ID:            row.ID,
			ExamSessionID: row.ExamSessionID,
			QuestionID:    row.QuestionID,
			Answer:        jsonToMap(row.Answer),
		})
	}
	return items, nil
}
