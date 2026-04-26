package postgres

import (
	"context"

	"github.com/coding-hui/examora/internal/judge/usecase"
	"github.com/coding-hui/examora/internal/platform/database"
	"github.com/coding-hui/examora/internal/platform/transaction"
)

func (r *Repository) ListJudgeTestCases(ctx context.Context, questionID uint64) ([]usecase.TestCaseDTO, error) {
	var rows []database.TestCaseModel
	if err := transaction.DBFromContext(ctx, r.db).Where("question_id = ?", questionID).Order("sort_order ASC, id ASC").Find(&rows).Error; err != nil {
		return nil, err
	}
	items := make([]usecase.TestCaseDTO, 0, len(rows))
	for _, row := range rows {
		items = append(items, usecase.TestCaseDTO{ID: row.ID, Input: row.Input, ExpectedOutput: row.ExpectedOutput, TimeLimitMS: row.TimeLimitMS, MemoryLimitMB: row.MemoryLimitMB})
	}
	return items, nil
}
