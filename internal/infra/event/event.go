package event

import (
	"context"
	"log/slog"
)

type Publisher interface {
	Publish(ctx context.Context, event any) error
}

type LoggerPublisher struct {
	logger *slog.Logger
}

func NewLoggerPublisher(logger *slog.Logger) *LoggerPublisher {
	return &LoggerPublisher{logger: logger}
}

func (p *LoggerPublisher) Publish(ctx context.Context, event any) error {
	p.logger.InfoContext(ctx, "event published", "event", event)
	return nil
}
