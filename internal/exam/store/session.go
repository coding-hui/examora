package store

import (
	"context"

	"github.com/coding-hui/examora/internal/exam"
	"github.com/coding-hui/examora/internal/infra/database"
)

func (s *Store) CreateExamSession(ctx context.Context, session *exam.ExamSession) error {
	row := toExamSessionModel(session)
	if err := s.db(ctx).Create(row).Error; err != nil {
		return err
	}
	*session = *toExamSession(row)
	return nil
}

func (s *Store) GetExamSession(ctx context.Context, examSnapshotID, userID uint64) (*exam.ExamSession, error) {
	var row database.ExamSessionModel
	if err := s.db(ctx).Where("exam_snapshot_id = ? AND user_id = ?", examSnapshotID, userID).First(&row).Error; err != nil {
		return nil, database.MapNotFound(err, exam.ErrSessionNotFound)
	}
	return toExamSession(&row), nil
}

func (s *Store) ListExamSessionsBySnapshot(ctx context.Context, examSnapshotID uint64) ([]exam.ExamSession, error) {
	var rows []database.ExamSessionModel
	if err := s.db(ctx).Where("exam_snapshot_id = ?", examSnapshotID).Order("id ASC").Find(&rows).Error; err != nil {
		return nil, err
	}
	sessions := make([]exam.ExamSession, 0, len(rows))
	for _, row := range rows {
		sessions = append(sessions, *toExamSession(&row))
	}
	return sessions, nil
}

func (s *Store) ListExamSessionsBySnapshotPage(ctx context.Context, examSnapshotID uint64, pageNum, pageSize int) ([]exam.ExamSession, int64, error) {
	db := s.db(ctx).Model(&database.ExamSessionModel{}).Where("exam_snapshot_id = ?", examSnapshotID)
	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var rows []database.ExamSessionModel
	if err := db.Order("id ASC").Offset((pageNum - 1) * pageSize).Limit(pageSize).Find(&rows).Error; err != nil {
		return nil, 0, err
	}
	sessions := make([]exam.ExamSession, 0, len(rows))
	for _, row := range rows {
		sessions = append(sessions, *toExamSession(&row))
	}
	return sessions, total, nil
}

func (s *Store) CountSubmittedExamSessionsBySnapshot(ctx context.Context, examSnapshotID uint64) (int64, error) {
	var total int64
	err := s.db(ctx).
		Model(&database.ExamSessionModel{}).
		Where("exam_snapshot_id = ? AND status = ?", examSnapshotID, exam.SessionStatusSubmitted).
		Count(&total).Error
	return total, err
}

func (s *Store) ListExamSessionsByUser(ctx context.Context, userID uint64) ([]exam.ExamSession, error) {
	var rows []database.ExamSessionModel
	if err := s.db(ctx).Where("user_id = ?", userID).Find(&rows).Error; err != nil {
		return nil, err
	}
	sessions := make([]exam.ExamSession, 0, len(rows))
	for _, row := range rows {
		sessions = append(sessions, *toExamSession(&row))
	}
	return sessions, nil
}

func (s *Store) UpdateExamSession(ctx context.Context, session *exam.ExamSession) error {
	row := toExamSessionModel(session)
	return s.db(ctx).
		Model(&database.ExamSessionModel{}).
		Where("id = ?", session.ID).
		Updates(database.ExamSessionModel{
			Status:           row.Status,
			StartedAt:        row.StartedAt,
			SubmittedAt:      row.SubmittedAt,
			RemainingSeconds: row.RemainingSeconds,
			IPAddress:        row.IPAddress,
			DeviceID:         row.DeviceID,
		}).Error
}

func (s *Store) DeleteExamSession(ctx context.Context, id uint64) error {
	return s.db(ctx).Delete(&database.ExamSessionModel{}, id).Error
}

func toExamSessionModel(e *exam.ExamSession) *database.ExamSessionModel {
	row := &database.ExamSessionModel{
		ID:               e.ID,
		ExamSnapshotID:   e.ExamSnapshotID,
		UserID:           e.UserID,
		Status:           e.Status,
		StartedAt:        e.StartedAt,
		SubmittedAt:      e.SubmittedAt,
		RemainingSeconds: e.RemainingSeconds,
	}
	if e.IPAddress != nil {
		row.IPAddress = e.IPAddress
	}
	if e.DeviceID != nil {
		row.DeviceID = e.DeviceID
	}
	return row
}

func toExamSession(m *database.ExamSessionModel) *exam.ExamSession {
	return &exam.ExamSession{
		ID:               m.ID,
		ExamSnapshotID:   m.ExamSnapshotID,
		UserID:           m.UserID,
		Status:           m.Status,
		StartedAt:        m.StartedAt,
		SubmittedAt:      m.SubmittedAt,
		RemainingSeconds: m.RemainingSeconds,
		IPAddress:        m.IPAddress,
		DeviceID:         m.DeviceID,
	}
}
