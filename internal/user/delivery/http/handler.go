package http

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/coding-hui/examora/internal/kernel"
	"github.com/coding-hui/examora/internal/transport/http/response"
	"github.com/coding-hui/examora/internal/user/usecase"
)

type Handler struct {
	uc *usecase.Usecase
}

func NewHandler(uc *usecase.Usecase) *Handler {
	return &Handler{uc: uc}
}

func RegisterRoutes(group *gin.RouterGroup, uc *usecase.Usecase) {
	h := NewHandler(uc)
	group.GET("/users", h.List)
	group.POST("/users", h.Create)
	group.GET("/users/:id", h.Get)
	group.PUT("/users/:id", h.Update)
	group.DELETE("/users/:id", h.Delete)
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
		response.BadRequest(c, "invalid user id")
		return
	}
	user, err := h.uc.Get(c.Request.Context(), id)
	if err != nil {
		response.FromError(c, err)
		return
	}
	response.Success(c, user)
}

func (h *Handler) Create(c *gin.Context) {
	var req usecase.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request")
		return
	}
	user, err := h.uc.Create(c.Request.Context(), req)
	if err != nil {
		response.FromError(c, err)
		return
	}
	response.Created(c, user)
}

func (h *Handler) Update(c *gin.Context) {
	id, err := parseID(c)
	if err != nil {
		response.BadRequest(c, "invalid user id")
		return
	}
	var req usecase.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request")
		return
	}
	user, err := h.uc.Update(c.Request.Context(), id, req)
	if err != nil {
		response.FromError(c, err)
		return
	}
	response.Success(c, user)
}

func (h *Handler) Delete(c *gin.Context) {
	id, err := parseID(c)
	if err != nil {
		response.BadRequest(c, "invalid user id")
		return
	}
	if err := h.uc.Delete(c.Request.Context(), id); err != nil {
		response.FromError(c, err)
		return
	}
	response.NoContent(c)
}

func parseID(c *gin.Context) (uint64, error) {
	return strconv.ParseUint(c.Param("id"), 10, 64)
}
