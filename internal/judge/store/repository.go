package store

import (
	"context"
	"encoding/json"

	"gorm.io/datatypes"
	"gorm.io/gorm"

	"github.com/coding-hui/examora/internal/infra/database"
	"github.com/coding-hui/examora/internal/infra/transaction"
	"github.com/coding-hui/examora/internal/judge"
	"github.com/coding-hui/examora/internal/page"
)

var _ judge.TaskStore = (*Store)(nil)

type Store struct{ db *gorm.DB }

func New(db *gorm.DB) *Store {
	return &Store{db: db}
}

func (r *Store) Create(ctx context.Context, t *judge.Task) error {
	row := toModel(t)
	if err := transaction.DBFromContext(ctx, r.db).Create(row).Error; err != nil {
		return err
	}
	*t = *toTaskModel(row)
	return nil
}

func (r *Store) FindByID(ctx context.Context, id uint64) (*judge.Task, error) {
	var row database.JudgeTaskModel
	if err := transaction.DBFromContext(ctx, r.db).First(&row, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return toTaskModel(&row), nil
}

func (r *Store) Delete(ctx context.Context, id uint64) error {
	return transaction.DBFromContext(ctx, r.db).Delete(&database.JudgeTaskModel{}, "id = ?", id).Error
}

func (r *Store) Update(ctx context.Context, t *judge.Task) error {
	row := toModel(t)
	if err := transaction.DBFromContext(ctx, r.db).Save(row).Error; err != nil {
		return err
	}
	*t = *toTaskModel(row)
	return nil
}

func (r *Store) List(ctx context.Context, q page.Query) ([]judge.Task, int64, error) {
	db := transaction.DBFromContext(ctx, r.db).Model(&database.JudgeTaskModel{})
	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var rows []database.JudgeTaskModel
	if err := db.Order("id DESC").Offset(q.Offset()).Limit(q.PageSize).Find(&rows).Error; err != nil {
		return nil, 0, err
	}
	items := make([]judge.Task, 0, len(rows))
	for _, row := range rows {
		items = append(items, *toTaskModel(&row))
	}
	return items, total, nil
}

func toTaskModel(m *database.JudgeTaskModel) *judge.Task {
	return &judge.Task{ID: m.ID, SubmissionID: m.SubmissionID, QuestionID: m.QuestionID, UserID: m.UserID, Language: m.Language, Status: m.Status, RetryCount: m.RetryCount, MaxRetryCount: m.MaxRetryCount, ErrorMessage: m.ErrorMessage, ResultSummary: mapFromJSON(m.ResultSummary), CreatedAt: m.CreatedAt, UpdatedAt: m.UpdatedAt, StartedAt: m.StartedAt, FinishedAt: m.FinishedAt}
}

func toModel(t *judge.Task) *database.JudgeTaskModel {
	return &database.JudgeTaskModel{ID: t.ID, SubmissionID: t.SubmissionID, QuestionID: t.QuestionID, UserID: t.UserID, Language: t.Language, Status: t.Status, RetryCount: t.RetryCount, MaxRetryCount: t.MaxRetryCount, ErrorMessage: t.ErrorMessage, ResultSummary: toJSON(t.ResultSummary), StartedAt: t.StartedAt, FinishedAt: t.FinishedAt}
}

func mapFromJSON(data datatypes.JSON) map[string]any {
	if len(data) == 0 {
		return nil
	}
	var out map[string]any
	_ = json.Unmarshal(data, &out)
	return out
}

func toJSON(data map[string]any) datatypes.JSON {
	if data == nil {
		return nil
	}
	raw, _ := json.Marshal(data)
	return datatypes.JSON(raw)
}
