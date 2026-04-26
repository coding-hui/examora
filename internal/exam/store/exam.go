package store

import (
	"context"

	"github.com/coding-hui/examora/internal/exam"
	"github.com/coding-hui/examora/internal/infra/database"
	"github.com/coding-hui/examora/internal/page"
)

func (s *Store) ListExams(ctx context.Context, query page.Query) ([]exam.Exam, int64, error) {
	db := s.db(ctx).Model(&database.ExamModel{})
	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var rows []database.ExamModel
	if err := db.Order("id DESC").Offset(query.Offset()).Limit(query.PageSize).Find(&rows).Error; err != nil {
		return nil, 0, err
	}
	items := make([]exam.Exam, 0, len(rows))
	for _, row := range rows {
		items = append(items, *toExam(&row))
	}
	return items, total, nil
}

func (s *Store) GetExam(ctx context.Context, id uint64) (*exam.Exam, error) {
	var row database.ExamModel
	if err := s.db(ctx).First(&row, "id = ?", id).Error; err != nil {
		return nil, database.MapNotFound(err, exam.ErrExamNotFound)
	}
	return toExam(&row), nil
}

func (s *Store) CreateExam(ctx context.Context, e *exam.Exam) error {
	row := toExamModel(e)
	if err := s.db(ctx).Create(row).Error; err != nil {
		return err
	}
	*e = *toExam(row)
	return nil
}

func (s *Store) UpdateExam(ctx context.Context, e *exam.Exam) error {
	return s.db(ctx).
		Model(&database.ExamModel{}).
		Where("id = ?", e.ID).
		Select("Title", "Description", "PaperID", "Status", "StartTime", "EndTime", "DurationMinutes").
		Updates(database.ExamModel{
			Title:           e.Title,
			Description:     e.Description,
			PaperID:         e.PaperID,
			Status:          e.Status,
			StartTime:       e.StartTime,
			EndTime:         e.EndTime,
			DurationMinutes: e.DurationMinutes,
		}).Error
}
