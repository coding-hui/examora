package http

import (
	"strconv"

	"github.com/coding-hui/examora/internal/kernel"
	"github.com/coding-hui/examora/internal/paper/usecase"
	"github.com/coding-hui/examora/internal/transport/http/middleware"
	"github.com/coding-hui/examora/internal/transport/http/response"
	"github.com/gin-gonic/gin"
)

type Handler struct{ uc *usecase.Usecase }

func RegisterRoutes(g *gin.RouterGroup, uc *usecase.Usecase) {
	h := &Handler{uc: uc}
	g.GET("/papers", h.List)
	g.POST("/papers", h.Create)
	g.GET("/papers/:id", h.Get)
	g.PUT("/papers/:id", h.Update)
	g.DELETE("/papers/:id", h.Delete)
	g.POST("/papers/:id/questions", h.AddQuestion)
	g.DELETE("/papers/:id/questions/:question_id", h.RemoveQuestion)
}
func (h *Handler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	r, e := h.uc.List(c.Request.Context(), kernel.PageQuery{Page: page, PageSize: size})
	if e != nil {
		response.FromError(c, e)
		return
	}
	response.Success(c, r)
}
func (h *Handler) Get(c *gin.Context) {
	id, e := parseID(c, "id")
	if e != nil {
		response.BadRequest(c, "invalid paper id")
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
	var req usecase.SavePaperRequest
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
	id, e := parseID(c, "id")
	if e != nil {
		response.BadRequest(c, "invalid paper id")
		return
	}
	var req usecase.SavePaperRequest
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
func (h *Handler) Delete(c *gin.Context) {
	id, e := parseID(c, "id")
	if e != nil {
		response.BadRequest(c, "invalid paper id")
		return
	}
	if e := h.uc.Delete(c.Request.Context(), id); e != nil {
		response.FromError(c, e)
		return
	}
	response.NoContent(c)
}
func (h *Handler) AddQuestion(c *gin.Context) {
	id, e := parseID(c, "id")
	if e != nil {
		response.BadRequest(c, "invalid paper id")
		return
	}
	var req usecase.AddQuestionRequest
	if e := c.ShouldBindJSON(&req); e != nil {
		response.BadRequest(c, "invalid request")
		return
	}
	r, e := h.uc.AddQuestion(c.Request.Context(), id, req)
	if e != nil {
		response.FromError(c, e)
		return
	}
	response.Created(c, r)
}
func (h *Handler) RemoveQuestion(c *gin.Context) {
	id, e := parseID(c, "id")
	if e != nil {
		response.BadRequest(c, "invalid paper id")
		return
	}
	qid, e := parseID(c, "question_id")
	if e != nil {
		response.BadRequest(c, "invalid question id")
		return
	}
	if e := h.uc.RemoveQuestion(c.Request.Context(), id, qid); e != nil {
		response.FromError(c, e)
		return
	}
	response.NoContent(c)
}
func parseID(c *gin.Context, key string) (uint64, error) {
	return strconv.ParseUint(c.Param(key), 10, 64)
}
