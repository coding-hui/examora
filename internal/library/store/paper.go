package store

import (
	"context"

	"github.com/coding-hui/examora/internal/infra/database"
	"github.com/coding-hui/examora/internal/library"
	"github.com/coding-hui/examora/internal/page"
)

func (s *Store) ListPapers(ctx context.Context, query page.Query) ([]library.Paper, int64, error) {
	db := s.db(ctx).Model(&database.PaperModel{})
	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var rows []database.PaperModel
	if err := db.Order("id DESC").Offset(query.Offset()).Limit(query.PageSize).Find(&rows).Error; err != nil {
		return nil, 0, err
	}
	items := make([]library.Paper, 0, len(rows))
	for _, row := range rows {
		items = append(items, *toPaper(&row))
	}
	return items, total, nil
}

func (s *Store) GetPaper(ctx context.Context, id uint64) (*library.Paper, error) {
	var row database.PaperModel
	if err := s.db(ctx).First(&row, "id = ?", id).Error; err != nil {
		return nil, database.MapNotFound(err, library.ErrPaperNotFound)
	}
	return toPaper(&row), nil
}

func (s *Store) PaperExists(ctx context.Context, id uint64) (bool, error) {
	var count int64
	err := s.db(ctx).Model(&database.PaperModel{}).Where("id = ?", id).Count(&count).Error
	return count > 0, err
}

func (s *Store) CreatePaper(ctx context.Context, p *library.Paper) error {
	row := toPaperModel(p)
	if err := s.db(ctx).Create(row).Error; err != nil {
		return err
	}
	*p = *toPaper(row)
	return nil
}

func (s *Store) UpdatePaper(ctx context.Context, p *library.Paper) error {
	return s.db(ctx).
		Model(&database.PaperModel{}).
		Where("id = ?", p.ID).
		Select("Title", "Description", "Status").
		Updates(database.PaperModel{
			Title:       p.Title,
			Description: p.Description,
			Status:      p.Status,
		}).Error
}

func (s *Store) DeletePaper(ctx context.Context, id uint64) error {
	return s.db(ctx).Delete(&database.PaperModel{}, "id = ?", id).Error
}

func (s *Store) AddPaperQuestion(ctx context.Context, item *library.PaperQuestion) error {
	row := &database.PaperQuestionModel{PaperID: item.PaperID, QuestionID: item.QuestionID, Score: item.Score, SortOrder: item.SortOrder}
	if err := s.db(ctx).Create(row).Error; err != nil {
		return err
	}
	item.ID = row.ID
	item.CreatedAt = row.CreatedAt
	return nil
}

func (s *Store) RemovePaperQuestion(ctx context.Context, paperID, questionID uint64) error {
	return s.db(ctx).Where("paper_id = ? AND question_id = ?", paperID, questionID).Delete(&database.PaperQuestionModel{}).Error
}
