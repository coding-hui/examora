package postgres

import (
	"context"
	"encoding/json"
	"time"

	"github.com/coding-hui/examora/internal/judge/usecase"
	"github.com/coding-hui/examora/internal/platform/database"
	"github.com/coding-hui/examora/internal/platform/transaction"
	"github.com/coding-hui/examora/internal/submission/entity"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type Repository struct{ db *gorm.DB }

func New(db *gorm.DB) *Repository { return &Repository{db: db} }
func (r *Repository) Create(ctx context.Context, s *entity.Submission) error {
	row := toModel(s)
	row.SubmittedAt = time.Now().UTC()
	if err := transaction.DBFromContext(ctx, r.db).Create(row).Error; err != nil {
		return err
	}
	*s = *toEntity(row)
	return nil
}
func (r *Repository) FindByID(ctx context.Context, id uint64) (*entity.Submission, error) {
	var row database.SubmissionModel
	if err := transaction.DBFromContext(ctx, r.db).First(&row, id).Error; err != nil {
		return nil, err
	}
	return toEntity(&row), nil
}
func (r *Repository) FindForJudge(ctx context.Context, id uint64) (*usecase.SubmissionDTO, error) {
	var row database.SubmissionModel
	if err := transaction.DBFromContext(ctx, r.db).First(&row, id).Error; err != nil {
		return nil, err
	}
	return &usecase.SubmissionDTO{ID: row.ID, QuestionID: row.QuestionID, UserID: row.UserID, Code: row.Code, Language: row.Language}, nil
}
func (r *Repository) UpdateJudgeResult(ctx context.Context, submissionID uint64, status string, score float64, result map[string]any) error {
	now := time.Now().UTC()
	return transaction.DBFromContext(ctx, r.db).Model(&database.SubmissionModel{}).Where("id = ?", submissionID).Updates(map[string]any{"status": status, "score": score, "result": fromMap(result), "judged_at": &now}).Error
}
func toEntity(m *database.SubmissionModel) *entity.Submission {
	return &entity.Submission{ID: m.ID, ExamID: m.ExamID, UserID: m.UserID, QuestionID: m.QuestionID, Answer: toMap(m.Answer), Code: m.Code, Language: m.Language, Status: m.Status, Score: m.Score, Result: toMap(m.Result), SubmittedAt: m.SubmittedAt, JudgedAt: m.JudgedAt}
}
func toModel(s *entity.Submission) *database.SubmissionModel {
	return &database.SubmissionModel{ID: s.ID, ExamID: s.ExamID, UserID: s.UserID, QuestionID: s.QuestionID, Answer: fromMap(s.Answer), Code: s.Code, Language: s.Language, Status: s.Status, Score: s.Score, Result: fromMap(s.Result), SubmittedAt: s.SubmittedAt, JudgedAt: s.JudgedAt}
}
func toMap(data datatypes.JSON) map[string]any {
	if len(data) == 0 {
		return nil
	}
	var out map[string]any
	_ = json.Unmarshal(data, &out)
	return out
}
func fromMap(data map[string]any) datatypes.JSON {
	if data == nil {
		return nil
	}
	raw, _ := json.Marshal(data)
	return datatypes.JSON(raw)
}
