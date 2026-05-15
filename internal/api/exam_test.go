package api

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"

	"github.com/coding-hui/examora/internal/exam"
	examstore "github.com/coding-hui/examora/internal/exam/store"
	"github.com/coding-hui/examora/internal/infra/database"
	"github.com/coding-hui/examora/internal/infra/transaction"
	"github.com/coding-hui/examora/internal/library"
	librarystore "github.com/coding-hui/examora/internal/library/store"
)

type apiRecordingJudgeDispatcher struct{}

func (apiRecordingJudgeDispatcher) CreateAndEnqueue(context.Context, uint64, uint64, uint64, string) error {
	return nil
}

func newExamAPIRouter(t *testing.T) (*gin.Engine, *exam.Service) {
	t.Helper()

	gin.SetMode(gin.TestMode)

	db, err := database.Open(filepath.Join(t.TempDir(), "examora-api-exam-test.db"))
	require.NoError(t, err)
	require.NoError(t, database.AutoMigrate(db))

	libraryStore := librarystore.New(db)
	_, err = library.ProvideService(libraryStore, transaction.NewManager(db))
	require.NoError(t, err)

	examStore := examstore.New(db)
	service, err := exam.ProvideService(examStore, libraryStore, apiRecordingJudgeDispatcher{}, db)
	require.NoError(t, err)

	server := &Server{exam: service}
	router := gin.New()
	admin := router.Group("/api/admin")
	server.registerExamAdminRoutes(admin)
	return router, service
}

func TestBatchCloseExamsEndpointReturnsPartialFailures(t *testing.T) {
	router, service := newExamAPIRouter(t)
	ctx := t.Context()

	published, err := service.CreateExam(ctx, exam.SaveExamCommand{
		Title:  "Published exam",
		Status: exam.StatusPublished,
	})
	require.NoError(t, err)
	draft, err := service.CreateExam(ctx, exam.SaveExamCommand{
		Title:  "Draft exam",
		Status: exam.StatusDraft,
	})
	require.NoError(t, err)

	bodyBytes, err := json.Marshal(map[string]any{"ids": []uint64{published.ID, draft.ID}})
	require.NoError(t, err)
	req := httptest.NewRequest(http.MethodPost, "/api/admin/exams/batch/close", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	require.Equal(t, http.StatusOK, resp.Code)
	var body struct {
		Code int              `json:"code"`
		Data exam.BatchResult `json:"data"`
	}
	require.NoError(t, json.Unmarshal(resp.Body.Bytes(), &body))
	require.Equal(t, 0, body.Code)
	require.Equal(t, 1, body.Data.SuccessCount)
	require.Equal(t, 1, body.Data.FailedCount)

	closed, err := service.GetExam(ctx, published.ID)
	require.NoError(t, err)
	require.Equal(t, exam.StatusClosed, closed.Status)
}
