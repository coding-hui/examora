package response

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

const (
	CodeSuccess      = 0
	CodeBadRequest   = 40000
	CodeLoginFailed  = 40001
	CodeUnauthorized = 40100
	CodeForbidden    = 40300
	CodeNotFound     = 40400
	CodeConflict     = 40900
	CodeInternal     = 50000
	CodeJudgeError   = 60000
	CodeSandboxError = 60005
	CodeClientRisk   = 70000
)

type Envelope struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Data    any    `json:"data,omitempty"`
	Details any    `json:"details,omitempty"`
}

type AppError struct {
	Status  int
	Code    int
	Message string
	Details any
}

func (e *AppError) Error() string { return e.Message }

func Success(c *gin.Context, data any) {
	c.JSON(http.StatusOK, Envelope{Code: CodeSuccess, Message: "success", Data: data})
}

func Created(c *gin.Context, data any) {
	c.JSON(http.StatusCreated, Envelope{Code: CodeSuccess, Message: "success", Data: data})
}

func NoContent(c *gin.Context) {
	c.JSON(http.StatusOK, Envelope{Code: CodeSuccess, Message: "success"})
}

func BadRequest(c *gin.Context, message string) {
	FromError(c, &AppError{Status: http.StatusBadRequest, Code: CodeBadRequest, Message: message})
}

func FromError(c *gin.Context, err error) {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		c.JSON(http.StatusNotFound, Envelope{Code: CodeNotFound, Message: "resource not found"})
		return
	}
	var appErr *AppError
	if errors.As(err, &appErr) {
		c.JSON(appErr.Status, Envelope{Code: appErr.Code, Message: appErr.Message, Details: appErr.Details})
		return
	}
	c.JSON(http.StatusInternalServerError, Envelope{Code: CodeInternal, Message: "internal server error"})
}

func Unauthorized(message string) *AppError {
	return &AppError{Status: http.StatusUnauthorized, Code: CodeUnauthorized, Message: message}
}

func Forbidden(message string) *AppError {
	return &AppError{Status: http.StatusForbidden, Code: CodeForbidden, Message: message}
}

func NotFound(message string) *AppError {
	return &AppError{Status: http.StatusNotFound, Code: CodeNotFound, Message: message}
}

func Conflict(message string) *AppError {
	return &AppError{Status: http.StatusConflict, Code: CodeConflict, Message: message}
}

func Internal(message string) *AppError {
	return &AppError{Status: http.StatusInternalServerError, Code: CodeInternal, Message: message}
}
