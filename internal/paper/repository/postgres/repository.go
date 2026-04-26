package postgres

import (
	"context"

	"github.com/coding-hui/examora/internal/kernel"
	"github.com/coding-hui/examora/internal/paper/entity"
	"github.com/coding-hui/examora/internal/platform/database"
	"github.com/coding-hui/examora/internal/platform/transaction"
	"gorm.io/gorm"
)

type Repository struct{ db *gorm.DB }

func New(db *gorm.DB) *Repository { return &Repository{db: db} }

func (r *Repository) List(ctx context.Context, q kernel.PageQuery) ([]entity.Paper, int64, error) {
	db := transaction.DBFromContext(ctx, r.db).Model(&database.PaperModel{})
	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var rows []database.PaperModel
	if err := db.Order("id DESC").Offset(q.Offset()).Limit(q.PageSize).Find(&rows).Error; err != nil {
		return nil, 0, err
	}
	items := make([]entity.Paper, 0, len(rows))
	for _, row := range rows {
		items = append(items, *toEntity(&row))
	}
	return items, total, nil
}
func (r *Repository) FindByID(ctx context.Context, id uint64) (*entity.Paper, error) {
	var row database.PaperModel
	if err := transaction.DBFromContext(ctx, r.db).First(&row, id).Error; err != nil {
		return nil, err
	}
	return toEntity(&row), nil
}
func (r *Repository) Exists(ctx context.Context, id uint64) (bool, error) {
	var count int64
	err := transaction.DBFromContext(ctx, r.db).Model(&database.PaperModel{}).Where("id = ?", id).Count(&count).Error
	return count > 0, err
}
func (r *Repository) Create(ctx context.Context, p *entity.Paper) error {
	row := toModel(p)
	if err := transaction.DBFromContext(ctx, r.db).Create(row).Error; err != nil {
		return err
	}
	*p = *toEntity(row)
	return nil
}
func (r *Repository) Update(ctx context.Context, p *entity.Paper) error {
	row := toModel(p)
	if err := transaction.DBFromContext(ctx, r.db).Save(row).Error; err != nil {
		return err
	}
	*p = *toEntity(row)
	return nil
}
func (r *Repository) Delete(ctx context.Context, id uint64) error {
	return transaction.DBFromContext(ctx, r.db).Delete(&database.PaperModel{}, id).Error
}
func (r *Repository) AddQuestion(ctx context.Context, item *entity.PaperQuestion) error {
	row := &database.PaperQuestionModel{PaperID: item.PaperID, QuestionID: item.QuestionID, Score: item.Score, SortOrder: item.SortOrder}
	if err := transaction.DBFromContext(ctx, r.db).Create(row).Error; err != nil {
		return err
	}
	item.ID = row.ID
	item.CreatedAt = row.CreatedAt
	return nil
}
func (r *Repository) RemoveQuestion(ctx context.Context, paperID, questionID uint64) error {
	return transaction.DBFromContext(ctx, r.db).Where("paper_id = ? AND question_id = ?", paperID, questionID).Delete(&database.PaperQuestionModel{}).Error
}
func toEntity(m *database.PaperModel) *entity.Paper {
	return &entity.Paper{ID: m.ID, Title: m.Title, Description: m.Description, Status: m.Status, CreatedBy: m.CreatedBy, CreatedAt: m.CreatedAt, UpdatedAt: m.UpdatedAt}
}
func toModel(e *entity.Paper) *database.PaperModel {
	return &database.PaperModel{ID: e.ID, Title: e.Title, Description: e.Description, Status: e.Status, CreatedBy: e.CreatedBy}
}
