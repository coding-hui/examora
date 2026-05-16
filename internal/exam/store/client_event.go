package store

import (
	"context"

	"github.com/coding-hui/examora/internal/exam"
	"github.com/coding-hui/examora/internal/infra/database"
)

func (s *Store) CreateClientEvent(ctx context.Context, ev *exam.ClientEvent) error {
	row := &database.ClientEventModel{ExamID: ev.ExamID, UserID: ev.UserID, DeviceID: ev.DeviceID, EventType: ev.EventType, Payload: mapToJSON(ev.Payload)}
	if err := s.db(ctx).Create(row).Error; err != nil {
		return err
	}
	ev.ID = row.ID
	ev.CreatedAt = row.CreatedAt
	return nil
}

func (s *Store) ListClientEvents(ctx context.Context, examID uint64, pageNum, pageSize int) ([]exam.ClientEvent, int64, error) {
	db := s.db(ctx).Model(&database.ClientEventModel{}).Where("exam_id = ?", examID)
	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var rows []database.ClientEventModel
	if err := db.Order("created_at DESC, id DESC").Offset((pageNum - 1) * pageSize).Limit(pageSize).Find(&rows).Error; err != nil {
		return nil, 0, err
	}
	items := make([]exam.ClientEvent, 0, len(rows))
	for _, row := range rows {
		items = append(items, exam.ClientEvent{
			ID:        row.ID,
			ExamID:    row.ExamID,
			UserID:    row.UserID,
			DeviceID:  row.DeviceID,
			EventType: row.EventType,
			Payload:   jsonToMap(row.Payload),
			CreatedAt: row.CreatedAt,
		})
	}
	return items, total, nil
}
