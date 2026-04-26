package postgres

import (
	"context"

	"github.com/coding-hui/examora/internal/exam/entity"
	"github.com/coding-hui/examora/internal/kernel"
	"github.com/coding-hui/examora/internal/platform/database"
	"github.com/coding-hui/examora/internal/platform/transaction"
	"gorm.io/gorm"
)

type Repository struct{ db *gorm.DB }

func New(db *gorm.DB) *Repository { return &Repository{db: db} }
func (r *Repository) List(ctx context.Context, q kernel.PageQuery) ([]entity.Exam, int64, error) {
	db := transaction.DBFromContext(ctx, r.db).Model(&database.ExamModel{})
	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var rows []database.ExamModel
	if err := db.Order("id DESC").Offset(q.Offset()).Limit(q.PageSize).Find(&rows).Error; err != nil {
		return nil, 0, err
	}
	items := make([]entity.Exam, 0, len(rows))
	for _, row := range rows {
		items = append(items, *toEntity(&row))
	}
	return items, total, nil
}
func (r *Repository) FindByID(ctx context.Context, id uint64) (*entity.Exam, error) {
	var row database.ExamModel
	if err := transaction.DBFromContext(ctx, r.db).First(&row, id).Error; err != nil {
		return nil, err
	}
	return toEntity(&row), nil
}
func (r *Repository) Create(ctx context.Context, e *entity.Exam) error {
	row := toModel(e)
	if err := transaction.DBFromContext(ctx, r.db).Create(row).Error; err != nil {
		return err
	}
	*e = *toEntity(row)
	return nil
}
func (r *Repository) Update(ctx context.Context, e *entity.Exam) error {
	row := toModel(e)
	if err := transaction.DBFromContext(ctx, r.db).Save(row).Error; err != nil {
		return err
	}
	*e = *toEntity(row)
	return nil
}
func toEntity(m *database.ExamModel) *entity.Exam {
	return &entity.Exam{ID: m.ID, Title: m.Title, Description: m.Description, PaperID: m.PaperID, Status: m.Status, StartTime: m.StartTime, EndTime: m.EndTime, DurationMinutes: m.DurationMinutes, CreatedBy: m.CreatedBy, CreatedAt: m.CreatedAt, UpdatedAt: m.UpdatedAt}
}
func toModel(e *entity.Exam) *database.ExamModel {
	return &database.ExamModel{ID: e.ID, Title: e.Title, Description: e.Description, PaperID: e.PaperID, Status: e.Status, StartTime: e.StartTime, EndTime: e.EndTime, DurationMinutes: e.DurationMinutes, CreatedBy: e.CreatedBy}
}
