package postgres

import (
	"context"
	"encoding/json"

	"github.com/coding-hui/examora/internal/judge/entity"
	"github.com/coding-hui/examora/internal/kernel"
	"github.com/coding-hui/examora/internal/platform/database"
	"github.com/coding-hui/examora/internal/platform/transaction"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type Repository struct{ db *gorm.DB }

func New(db *gorm.DB) *Repository { return &Repository{db: db} }
func (r *Repository) Create(ctx context.Context, t *entity.Task) error {
	row := toModel(t)
	if err := transaction.DBFromContext(ctx, r.db).Create(row).Error; err != nil {
		return err
	}
	*t = *toEntity(row)
	return nil
}
func (r *Repository) FindByID(ctx context.Context, id uint64) (*entity.Task, error) {
	var row database.JudgeTaskModel
	if err := transaction.DBFromContext(ctx, r.db).First(&row, id).Error; err != nil {
		return nil, err
	}
	return toEntity(&row), nil
}
func (r *Repository) Update(ctx context.Context, t *entity.Task) error {
	row := toModel(t)
	if err := transaction.DBFromContext(ctx, r.db).Save(row).Error; err != nil {
		return err
	}
	*t = *toEntity(row)
	return nil
}
func (r *Repository) List(ctx context.Context, q kernel.PageQuery) ([]entity.Task, int64, error) {
	db := transaction.DBFromContext(ctx, r.db).Model(&database.JudgeTaskModel{})
	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var rows []database.JudgeTaskModel
	if err := db.Order("id DESC").Offset(q.Offset()).Limit(q.PageSize).Find(&rows).Error; err != nil {
		return nil, 0, err
	}
	items := make([]entity.Task, 0, len(rows))
	for _, row := range rows {
		items = append(items, *toEntity(&row))
	}
	return items, total, nil
}
func toEntity(m *database.JudgeTaskModel) *entity.Task {
	return &entity.Task{ID: m.ID, SubmissionID: m.SubmissionID, QuestionID: m.QuestionID, UserID: m.UserID, Language: m.Language, Status: m.Status, RetryCount: m.RetryCount, MaxRetryCount: m.MaxRetryCount, ErrorMessage: m.ErrorMessage, ResultSummary: toMap(m.ResultSummary), CreatedAt: m.CreatedAt, UpdatedAt: m.UpdatedAt, StartedAt: m.StartedAt, FinishedAt: m.FinishedAt}
}
func toModel(t *entity.Task) *database.JudgeTaskModel {
	return &database.JudgeTaskModel{ID: t.ID, SubmissionID: t.SubmissionID, QuestionID: t.QuestionID, UserID: t.UserID, Language: t.Language, Status: t.Status, RetryCount: t.RetryCount, MaxRetryCount: t.MaxRetryCount, ErrorMessage: t.ErrorMessage, ResultSummary: fromMap(t.ResultSummary), StartedAt: t.StartedAt, FinishedAt: t.FinishedAt}
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
