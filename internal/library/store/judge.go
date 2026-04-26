package store

import (
	"context"

	"github.com/coding-hui/examora/internal/infra/database"
	"github.com/coding-hui/examora/internal/library"
)

func (s *Store) ListJudgeTestCases(ctx context.Context, questionID uint64) ([]library.JudgeTestCase, error) {
	var rows []database.TestCaseModel
	if err := s.db(ctx).Where("question_id = ?", questionID).Order("sort_order ASC, id ASC").Find(&rows).Error; err != nil {
		return nil, err
	}
	items := make([]library.JudgeTestCase, 0, len(rows))
	for _, row := range rows {
		items = append(items, library.JudgeTestCase{ID: row.ID, Input: row.Input, ExpectedOutput: row.ExpectedOutput, TimeLimitMS: row.TimeLimitMS, MemoryLimitMB: row.MemoryLimitMB})
	}
	return items, nil
}
