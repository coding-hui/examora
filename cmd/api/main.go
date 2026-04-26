// main provides the API server entrypoint.
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

	apiServer := server.NewAPIServer(c)
	apiServer.RegisterRoutes()

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	if err := apiServer.Run(ctx); err != nil {
		c.Logger.Error("api server error", "error", err)
	}
}
