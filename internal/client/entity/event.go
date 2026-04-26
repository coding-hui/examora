package entity

import "time"

type Event struct {
	ID        uint64         `json:"id"`
	ExamID    uint64         `json:"exam_id"`
	UserID    uint64         `json:"user_id"`
	DeviceID  *string        `json:"device_id"`
	EventType string         `json:"event_type"`
	Payload   map[string]any `json:"payload"`
	CreatedAt time.Time      `json:"created_at"`
}
