package exam

import (
	"context"
	"time"
)

type ClientEvent struct {
	ID        uint64         `json:"id"`
	ExamID    uint64         `json:"exam_id"`
	UserID    uint64         `json:"user_id"`
	DeviceID  *string        `json:"device_id"`
	EventType string         `json:"event_type"`
	Payload   map[string]any `json:"payload"`
	CreatedAt time.Time      `json:"created_at"`
}

type RecordEventCommand struct {
	ExamID    uint64
	DeviceID  *string
	EventType string
	Payload   map[string]any
}

func (s *Service) RecordClientEvent(ctx context.Context, userID uint64, cmd RecordEventCommand) (*ClientEvent, error) {
	ev := &ClientEvent{ExamID: cmd.ExamID, UserID: userID, DeviceID: cmd.DeviceID, EventType: cmd.EventType, Payload: cmd.Payload}
	if err := s.store.CreateClientEvent(ctx, ev); err != nil {
		return nil, err
	}
	return ev, nil
}
