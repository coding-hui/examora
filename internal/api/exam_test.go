package api

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strconv"
	"testing"
	"time"

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

	router, service, _ := newExamAPIRouterWithLibrary(t)
	return router, service
}

func newExamAPIRouterWithLibrary(t *testing.T) (*gin.Engine, *exam.Service, *library.Service) {
	t.Helper()

	gin.SetMode(gin.TestMode)

	db, err := database.Open(filepath.Join(t.TempDir(), "examora-api-exam-test.db"))
	require.NoError(t, err)
	require.NoError(t, database.AutoMigrate(db))

	libraryStore := librarystore.New(db)
	libraryService, err := library.ProvideService(libraryStore, transaction.NewManager(db))
	require.NoError(t, err)

	examStore := examstore.New(db)
	service, err := exam.ProvideService(examStore, libraryStore, apiRecordingJudgeDispatcher{}, db)
	require.NoError(t, err)

	server := &Server{exam: service}
	router := gin.New()
	admin := router.Group("/api/v1")
	server.registerExamAdminRoutes(admin)
	return router, service, libraryService
}

func createAPIExamWithPublishedPaper(t *testing.T, ctx context.Context, exams *exam.Service, libraryService *library.Service) *exam.Exam {
	t.Helper()

	question, err := libraryService.CreateQuestion(ctx, library.SaveQuestionCommand{
		Type:    library.QuestionTypeTrueFalse,
		Title:   "Go is compiled",
		Content: map[string]any{"text": "Go is compiled."},
		Answer:  map[string]any{"correct": true},
		Status:  library.QuestionStatusPublished,
	})
	require.NoError(t, err)
	paper, err := libraryService.CreatePaper(ctx, library.SavePaperCommand{
		Title:  "Batch3 paper",
		Status: library.PaperStatusDraft,
	})
	require.NoError(t, err)
	_, err = libraryService.AddPaperQuestion(ctx, paper.ID, library.AddPaperQuestionCommand{
		QuestionID: question.ID,
		Score:      10,
		SortOrder:  1,
	})
	require.NoError(t, err)
	_, err = libraryService.UpdatePaper(ctx, paper.ID, library.SavePaperCommand{
		Title:  paper.Title,
		Status: library.PaperStatusPublished,
	})
	require.NoError(t, err)
	created, err := exams.CreateExam(ctx, exam.SaveExamCommand{
		Title:           "Batch3 exam",
		Description:     "operations",
		PaperID:         &paper.ID,
		Status:          exam.StatusDraft,
		DurationMinutes: 60,
	})
	require.NoError(t, err)
	return created
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
	req := httptest.NewRequest(http.MethodPost, "/api/v1/exams/batch/close", bytes.NewReader(bodyBytes))
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

func TestGetExamEndpointReturnsOperationsMetadata(t *testing.T) {
	router, service, libraryService := newExamAPIRouterWithLibrary(t)
	ctx := t.Context()

	created := createAPIExamWithPublishedPaper(t, ctx, service, libraryService)
	start := time.Now().Add(-time.Hour)
	end := time.Now().Add(time.Hour)
	snapshot, err := service.PublishExamWithSnapshot(ctx, created.ID, start, end, 60)
	require.NoError(t, err)
	result, err := service.AssignCandidates(ctx, created.ID, []uint64{101, 102})
	require.NoError(t, err)
	require.Equal(t, 2, result.SuccessCount)
	_, err = service.StartExamSession(ctx, created.ID, 101, "127.0.0.1", "device-a")
	require.NoError(t, err)
	require.NoError(t, service.SubmitExam(ctx, created.ID, 101))
	deviceID := "device-a"
	_, err = service.RecordClientEvent(ctx, 101, exam.RecordEventCommand{
		ExamID:    created.ID,
		DeviceID:  &deviceID,
		EventType: "focus_lost",
		Payload:   map[string]any{"count": 1},
	})
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/exams/"+strconv.FormatUint(created.ID, 10), nil)
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	require.Equal(t, http.StatusOK, resp.Code)
	var body struct {
		Data struct {
			ID                    uint64  `json:"id"`
			ExamSnapshotID        *uint64 `json:"exam_snapshot_id"`
			PublishedAt           *string `json:"published_at"`
			SnapshotQuestionCount int     `json:"snapshot_question_count"`
			SnapshotTotalScore    float64 `json:"snapshot_total_score"`
			CandidateCount        int64   `json:"candidate_count"`
			SubmittedCount        int64   `json:"submitted_count"`
			ResultCount           int64   `json:"result_count"`
			AuditEventCount       int64   `json:"audit_event_count"`
		} `json:"data"`
	}
	require.NoError(t, json.Unmarshal(resp.Body.Bytes(), &body))
	require.Equal(t, created.ID, body.Data.ID)
	require.NotNil(t, body.Data.ExamSnapshotID)
	require.Equal(t, snapshot.ID, *body.Data.ExamSnapshotID)
	require.NotNil(t, body.Data.PublishedAt)
	require.Equal(t, 1, body.Data.SnapshotQuestionCount)
	require.Equal(t, 10.0, body.Data.SnapshotTotalScore)
	require.EqualValues(t, 2, body.Data.CandidateCount)
	require.EqualValues(t, 1, body.Data.SubmittedCount)
	require.EqualValues(t, 1, body.Data.ResultCount)
	require.EqualValues(t, 1, body.Data.AuditEventCount)
}

func TestListExamSessionsEndpointReturnsPaginatedResponse(t *testing.T) {
	router, service, libraryService := newExamAPIRouterWithLibrary(t)
	ctx := t.Context()

	created := createAPIExamWithPublishedPaper(t, ctx, service, libraryService)
	_, err := service.PublishExamWithSnapshot(ctx, created.ID, time.Now().Add(-time.Hour), time.Now().Add(time.Hour), 60)
	require.NoError(t, err)
	result, err := service.AssignCandidates(ctx, created.ID, []uint64{101, 102, 103})
	require.NoError(t, err)
	require.Equal(t, 3, result.SuccessCount)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/exams/"+strconv.FormatUint(created.ID, 10)+"/sessions?page=2&page_size=1", nil)
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	require.Equal(t, http.StatusOK, resp.Code)
	var body struct {
		Data struct {
			Items    []examSessionResponse `json:"items"`
			Total    int64                 `json:"total"`
			Page     int                   `json:"page"`
			PageSize int                   `json:"page_size"`
		} `json:"data"`
	}
	require.NoError(t, json.Unmarshal(resp.Body.Bytes(), &body))
	require.Len(t, body.Data.Items, 1)
	require.EqualValues(t, 3, body.Data.Total)
	require.Equal(t, 2, body.Data.Page)
	require.Equal(t, 1, body.Data.PageSize)
	require.EqualValues(t, 102, body.Data.Items[0].UserID)
}
