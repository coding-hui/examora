package server

import (
	"context"
	"log/slog"
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"github.com/coding-hui/examora/internal/transport/http/middleware"
)

type APIServer struct {
	container *Container
	router    *gin.Engine
}

func NewAPIServer(c *Container) *APIServer {
	router := gin.New()
	router.Use(gin.Recovery(), cors.Default(), middleware.RequestID())

	return &APIServer{
		container: c,
		router:    router,
	}
}

func (s *APIServer) RegisterRoutes() {
	s.container.API.RegisterRoutes(s.router)
}

func (s *APIServer) Run(ctx context.Context) error {
	s.Logger().Info("api server starting", "addr", s.container.Config.Address())
	srv := &http.Server{
		Addr:    s.container.Config.Address(),
		Handler: s.router,
	}
	go func() {
		<-ctx.Done()
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := srv.Shutdown(shutdownCtx); err != nil {
			s.Logger().Error("server shutdown error", "error", err)
		}
	}()
	return srv.ListenAndServe()
}

func (s *APIServer) Logger() *slog.Logger {
	return s.container.Logger
}
