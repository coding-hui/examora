package server

import (
	"context"
	"log/slog"

	"github.com/hibiken/asynq"

	judgeworker "github.com/coding-hui/examora/internal/judge/worker"
)

type WorkerServer struct {
	container *Container
	server    *asynq.Server
	mux       *asynq.ServeMux
}

func NewWorkerServer(c *Container) *WorkerServer {
	mux := asynq.NewServeMux()
	judgeworker.New(c.Judge).Register(mux)

	server := asynq.NewServer(
		asynq.RedisClientOpt{
			Addr:     c.Config.RedisAddr,
			Password: c.Config.RedisPassword,
			DB:       c.Config.RedisDB,
		},
		asynq.Config{
			Concurrency: 4,
			Queues: map[string]int{
				"judge":   10,
				"default": 1,
			},
		},
	)

	return &WorkerServer{
		container: c,
		server:    server,
		mux:       mux,
	}
}

func (s *WorkerServer) Run(_ context.Context) error {
	s.Logger().Info("worker server starting")
	return s.server.Run(s.mux)
}

func (s *WorkerServer) Logger() *slog.Logger {
	return s.container.Logger
}
