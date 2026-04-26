package http

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/coding-hui/examora/internal/kernel"
	"github.com/coding-hui/examora/internal/question/usecase"
	"github.com/coding-hui/examora/internal/transport/http/middleware"
	"github.com/coding-hui/examora/internal/transport/http/response"
)

type Handler struct{ uc *usecase.Usecase }

func RegisterRoutes(group *gin.RouterGroup, uc *usecase.Usecase) {
	h := &Handler{uc: uc}
	group.GET("/questions", h.List)
	group.POST("/questions", h.Create)
	group.GET("/questions/:id", h.Get)
	group.PUT("/questions/:id", h.Update)
	group.DELETE("/questions/:id", h.Delete)
	group.POST("/questions/:id/test-cases", h.AddTestCase)
	group.GET("/questions/:id/test-cases", h.ListTestCases)
}

func (h *Handler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	result, err := h.uc.List(c.Request.Context(), kernel.PageQuery{Page: page, PageSize: pageSize})
	if err != nil {
		response.FromError(c, err)
		return
	}
	response.Success(c, result)
}

func (h *Handler) Get(c *gin.Context) {
	id, err := parseID(c)
	if err != nil {
		response.BadRequest(c, "invalid question id")
		return
	}
	q, err := h.uc.Get(c.Request.Context(), id)
	if err != nil {
		response.FromError(c, err)
		return
	}
	response.Success(c, q)
}

func (h *Handler) Create(c *gin.Context) {
	var req usecase.SaveQuestionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request")
		return
	}
	req.CreatedBy = middleware.CurrentUser(c).ID
	q, err := h.uc.Create(c.Request.Context(), req)
	if err != nil {
		response.FromError(c, err)
		return
	}
	response.Created(c, q)
}

func (h *Handler) Update(c *gin.Context) {
	id, err := parseID(c)
	if err != nil {
		response.BadRequest(c, "invalid question id")
		return
	}
	var req usecase.SaveQuestionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request")
		return
	}
	q, err := h.uc.Update(c.Request.Context(), id, req)
	if err != nil {
		response.FromError(c, err)
		return
	}
	response.Success(c, q)
}

func (h *Handler) Delete(c *gin.Context) {
	id, err := parseID(c)
	if err != nil {
		response.BadRequest(c, "invalid question id")
		return
	}
	if err := h.uc.Delete(c.Request.Context(), id); err != nil {
		response.FromError(c, err)
		return
	}
	response.NoContent(c)
}

func (h *Handler) AddTestCase(c *gin.Context) {
	id, err := parseID(c)
	if err != nil {
		response.BadRequest(c, "invalid question id")
		return
	}
	var req usecase.SaveTestCaseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request")
		return
	}
	tc, err := h.uc.AddTestCase(c.Request.Context(), id, req)
	if err != nil {
		response.FromError(c, err)
		return
	}
	response.Created(c, tc)
}

func (h *Handler) ListTestCases(c *gin.Context) {
	id, err := parseID(c)
	if err != nil {
		response.BadRequest(c, "invalid question id")
		return
	}
	items, err := h.uc.ListTestCases(c.Request.Context(), id, true)
	if err != nil {
		response.FromError(c, err)
		return
	}
	response.Success(c, items)
}

func parseID(c *gin.Context) (uint64, error) { return strconv.ParseUint(c.Param("id"), 10, 64) }
