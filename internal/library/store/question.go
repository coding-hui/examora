package store

import (
	"context"

	"github.com/coding-hui/examora/internal/infra/database"
	"github.com/coding-hui/examora/internal/library"
	"github.com/coding-hui/examora/internal/page"
)

func (s *Store) ListQuestions(ctx context.Context, query page.Query) ([]library.Question, int64, error) {
	db := s.db(ctx).Model(&database.QuestionModel{})
	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var rows []database.QuestionModel
	if err := db.Order("id DESC").Offset(query.Offset()).Limit(query.PageSize).Find(&rows).Error; err != nil {
		return nil, 0, err
	}
	items := make([]library.Question, 0, len(rows))
	for _, row := range rows {
		items = append(items, *toQuestion(&row))
	}
	return items, total, nil
}

func (s *Store) GetQuestion(ctx context.Context, id uint64) (*library.Question, error) {
	var row database.QuestionModel
	if err := s.db(ctx).First(&row, "id = ?", id).Error; err != nil {
		return nil, database.MapNotFound(err, library.ErrQuestionNotFound)
	}
	return toQuestion(&row), nil
}

func (s *Store) QuestionExists(ctx context.Context, id uint64) (bool, error) {
	var count int64
	err := s.db(ctx).Model(&database.QuestionModel{}).Where("id = ?", id).Count(&count).Error
	return count > 0, err
}

func (s *Store) CreateQuestion(ctx context.Context, q *library.Question) error {
	row := toQuestionModel(q)
	if err := s.db(ctx).Create(row).Error; err != nil {
		return err
	}
	*q = *toQuestion(row)
	return nil
}

func (s *Store) UpdateQuestion(ctx context.Context, q *library.Question) error {
	return s.db(ctx).
		Model(&database.QuestionModel{}).
		Where("id = ?", q.ID).
		Select("Title", "Content", "Answer", "Difficulty", "Language", "StarterCode", "TimeLimitMS", "MemoryLimitMB", "Status").
		Updates(database.QuestionModel{
			Title:         q.Title,
			Content:       mapToJSON(q.Content),
			Answer:        mapToJSON(q.Answer),
			Difficulty:    q.Difficulty,
			Language:      q.Language,
			StarterCode:   q.StarterCode,
			TimeLimitMS:   q.TimeLimitMS,
			MemoryLimitMB: q.MemoryLimitMB,
			Status:        q.Status,
		}).Error
}

func (s *Store) DeleteQuestion(ctx context.Context, id uint64) error {
	return s.db(ctx).Delete(&database.QuestionModel{}, "id = ?", id).Error
}

func (s *Store) AddTestCase(ctx context.Context, tc *library.TestCase) error {
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
	if err := s.db(ctx).Create(row).Error; err != nil {
		return err
	}
	*tc = *toTestCase(row)
	return nil
}

func (s *Store) ListTestCases(ctx context.Context, questionID uint64, includeHidden bool) ([]library.TestCase, error) {
	db := s.db(ctx).Where("question_id = ?", questionID)
	if !includeHidden {
		db = db.Where("is_hidden = false OR is_sample = true")
	}
	var rows []database.TestCaseModel
	if err := db.Order("sort_order ASC, id ASC").Find(&rows).Error; err != nil {
		return nil, err
	}
	items := make([]library.TestCase, 0, len(rows))
	for _, row := range rows {
		items = append(items, *toTestCase(&row))
	}
	return items, nil
}
