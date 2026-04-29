package store

import (
	"context"

	"github.com/coding-hui/examora/internal/infra/database"
	"github.com/coding-hui/examora/internal/library"
)

func (s *Store) ListPaperQuestions(ctx context.Context, paperID uint64) ([]library.PaperQuestion, error) {
	var rows []database.PaperQuestionModel
	if err := s.db(ctx).Where("paper_id = ?", paperID).Order("sort_order").Find(&rows).Error; err != nil {
		return nil, err
	}
	items := make([]library.PaperQuestion, 0, len(rows))
	for _, row := range rows {
		items = append(items, *toPaperQuestion(&row))
	}
	return items, nil
}

func toPaperQuestion(m *database.PaperQuestionModel) *library.PaperQuestion {
	return &library.PaperQuestion{
		ID:         m.ID,
		PaperID:    m.PaperID,
		QuestionID: m.QuestionID,
		Score:      m.Score,
		SortOrder:  m.SortOrder,
		CreatedAt:  m.CreatedAt,
	}
}
