package store

import (
	"context"
	"errors"
	"strings"

	"gorm.io/gorm"

	"github.com/coding-hui/examora/internal/infra/database"
	"github.com/coding-hui/examora/internal/library"
)

func (s *Store) ListPapers(ctx context.Context, filter library.PaperFilter) ([]library.Paper, int64, error) {
	db := s.db(ctx).Model(&database.PaperModel{})
	keyword := strings.TrimSpace(filter.Keyword)
	if keyword != "" {
		like := "%" + keyword + "%"
		db = db.Where("title LIKE ? OR description LIKE ?", like, like)
	}
	status := strings.ToUpper(strings.TrimSpace(filter.Status))
	if status != "" {
		db = db.Where("status = ?", status)
	}
	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var rows []database.PaperModel
	if err := db.Order("id DESC").Offset((filter.PageNum - 1) * filter.PageSize).Limit(filter.PageSize).Find(&rows).Error; err != nil {
		return nil, 0, err
	}
	items := make([]library.Paper, 0, len(rows))
	for _, row := range rows {
		item := *toPaper(&row)
		var summary struct {
			QuestionCount int
			TotalScore    float64
		}
		if err := s.db(ctx).Model(&database.PaperQuestionModel{}).
			Select("COUNT(*) AS question_count, COALESCE(SUM(score), 0) AS total_score").
			Where("paper_id = ?", row.ID).
			Scan(&summary).Error; err != nil {
			return nil, 0, err
		}
		item.QuestionCount = summary.QuestionCount
		item.TotalScore = summary.TotalScore
		items = append(items, item)
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
	if err := s.DeletePaperQuestionsByPaper(ctx, id); err != nil {
		return err
	}
	if err := s.DeletePaperSectionsByPaper(ctx, id); err != nil {
		return err
	}
	return s.db(ctx).Delete(&database.PaperModel{}, "id = ?", id).Error
}

func (s *Store) CreatePaperSection(ctx context.Context, section *library.PaperSection) error {
	row := &database.PaperSectionModel{
		PaperID:     section.PaperID,
		Title:       section.Title,
		Description: section.Description,
		SortOrder:   section.SortOrder,
	}
	if err := s.db(ctx).Create(row).Error; err != nil {
		return err
	}
	section.ID = row.ID
	section.CreatedAt = row.CreatedAt
	section.UpdatedAt = row.UpdatedAt
	return nil
}

func (s *Store) DeletePaperSectionsByPaper(ctx context.Context, paperID uint64) error {
	return s.db(ctx).Where("paper_id = ?", paperID).Delete(&database.PaperSectionModel{}).Error
}

func (s *Store) EnsureDefaultPaperSection(ctx context.Context, paperID uint64) (uint64, error) {
	var row database.PaperSectionModel
	if err := s.db(ctx).Where("paper_id = ?", paperID).Order("sort_order ASC, id ASC").First(&row).Error; err == nil {
		return row.ID, nil
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return 0, err
	}
	row = database.PaperSectionModel{PaperID: paperID, Title: "第一大题", SortOrder: 1}
	if err := s.db(ctx).Create(&row).Error; err != nil {
		return 0, err
	}
	return row.ID, nil
}

func (s *Store) AddPaperQuestion(ctx context.Context, item *library.PaperQuestion) error {
	row := &database.PaperQuestionModel{PaperID: item.PaperID, SectionID: item.SectionID, QuestionID: item.QuestionID, Score: item.Score, SortOrder: item.SortOrder}
	if err := s.db(ctx).Create(row).Error; err != nil {
		if database.IsUniqueConstraint(err) {
			return library.ErrPaperQuestionExists
		}
		return err
	}
	item.ID = row.ID
	item.SectionID = row.SectionID
	item.CreatedAt = row.CreatedAt
	return nil
}

func (s *Store) RemovePaperQuestion(ctx context.Context, paperID, questionID uint64) error {
	return s.db(ctx).Where("paper_id = ? AND question_id = ?", paperID, questionID).Delete(&database.PaperQuestionModel{}).Error
}

func (s *Store) DeletePaperQuestionsByPaper(ctx context.Context, paperID uint64) error {
	return s.db(ctx).Where("paper_id = ?", paperID).Delete(&database.PaperQuestionModel{}).Error
}
