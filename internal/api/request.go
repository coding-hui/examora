package api

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/coding-hui/examora/internal/auth"
	"github.com/coding-hui/examora/internal/transport/http/middleware"
	"github.com/coding-hui/examora/internal/transport/http/response"
)

func bindJSON[T any](c *gin.Context) (T, bool) {
	var req T
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "invalid request")
		return req, false
	}
	return req, true
}

func parseUintParam(c *gin.Context, name string) (uint64, bool) {
	value := c.Param(name)
	id, err := strconv.ParseUint(value, 10, 64)
	if err != nil {
		response.BadRequest(c, "invalid "+name)
		return 0, false
	}
	return id, true
}

func pageQuery(c *gin.Context) (int, int) {
	pageNum, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	return normalizePage(pageNum, pageSize)
}

func normalizePage(pageNum, pageSize int) (int, int) {
	if pageNum < 1 {
		pageNum = 1
	}
	if pageSize < 1 {
		pageSize = 20
	}
	if pageSize > 100 {
		pageSize = 100
	}
	return pageNum, pageSize
}

func currentUser(c *gin.Context) *auth.AuthenticatedUser {
	return middleware.CurrentUser(c)
}

func currentUserID(c *gin.Context) uint64 {
	return currentUser(c).ID
}
