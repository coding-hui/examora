package postgres

import (
	"context"
	"encoding/json"

	"github.com/coding-hui/examora/internal/kernel"
	"github.com/coding-hui/examora/internal/platform/database"
	"github.com/coding-hui/examora/internal/platform/transaction"
	"github.com/coding-hui/examora/internal/question/entity"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type Repository struct{ db *gorm.DB }

func New(db *gorm.DB) *Repository { return &Repository{db: db} }

func (r *Repository) List(ctx context.Context, query kernel.PageQuery) ([]entity.Question, int64, error) {
	db := transaction.DBFromContext(ctx, r.db).Model(&database.QuestionModel{})
	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var rows []database.QuestionModel
	if err := db.Order("id DESC").Offset(query.Offset()).Limit(query.PageSize).Find(&rows).Error; err != nil {
		return nil, 0, err
	}
	items := make([]entity.Question, 0, len(rows))
	for _, row := range rows {
		items = append(items, *toQuestion(&row))
	}
	return items, total, nil
}

func (r *Repository) FindByID(ctx context.Context, id uint64) (*entity.Question, error) {
	var row database.QuestionModel
	if err := transaction.DBFromContext(ctx, r.db).First(&row, id).Error; err != nil {
		return nil, err
	}
	return toQuestion(&row), nil
}

func (r *Repository) Exists(ctx context.Context, id uint64) (bool, error) {
	var count int64
	err := transaction.DBFromContext(ctx, r.db).Model(&database.QuestionModel{}).Where("id = ?", id).Count(&count).Error
	return count > 0, err
}

func (r *Repository) Create(ctx context.Context, question *entity.Question) error {
	row := toQuestionModel(question)
	if err := transaction.DBFromContext(ctx, r.db).Create(row).Error; err != nil {
		return err
	}
	*question = *toQuestion(row)
	return nil
}

func (r *Repository) Update(ctx context.Context, question *entity.Question) error {
	row := toQuestionModel(question)
	if err := transaction.DBFromContext(ctx, r.db).Save(row).Error; err != nil {
		return err
	}
	*question = *toQuestion(row)
	return nil
}

func (r *Repository) Delete(ctx context.Context, id uint64) error {
	return transaction.DBFromContext(ctx, r.db).Delete(&database.QuestionModel{}, id).Error
}

func (r *Repository) AddTestCase(ctx context.Context, tc *entity.TestCase) error {
	row := &database.TestCaseModel{
		QuestionID:     tc.QuestionID,
		Input:          tc.Input,
		ExpectedOutput: tc.ExpectedOutput,
		TimeLimitMS:    tc.TimeLimitMS,
		MemoryLimitMB:  tc.MemoryLimitMB,
		IsSample:       tc.IsSample,
		IsHidden:       tc.IsHidden,
		SortOrder:      tc.SortOrder,
	}
	if err := transaction.DBFromContext(ctx, r.db).Create(row).Error; err != nil {
		return err
	}
	*tc = *toTestCase(row)
	return nil
}

func (r *Repository) ListTestCases(ctx context.Context, questionID uint64, includeHidden bool) ([]entity.TestCase, error) {
	db := transaction.DBFromContext(ctx, r.db).Where("question_id = ?", questionID)
	if !includeHidden {
		db = db.Where("is_hidden = false OR is_sample = true")
	}
	var rows []database.TestCaseModel
	if err := db.Order("sort_order ASC, id ASC").Find(&rows).Error; err != nil {
		return nil, err
	}
	items := make([]entity.TestCase, 0, len(rows))
	for _, row := range rows {
		items = append(items, *toTestCase(&row))
	}
	return items, nil
}

func toQuestion(m *database.QuestionModel) *entity.Question {
	return &entity.Question{
		ID:            m.ID,
		Type:          m.Type,
		Title:         m.Title,
		Content:       toMap(m.Content),
		Answer:        toMap(m.Answer),
		Difficulty:    m.Difficulty,
		Language:      m.Language,
		StarterCode:   m.StarterCode,
		TimeLimitMS:   m.TimeLimitMS,
		MemoryLimitMB: m.MemoryLimitMB,
		Status:        m.Status,
		CreatedBy:     m.CreatedBy,
		CreatedAt:     m.CreatedAt,
		UpdatedAt:     m.UpdatedAt,
	}
}

func toQuestionModel(q *entity.Question) *database.QuestionModel {
	return &database.QuestionModel{
		ID:            q.ID,
		Type:          q.Type,
		Title:         q.Title,
		Content:       fromMap(q.Content),
		Answer:        fromMap(q.Answer),
		Difficulty:    q.Difficulty,
		Language:      q.Language,
		StarterCode:   q.StarterCode,
		TimeLimitMS:   q.TimeLimitMS,
		MemoryLimitMB: q.MemoryLimitMB,
		Status:        q.Status,
		CreatedBy:     q.CreatedBy,
	}
}

func toTestCase(m *database.TestCaseModel) *entity.TestCase {
	return &entity.TestCase{ID: m.ID, QuestionID: m.QuestionID, Input: m.Input, ExpectedOutput: m.ExpectedOutput, TimeLimitMS: m.TimeLimitMS, MemoryLimitMB: m.MemoryLimitMB, IsSample: m.IsSample, IsHidden: m.IsHidden, SortOrder: m.SortOrder, CreatedAt: m.CreatedAt}
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
		return datatypes.JSON([]byte("{}"))
	}
	raw, _ := json.Marshal(data)
	return datatypes.JSON(raw)
}
