package http

import (
	"strconv"

	"github.com/coding-hui/examora/internal/judge/usecase"
	"github.com/coding-hui/examora/internal/kernel"
	"github.com/coding-hui/examora/internal/transport/http/response"
	"github.com/gin-gonic/gin"
)

type Handler struct{ uc *usecase.Usecase }

func RegisterRoutes(g *gin.RouterGroup, uc *usecase.Usecase) {
	h := &Handler{uc: uc}
	g.GET("/judge/tasks", h.List)
	g.GET("/judge/tasks/:id", h.Get)
}
func (h *Handler) List(c *gin.Context) {
	p, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	s, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	r, e := h.uc.List(c.Request.Context(), kernel.PageQuery{Page: p, PageSize: s})
	if e != nil {
		response.FromError(c, e)
		return
	}
	response.Success(c, r)
}
func (h *Handler) Get(c *gin.Context) {
	id, e := strconv.ParseUint(c.Param("id"), 10, 64)
	if e != nil {
		response.BadRequest(c, "invalid task id")
		return
	}
	r, e := h.uc.Get(c.Request.Context(), id)
	if e != nil {
		response.FromError(c, e)
		return
	}
	response.Success(c, r)
}
