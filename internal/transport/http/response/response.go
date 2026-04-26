package response

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
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

type Page[T any] struct {
	Items    []T   `json:"items"`
	Total    int64 `json:"total"`
	Page     int   `json:"page"`
	PageSize int   `json:"page_size"`
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

func PageSuccess[T any](c *gin.Context, items []T, total int64, page int, pageSize int) {
	Success(c, Page[T]{Items: items, Total: total, Page: page, PageSize: pageSize})
}

func PageSuccessWith[T any, U any](c *gin.Context, items []T, total int64, page int, pageSize int, mapper func(T) U) {
	mapped := make([]U, 0, len(items))
	for _, item := range items {
		mapped = append(mapped, mapper(item))
	}
	PageSuccess(c, mapped, total, page, pageSize)
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
