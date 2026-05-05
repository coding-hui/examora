package api

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/coding-hui/examora/internal/exam"
	"github.com/coding-hui/examora/internal/library"
	"github.com/coding-hui/examora/internal/transport/http/response"
)

func (s *Server) health(c *gin.Context) {
	response.Success(c, gin.H{"service": "examora-api", "status": "ok", "time": time.Now().UTC()})
}

func writeError(c *gin.Context, err error) {
	if err == nil {
		return
	}
	if library.IsNotFound(err) || exam.IsNotFound(err) {
		c.JSON(http.StatusNotFound, response.Envelope{Code: response.CodeNotFound, Message: err.Error()})
		return
	}
	if library.IsConflict(err) || exam.IsConflict(err) {
		c.JSON(http.StatusConflict, response.Envelope{Code: response.CodeConflict, Message: err.Error()})
		return
	}
	if library.IsValidation(err) || exam.IsValidation(err) {
		c.JSON(http.StatusBadRequest, response.Envelope{Code: response.CodeBadRequest, Message: err.Error()})
		return
	}
	if exam.IsForbidden(err) {
		c.JSON(http.StatusForbidden, response.Envelope{Code: response.CodeForbidden, Message: err.Error()})
		return
	}
	response.FromError(c, err)
}
