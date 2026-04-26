package usecase

import (
	"context"

	"github.com/coding-hui/examora/internal/client/entity"
)

type Repository interface {
	CreateEvent(ctx context.Context, event *entity.Event) error
}
type Usecase struct{ repo Repository }

func New(repo Repository) *Usecase { return &Usecase{repo: repo} }

type EventRequest struct {
	ExamID    uint64         `json:"exam_id"`
	DeviceID  *string        `json:"device_id"`
	EventType string         `json:"event_type"`
	Payload   map[string]any `json:"payload"`
}

func (u *Usecase) RecordEvent(ctx context.Context, userID uint64, req EventRequest) (*entity.Event, error) {
	ev := &entity.Event{ExamID: req.ExamID, UserID: userID, DeviceID: req.DeviceID, EventType: req.EventType, Payload: req.Payload}
	if err := u.repo.CreateEvent(ctx, ev); err != nil {
		return nil, err
	}
	return ev, nil
}
