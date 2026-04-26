package api

import (
	"github.com/gin-gonic/gin"

	"github.com/coding-hui/examora/internal/auth"
	"github.com/coding-hui/examora/internal/exam"
	"github.com/coding-hui/examora/internal/infra/config"
	"github.com/coding-hui/examora/internal/judge"
	"github.com/coding-hui/examora/internal/library"
	"github.com/coding-hui/examora/internal/transport/http/middleware"
)

type Server struct {
	auth    *auth.Service
	library *library.Service
	exam    *exam.Service
	judge   *judge.Service
	cfg     config.Config
}

func ProvideServer(authSvc *auth.Service, librarySvc *library.Service, examSvc *exam.Service, judgeSvc *judge.Service, cfg config.Config) (*Server, error) {
	return &Server{auth: authSvc, library: librarySvc, exam: examSvc, judge: judgeSvc, cfg: cfg}, nil
}

func (s *Server) RegisterRoutes(router *gin.Engine) {
	router.GET("/health", s.health)
	router.GET("/api/health", s.health)

	authMW := middleware.Authenticator(s.auth)
	s.registerAuthRoutes(router, authMW)

	admin := router.Group("/api/admin", authMW, middleware.RequireAdmin(s.auth))
	s.registerLibraryAdminRoutes(admin)
	s.registerExamAdminRoutes(admin)
	s.registerJudgeRoutes(admin)

	client := router.Group("/api/client", authMW, middleware.RequireClient(s.auth))
	s.registerExamClientRoutes(client)
}
