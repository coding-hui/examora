package store

import (
	"context"

	"github.com/coding-hui/examora/internal/exam"
	"github.com/coding-hui/examora/internal/infra/database"
)

func (s *Store) CreateExamSnapshot(ctx context.Context, snap *exam.ExamSnapshot) error {
	row := toExamSnapshotModel(snap)
	if err := s.db(ctx).Create(row).Error; err != nil {
		return err
	}
	*snap = *toExamSnapshot(row)
	return nil
}

func (s *Store) GetExamSnapshotByExamID(ctx context.Context, examID uint64) (*exam.ExamSnapshot, error) {
	var row database.ExamSnapshotModel
	if err := s.db(ctx).First(&row, "exam_id = ?", examID).Error; err != nil {
		return nil, database.MapNotFound(err, exam.ErrSnapshotNotFound)
	}
	return toExamSnapshot(&row), nil
}

func (s *Store) GetExamSnapshot(ctx context.Context, id uint64) (*exam.ExamSnapshot, error) {
	var row database.ExamSnapshotModel
	if err := s.db(ctx).First(&row, "id = ?", id).Error; err != nil {
		return nil, database.MapNotFound(err, exam.ErrSnapshotNotFound)
	}
	return toExamSnapshot(&row), nil
}

func (s *Store) ListQuestionSnapshots(ctx context.Context, examSnapshotID uint64) ([]exam.QuestionSnapshot, error) {
	var rows []database.QuestionSnapshotModel
	if err := s.db(ctx).Where("exam_snapshot_id = ?", examSnapshotID).Order("sort_order ASC, id ASC").Find(&rows).Error; err != nil {
		return nil, err
	}
	items := make([]exam.QuestionSnapshot, 0, len(rows))
	for _, row := range rows {
		items = append(items, *toQuestionSnapshot(&row))
	}
	return items, nil
}

func (s *Store) ListPaperSectionSnapshots(ctx context.Context, examSnapshotID uint64) ([]exam.PaperSectionSnapshot, error) {
	var rows []database.PaperSectionSnapshotModel
	if err := s.db(ctx).Where("exam_snapshot_id = ?", examSnapshotID).Order("sort_order ASC, id ASC").Find(&rows).Error; err != nil {
		return nil, err
	}
	items := make([]exam.PaperSectionSnapshot, 0, len(rows))
	for _, row := range rows {
		items = append(items, *toPaperSectionSnapshot(&row))
	}
	return items, nil
}

func (s *Store) CreatePaperSectionSnapshot(ctx context.Context, snap *exam.PaperSectionSnapshot) error {
	row := toPaperSectionSnapshotModel(snap)
	if err := s.db(ctx).Create(row).Error; err != nil {
		return err
	}
	*snap = *toPaperSectionSnapshot(row)
	return nil
}

func (s *Store) CreateQuestionSnapshot(ctx context.Context, snap *exam.QuestionSnapshot) error {
	row := toQuestionSnapshotModel(snap)
	if err := s.db(ctx).Create(row).Error; err != nil {
		return err
	}
	*snap = *toQuestionSnapshot(row)
	return nil
}

func toPaperSectionSnapshot(m *database.PaperSectionSnapshotModel) *exam.PaperSectionSnapshot {
	return &exam.PaperSectionSnapshot{
		ID:              m.ID,
		ExamSnapshotID:  m.ExamSnapshotID,
		SourceSectionID: m.SourceSectionID,
		Title:           m.Title,
		Description:     m.Description,
		SortOrder:       m.SortOrder,
		QuestionCount:   m.QuestionCount,
		TotalScore:      m.TotalScore,
		CreatedAt:       m.CreatedAt,
	}
}

func toPaperSectionSnapshotModel(s *exam.PaperSectionSnapshot) *database.PaperSectionSnapshotModel {
	return &database.PaperSectionSnapshotModel{
		ExamSnapshotID:  s.ExamSnapshotID,
		SourceSectionID: s.SourceSectionID,
		Title:           s.Title,
		Description:     s.Description,
		SortOrder:       s.SortOrder,
		QuestionCount:   s.QuestionCount,
		TotalScore:      s.TotalScore,
		CreatedAt:       s.CreatedAt,
	}
}

func toExamSnapshot(m *database.ExamSnapshotModel) *exam.ExamSnapshot {
	return &exam.ExamSnapshot{
		ID:              m.ID,
		ExamID:          m.ExamID,
		PaperSnapshotID: m.PaperSnapshotID,
		StartTime:       m.StartTime,
		EndTime:         m.EndTime,
		DurationMinutes: m.DurationMinutes,
		PublishedAt:     m.PublishedAt,
	}
}

func toExamSnapshotModel(e *exam.ExamSnapshot) *database.ExamSnapshotModel {
	return &database.ExamSnapshotModel{
		ExamID:          e.ExamID,
		PaperSnapshotID: e.PaperSnapshotID,
		StartTime:       e.StartTime,
		EndTime:         e.EndTime,
		DurationMinutes: e.DurationMinutes,
		PublishedAt:     e.PublishedAt,
	}
}

func toQuestionSnapshot(m *database.QuestionSnapshotModel) *exam.QuestionSnapshot {
	return &exam.QuestionSnapshot{
		ID:                m.ID,
		ExamSnapshotID:    m.ExamSnapshotID,
		SectionSnapshotID: m.SectionSnapshotID,
		QuestionID:        m.QuestionID,
		Type:              m.Type,
		Title:             m.Title,
		Content:           jsonToMap(m.Content),
		Score:             m.Score,
		SortOrder:         m.SortOrder,
		QuestionSortOrder: m.QuestionSortOrder,
		Answer:            jsonToMap(m.Answer),
		TestCases:         jsonToTestCases(m.TestCases),
		StarterCode:       m.StarterCode,
		TimeLimitMs:       m.TimeLimitMS,
		MemoryLimitMb:     m.MemoryLimitMB,
	}
}

func toQuestionSnapshotModel(q *exam.QuestionSnapshot) *database.QuestionSnapshotModel {
	return &database.QuestionSnapshotModel{
		ExamSnapshotID:    q.ExamSnapshotID,
		SectionSnapshotID: q.SectionSnapshotID,
		QuestionID:        q.QuestionID,
		Type:              q.Type,
		Title:             q.Title,
		Content:           mapToJSON(q.Content),
		Score:             q.Score,
		SortOrder:         q.SortOrder,
		QuestionSortOrder: q.QuestionSortOrder,
		Answer:            mapToJSON(q.Answer),
		TestCases:         testCasesToJSON(q.TestCases),
		StarterCode:       q.StarterCode,
		TimeLimitMS:       q.TimeLimitMs,
		MemoryLimitMB:     q.MemoryLimitMb,
	}
}
