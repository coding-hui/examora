package store

import (
	"context"
	"time"

	"github.com/coding-hui/examora/internal/exam"
	"github.com/coding-hui/examora/internal/infra/database"
)

func (s *Store) FindForJudge(ctx context.Context, id uint64) (*exam.JudgeSubmission, error) {
	var row database.SubmissionModel
	if err := s.db(ctx).First(&row, "id = ?", id).Error; err != nil {
		return nil, database.MapNotFound(err, exam.ErrSubmissionNotFound)
	}
	return &exam.JudgeSubmission{ID: row.ID, QuestionID: row.QuestionID, UserID: row.UserID, Code: row.Code, Language: row.Language}, nil
}

func (s *Store) UpdateJudgeResult(ctx context.Context, submissionID uint64, status string, score float64, result map[string]any) error {
	now := time.Now().UTC()
	return s.db(ctx).Model(&database.SubmissionModel{}).Where("id = ?", submissionID).Updates(map[string]any{"status": status, "score": score, "result": mapToJSON(result), "judged_at": &now}).Error
}
