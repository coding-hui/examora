package http

import (
	"errors"
	"strconv"

	"github.com/coding-hui/examora/internal/submission/usecase"
	"github.com/coding-hui/examora/internal/transport/http/middleware"
	"github.com/coding-hui/examora/internal/transport/http/response"
	"github.com/gin-gonic/gin"
)

type Handler struct{ uc *usecase.Usecase }

func RegisterRoutes(g *gin.RouterGroup, uc *usecase.Usecase) {
	h := &Handler{uc: uc}
	g.POST("/exams/:exam_id/submissions", h.Create)
	g.GET("/submissions/:id", h.Get)
	g.GET("/submissions/:id/result", h.Get)
}
func (h *Handler) Create(c *gin.Context) {
	examID, e := strconv.ParseUint(c.Param("exam_id"), 10, 64)
	if e != nil {
		response.BadRequest(c, "invalid exam id")
		return
	}
	var req usecase.CreateSubmissionRequest
	if e := c.ShouldBindJSON(&req); e != nil {
		response.BadRequest(c, "invalid request")
		return
	}
	r, e := h.uc.Create(c.Request.Context(), examID, middleware.CurrentUser(c).ID, req)
	if e != nil {
		response.FromError(c, e)
		return
	}
	response.Created(c, r)
}
func (h *Handler) Get(c *gin.Context) {
	id, e := strconv.ParseUint(c.Param("id"), 10, 64)
	if e != nil {
		response.BadRequest(c, "invalid submission id")
		return
	}
	r, e := h.uc.Get(c.Request.Context(), id, middleware.CurrentUser(c).ID)
	if errors.Is(e, usecase.ErrForbidden) {
		response.FromError(c, response.Forbidden(e.Error()))
		return
	}
	if e != nil {
		response.FromError(c, e)
		return
	}
	response.Success(c, r)
}
