package store

import (
	"context"
	"time"

	"github.com/coding-hui/examora/internal/exam"
	"github.com/coding-hui/examora/internal/infra/database"
	"github.com/coding-hui/examora/internal/library"
)

func (s *Store) FindForJudge(ctx context.Context, id uint64) (*exam.JudgeSubmission, error) {
	var row database.SubmissionModel
	if err := s.db(ctx).First(&row, "id = ?", id).Error; err != nil {
		return nil, database.MapNotFound(err, exam.ErrSubmissionNotFound)
	}
	return &exam.JudgeSubmission{ID: row.ID, QuestionID: row.QuestionID, UserID: row.UserID, Code: row.Code, Language: row.Language}, nil
}

func (s *Store) ListJudgeTestCases(ctx context.Context, questionID uint64) ([]library.JudgeTestCase, error) {
	var snapshot database.QuestionSnapshotModel
	if err := s.db(ctx).First(&snapshot, "id = ?", questionID).Error; err == nil && len(snapshot.TestCases) > 0 {
		items := make([]library.JudgeTestCase, 0)
		for _, tc := range jsonToTestCases(snapshot.TestCases) {
			items = append(items, library.JudgeTestCase{ID: tc.ID, Input: tc.Input, ExpectedOutput: tc.ExpectedOutput, TimeLimitMS: tc.TimeLimitMS, MemoryLimitMB: tc.MemoryLimitMB})
		}
		return items, nil
	}

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

func (s *Store) UpdateJudgeResult(ctx context.Context, submissionID uint64, status string, score float64, result map[string]any) error {
	now := time.Now().UTC()
	db := s.db(ctx)
	if err := db.Model(&database.SubmissionModel{}).Where("id = ?", submissionID).Updates(map[string]any{"status": status, "score": score, "result": mapToJSON(result), "judged_at": &now}).Error; err != nil {
		return err
	}

	var qr database.QuestionResultModel
	if err := db.Where("submission_id = ?", submissionID).First(&qr).Error; err != nil {
		return database.MapNotFound(err, exam.ErrQuestionResultNotFound)
	}
	scaledScore := qr.MaxScore * score / 100
	if err := db.Model(&database.QuestionResultModel{}).Where("id = ?", qr.ID).Updates(map[string]any{
		"status":    status,
		"score":     scaledScore,
		"result":    mapToJSON(result),
		"judged_at": &now,
	}).Error; err != nil {
		return err
	}

	return s.refreshExamResultSummary(ctx, qr.ExamResultID, now)
}

func (s *Store) refreshExamResultSummary(ctx context.Context, examResultID uint64, now time.Time) error {
	db := s.db(ctx)
	var rows []database.QuestionResultModel
	if err := db.Where("exam_result_id = ?", examResultID).Find(&rows).Error; err != nil {
		return err
	}
	total := 0.0
	maxScore := 0.0
	hasJudging := false
	hasManual := false
	for _, row := range rows {
		total += row.Score
		maxScore += row.MaxScore
		switch row.Status {
		case exam.QuestionResultStatusJudging:
			hasJudging = true
		case exam.QuestionResultStatusManualRequired:
			hasManual = true
		}
	}
	status := exam.ResultStatusGraded
	var gradedAt *time.Time
	switch {
	case hasJudging:
		status = exam.ResultStatusJudging
	case hasManual:
		status = exam.ResultStatusManualRequired
	default:
		gradedAt = &now
	}
	return db.Model(&database.ExamResultModel{}).Where("id = ?", examResultID).Updates(map[string]any{
		"status":    status,
		"score":     total,
		"max_score": maxScore,
		"graded_at": gradedAt,
	}).Error
}
