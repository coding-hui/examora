package store

import (
	"context"
	"sort"

	"github.com/coding-hui/examora/internal/exam"
	"github.com/coding-hui/examora/internal/infra/database"
)

func (s *Store) CreateSubmission(ctx context.Context, sub *exam.Submission) error {
	row := toSubmissionModel(sub)
	if err := s.db(ctx).Create(row).Error; err != nil {
		return err
	}
	*sub = *toSubmission(row)
	return nil
}

func (s *Store) GetSubmission(ctx context.Context, id uint64) (*exam.Submission, error) {
	var row database.SubmissionModel
	if err := s.db(ctx).First(&row, "id = ?", id).Error; err != nil {
		return nil, database.MapNotFound(err, exam.ErrSubmissionNotFound)
	}
	return toSubmission(&row), nil
}

func (s *Store) UpdateSubmissionStatus(ctx context.Context, id uint64, status string) error {
	return s.db(ctx).Model(&database.SubmissionModel{}).Where("id = ?", id).Update("status", status).Error
}

func (s *Store) GetExamResultForSession(ctx context.Context, examSessionID uint64) (*exam.ExamResult, error) {
	var row database.ExamResultModel
	if err := s.db(ctx).Where("exam_session_id = ?", examSessionID).First(&row).Error; err != nil {
		return nil, err
	}
	result := toExamResult(&row)
	questions, err := s.listQuestionResults(ctx, result.ID)
	if err != nil {
		return nil, err
	}
	result.Questions = questions
	result.Sections = s.buildExamResultSections(ctx, result)
	return result, nil
}

func (s *Store) GetExamResultForExamUser(ctx context.Context, examID, userID uint64) (*exam.ExamResult, error) {
	var row database.ExamResultModel
	if err := s.db(ctx).Where("exam_id = ? AND user_id = ?", examID, userID).First(&row).Error; err != nil {
		return nil, err
	}
	result := toExamResult(&row)
	questions, err := s.listQuestionResults(ctx, result.ID)
	if err != nil {
		return nil, err
	}
	result.Questions = questions
	result.Sections = s.buildExamResultSections(ctx, result)
	return result, nil
}

func (s *Store) GetExamResult(ctx context.Context, id uint64) (*exam.ExamResult, error) {
	var row database.ExamResultModel
	if err := s.db(ctx).First(&row, "id = ?", id).Error; err != nil {
		return nil, err
	}
	result := toExamResult(&row)
	questions, err := s.listQuestionResults(ctx, result.ID)
	if err != nil {
		return nil, err
	}
	result.Questions = questions
	result.Sections = s.buildExamResultSections(ctx, result)
	return result, nil
}

func (s *Store) ListExamResults(ctx context.Context, examID uint64, pageNum, pageSize int) ([]exam.ExamResult, int64, error) {
	db := s.db(ctx).Model(&database.ExamResultModel{})
	if examID > 0 {
		db = db.Where("exam_id = ?", examID)
	}
	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var rows []database.ExamResultModel
	if err := db.Order("submitted_at desc, id desc").Offset((pageNum - 1) * pageSize).Limit(pageSize).Find(&rows).Error; err != nil {
		return nil, 0, err
	}
	items := make([]exam.ExamResult, 0, len(rows))
	for _, row := range rows {
		items = append(items, *toExamResult(&row))
	}
	return items, total, nil
}

func (s *Store) CreateExamResult(ctx context.Context, result *exam.ExamResult) error {
	row := toExamResultModel(result)
	if err := s.db(ctx).Create(row).Error; err != nil {
		return err
	}
	result.ID = row.ID
	return nil
}

func (s *Store) CreateQuestionResult(ctx context.Context, result *exam.QuestionResult) error {
	row := toQuestionResultModel(result)
	if err := s.db(ctx).Create(row).Error; err != nil {
		return err
	}
	result.ID = row.ID
	return nil
}

func (s *Store) UpdateExamResultSummary(ctx context.Context, result *exam.ExamResult) error {
	return s.db(ctx).Model(&database.ExamResultModel{}).
		Where("id = ?", result.ID).
		Updates(map[string]any{
			"status":    result.Status,
			"score":     result.Score,
			"max_score": result.MaxScore,
			"graded_at": result.GradedAt,
		}).Error
}

func (s *Store) listQuestionResults(ctx context.Context, examResultID uint64) ([]exam.QuestionResult, error) {
	var rows []database.QuestionResultModel
	if err := s.db(ctx).Where("exam_result_id = ?", examResultID).Order("id ASC").Find(&rows).Error; err != nil {
		return nil, err
	}
	snapshotIDs := make([]uint64, 0, len(rows))
	for _, row := range rows {
		snapshotIDs = append(snapshotIDs, row.QuestionSnapshotID)
	}
	snapshots := map[uint64]database.QuestionSnapshotModel{}
	if len(snapshotIDs) > 0 {
		var snapshotRows []database.QuestionSnapshotModel
		if err := s.db(ctx).Where("id IN ?", snapshotIDs).Find(&snapshotRows).Error; err != nil {
			return nil, err
		}
		for _, row := range snapshotRows {
			snapshots[row.ID] = row
		}
	}
	items := make([]exam.QuestionResult, 0, len(rows))
	for _, row := range rows {
		item := toQuestionResult(&row)
		if snapshot, ok := snapshots[row.QuestionSnapshotID]; ok {
			item.SectionSnapshotID = snapshot.SectionSnapshotID
			item.SortOrder = snapshot.SortOrder
			item.QuestionSortOrder = snapshot.QuestionSortOrder
		}
		items = append(items, item)
	}
	sort.SliceStable(items, func(i, j int) bool {
		if items[i].SortOrder == items[j].SortOrder {
			return items[i].ID < items[j].ID
		}
		return items[i].SortOrder < items[j].SortOrder
	})
	return items, nil
}

func (s *Store) buildExamResultSections(ctx context.Context, result *exam.ExamResult) []exam.ExamResultSection {
	sectionSnapshots, err := s.ListPaperSectionSnapshots(ctx, result.ExamSnapshotID)
	if err != nil || len(sectionSnapshots) == 0 {
		return nil
	}
	sections := make([]exam.ExamResultSection, 0, len(sectionSnapshots))
	sectionIndex := map[uint64]int{}
	for _, section := range sectionSnapshots {
		sectionIndex[section.ID] = len(sections)
		sections = append(sections, exam.ExamResultSection{
			SectionSnapshotID: section.ID,
			Title:             section.Title,
			Description:       section.Description,
			SortOrder:         section.SortOrder,
			MaxScore:          section.TotalScore,
			QuestionCount:     section.QuestionCount,
			Questions:         []exam.QuestionResult{},
		})
	}
	for _, question := range result.Questions {
		index, ok := sectionIndex[question.SectionSnapshotID]
		if !ok {
			continue
		}
		sections[index].Score += question.Score
		sections[index].Questions = append(sections[index].Questions, question)
	}
	return sections
}
