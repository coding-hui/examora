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
		}).Error
}

func toExamSessionModel(e *exam.ExamSession) *database.ExamSessionModel {
	return &database.ExamSessionModel{
		ExamSnapshotID:   e.ExamSnapshotID,
		UserID:           e.UserID,
		Status:           e.Status,
		StartedAt:        e.StartedAt,
		SubmittedAt:      e.SubmittedAt,
		RemainingSeconds: e.RemainingSeconds,
		IPAddress:        e.IPAddress,
		DeviceID:         e.DeviceID,
	}
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
