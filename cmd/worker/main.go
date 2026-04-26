// main provides the worker server entrypoint.
package main

import (
	"context"
	"os/signal"
	"syscall"

	"github.com/coding-hui/examora/internal/infra/config"
	"github.com/coding-hui/examora/internal/server"
)

func main() {
	cfg := config.Load()
	c, err := server.NewContainer(cfg)
	if err != nil {
		panic(err)
	}

	workerServer := server.NewWorkerServer(c)

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	if err := workerServer.Run(ctx); err != nil {
		c.Logger.Error("worker server error", "error", err)
	}
}
