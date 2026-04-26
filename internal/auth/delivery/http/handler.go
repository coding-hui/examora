package http

import (
	"github.com/gin-gonic/gin"

	authusecase "github.com/coding-hui/examora/internal/auth/usecase"
	"github.com/coding-hui/examora/internal/transport/http/middleware"
	"github.com/coding-hui/examora/internal/transport/http/response"
)

type Handler struct{}

func NewHandler() *Handler {
	return &Handler{}
}

func (h *Handler) Me(c *gin.Context) {
	user := middleware.CurrentUser(c)
	if err := authusecase.RequireAdmin(user); err != nil {
		response.FromError(c, err)
		return
	}
	response.Success(c, authusecase.ToAuthMe(user))
}

func RegisterRoutes(router *gin.Engine, authMiddleware gin.HandlerFunc) {
	handler := NewHandler()
	router.GET("/api/auth/me", authMiddleware, handler.Me)
}
