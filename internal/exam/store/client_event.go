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
