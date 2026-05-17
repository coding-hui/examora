package store

import (
	"context"

	"gorm.io/gorm/clause"

	"github.com/coding-hui/examora/internal/infra/database"
	"github.com/coding-hui/examora/internal/library"
)

func (s *Store) ListQuestions(ctx context.Context, filter library.QuestionFilter) ([]library.Question, int64, error) {
	db := s.db(ctx).Model(&database.QuestionModel{})
	if filter.Keyword != "" {
		keyword := "%" + filter.Keyword + "%"
		db = db.Where("LOWER(title) LIKE LOWER(?) OR LOWER(CAST(content AS TEXT)) LIKE LOWER(?)", keyword, keyword)
	}
	if filter.Type != "" {
		db = db.Where("type = ?", filter.Type)
	}
	if filter.Difficulty != "" {
		db = db.Where("difficulty = ?", filter.Difficulty)
	}
	if filter.Status != "" {
		db = db.Where("status = ?", filter.Status)
	}
	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var rows []database.QuestionModel
	if err := db.
		Order(questionOrderBy(filter)).
		Order(clause.OrderByColumn{Column: clause.Column{Name: "id"}, Desc: true}).
		Offset((filter.PageNum - 1) * filter.PageSize).
		Limit(filter.PageSize).
		Find(&rows).Error; err != nil {
		return nil, 0, err
	}
	items := make([]library.Question, 0, len(rows))
	for _, row := range rows {
		items = append(items, *toQuestion(&row))
	}
	return items, total, nil
}

func questionOrderBy(filter library.QuestionFilter) clause.OrderByColumn {
	column := map[string]string{
		"updated_at": "updated_at",
	}[filter.SortField]
	if column == "" {
		column = "updated_at"
	}
	return clause.OrderByColumn{
		Column: clause.Column{Name: column},
		Desc:   filter.SortOrder != "asc",
	}
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
		Select("Type", "Title", "Content", "Answer", "Difficulty", "Language", "StarterCode", "TimeLimitMS", "MemoryLimitMB", "Status").
		Updates(database.QuestionModel{
			Type:          q.Type,
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

func (s *Store) CountPaperQuestions(ctx context.Context, questionID uint64) (int64, error) {
	var count int64
	err := s.db(ctx).Model(&database.PaperQuestionModel{}).Where("question_id = ?", questionID).Count(&count).Error
	return count, err
}

func (s *Store) CountPublishedPaperQuestions(ctx context.Context, questionID uint64) (int64, error) {
	var count int64
	err := s.db(ctx).
		Table("paper_questions AS pq").
		Joins("JOIN papers AS p ON p.id = pq.paper_id").
		Where("pq.question_id = ? AND p.status = ?", questionID, library.PaperStatusPublished).
		Count(&count).Error
	return count, err
}

func (s *Store) DeleteTestCasesByQuestionID(ctx context.Context, questionID uint64) error {
	return s.db(ctx).Where("question_id = ?", questionID).Delete(&database.TestCaseModel{}).Error
}

func (s *Store) UpsertTestCases(ctx context.Context, questionID uint64, tcs []library.TestCase) error {
	if len(tcs) == 0 {
		return nil
	}
	rows := make([]*database.TestCaseModel, 0, len(tcs))
	for _, tc := range tcs {
		rows = append(rows, &database.TestCaseModel{
			QuestionID:     questionID,
			Input:          tc.Input,
			ExpectedOutput: tc.ExpectedOutput,
			TimeLimitMS:    tc.TimeLimitMS,
			MemoryLimitMB:  tc.MemoryLimitMB,
			IsSample:       tc.IsSample,
			IsHidden:       tc.IsHidden,
			SortOrder:      tc.SortOrder,
		})
	}
	return s.db(ctx).Create(rows).Error
}
