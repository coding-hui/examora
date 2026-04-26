package http

import (
	"strconv"

	"github.com/coding-hui/examora/internal/exam/usecase"
	"github.com/coding-hui/examora/internal/kernel"
	"github.com/coding-hui/examora/internal/transport/http/middleware"
	"github.com/coding-hui/examora/internal/transport/http/response"
	"github.com/gin-gonic/gin"
)

type Handler struct{ uc *usecase.Usecase }

func RegisterRoutes(g *gin.RouterGroup, uc *usecase.Usecase) {
	h := &Handler{uc: uc}
	g.GET("/exams", h.List)
	g.POST("/exams", h.Create)
	g.GET("/exams/:id", h.Get)
	g.PUT("/exams/:id", h.Update)
	g.POST("/exams/:id/publish", h.Publish)
	g.POST("/exams/:id/close", h.Close)
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
	id, e := parseID(c)
	if e != nil {
		response.BadRequest(c, "invalid exam id")
		return
	}
	r, e := h.uc.Get(c.Request.Context(), id)
	if e != nil {
		response.FromError(c, e)
		return
	}
	response.Success(c, r)
}
func (h *Handler) Create(c *gin.Context) {
	var req usecase.SaveExamRequest
	if e := c.ShouldBindJSON(&req); e != nil {
		response.BadRequest(c, "invalid request")
		return
	}
	req.CreatedBy = middleware.CurrentUser(c).ID
	r, e := h.uc.Create(c.Request.Context(), req)
	if e != nil {
		response.FromError(c, e)
		return
	}
	response.Created(c, r)
}
func (h *Handler) Update(c *gin.Context) {
	id, e := parseID(c)
	if e != nil {
		response.BadRequest(c, "invalid exam id")
		return
	}
	var req usecase.SaveExamRequest
	if e := c.ShouldBindJSON(&req); e != nil {
		response.BadRequest(c, "invalid request")
		return
	}
	r, e := h.uc.Update(c.Request.Context(), id, req)
	if e != nil {
		response.FromError(c, e)
		return
	}
	response.Success(c, r)
}
func (h *Handler) Publish(c *gin.Context) {
	id, e := parseID(c)
	if e != nil {
		response.BadRequest(c, "invalid exam id")
		return
	}
	if e := h.uc.Publish(c.Request.Context(), id); e != nil {
		response.FromError(c, e)
		return
	}
	response.NoContent(c)
}
func (h *Handler) Close(c *gin.Context) {
	id, e := parseID(c)
	if e != nil {
		response.BadRequest(c, "invalid exam id")
		return
	}
	if e := h.uc.Close(c.Request.Context(), id); e != nil {
		response.FromError(c, e)
		return
	}
	response.NoContent(c)
}
func parseID(c *gin.Context) (uint64, error) { return strconv.ParseUint(c.Param("id"), 10, 64) }
