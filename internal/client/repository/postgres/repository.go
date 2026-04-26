package postgres

import (
	"context"
	"encoding/json"

	"github.com/coding-hui/examora/internal/client/entity"
	"github.com/coding-hui/examora/internal/platform/database"
	"github.com/coding-hui/examora/internal/platform/transaction"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type Repository struct{ db *gorm.DB }

func New(db *gorm.DB) *Repository { return &Repository{db: db} }
func (r *Repository) CreateEvent(ctx context.Context, ev *entity.Event) error {
	row := &database.ClientEventModel{ExamID: ev.ExamID, UserID: ev.UserID, DeviceID: ev.DeviceID, EventType: ev.EventType, Payload: fromMap(ev.Payload)}
	if err := transaction.DBFromContext(ctx, r.db).Create(row).Error; err != nil {
		return err
	}
	ev.ID = row.ID
	ev.CreatedAt = row.CreatedAt
	return nil
}
func fromMap(data map[string]any) datatypes.JSON {
	if data == nil {
		return nil
	}
	raw, _ := json.Marshal(data)
	return datatypes.JSON(raw)
}
