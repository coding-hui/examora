package api

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/coding-hui/examora/internal/auth"
	"github.com/coding-hui/examora/internal/page"
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

func pageQuery(c *gin.Context) page.Query {
	pageNum, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	return page.Query{Page: pageNum, PageSize: pageSize}.Normalize()
}

func currentUser(c *gin.Context) *auth.AuthenticatedUser {
	return middleware.CurrentUser(c)
}

func currentUserID(c *gin.Context) uint64 {
	return currentUser(c).ID
}
