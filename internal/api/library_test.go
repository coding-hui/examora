package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"

	"github.com/coding-hui/examora/internal/infra/database"
	"github.com/coding-hui/examora/internal/infra/transaction"
	"github.com/coding-hui/examora/internal/library"
	librarystore "github.com/coding-hui/examora/internal/library/store"
)

func newLibraryAPIRouter(t *testing.T) (*gin.Engine, *library.Service) {
	t.Helper()

	gin.SetMode(gin.TestMode)

	db, err := database.Open(filepath.Join(t.TempDir(), "examora-api-test.db"))
	require.NoError(t, err)
	require.NoError(t, database.AutoMigrate(db))

	store := librarystore.New(db)
	service, err := library.ProvideService(store, transaction.NewManager(db))
	require.NoError(t, err)

	server := &Server{library: service}
	router := gin.New()
	admin := router.Group("/api/admin")
	server.registerLibraryAdminRoutes(admin)
	return router, service
}

func apiStringPtr(value string) *string {
	return &value
}

func TestListQuestionsEndpointSupportsFiltersAndPaging(t *testing.T) {
	router, service := newLibraryAPIRouter(t)

	_, err := service.CreateQuestion(t.Context(), library.SaveQuestionCommand{
		Type:       library.QuestionTypeSingleChoice,
		Title:      "Go basics",
		Content:    map[string]any{"text": "Which keyword starts a goroutine?"},
		Answer:     map[string]any{"choice": "A"},
		Difficulty: apiStringPtr("EASY"),
		Status:     library.QuestionStatusDraft,
	})
	require.NoError(t, err)

	_, err = service.CreateQuestion(t.Context(), library.SaveQuestionCommand{
		Type:       library.QuestionTypeShortAnswer,
		Title:      "HTTP lifecycle",
		Content:    map[string]any{"text": "Describe router middleware."},
		Answer:     map[string]any{"reference": "router, handler, response"},
		Difficulty: apiStringPtr("MEDIUM"),
		Status:     library.QuestionStatusPublished,
	})
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodGet, "/api/admin/questions?keyword=middleware&type=short_answer&difficulty=medium&status=published&page=1&page_size=10", nil)
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	require.Equal(t, http.StatusOK, resp.Code)

	var body struct {
		Code int `json:"code"`
		Data struct {
			Items    []questionResponse `json:"items"`
			Total    int64              `json:"total"`
			Page     int                `json:"page"`
			PageSize int                `json:"page_size"`
		} `json:"data"`
	}
	require.NoError(t, json.Unmarshal(resp.Body.Bytes(), &body))
	require.Equal(t, 0, body.Code)
	require.EqualValues(t, 1, body.Data.Total)
	require.Equal(t, 1, body.Data.Page)
	require.Equal(t, 10, body.Data.PageSize)
	require.Len(t, body.Data.Items, 1)
	require.Equal(t, library.QuestionTypeShortAnswer, body.Data.Items[0].Type)
	require.Equal(t, "HTTP lifecycle", body.Data.Items[0].Title)
	require.Equal(t, "MEDIUM", *body.Data.Items[0].Difficulty)
	require.Equal(t, library.QuestionStatusPublished, body.Data.Items[0].Status)
	require.Nil(t, body.Data.Items[0].Answer)
	require.False(t, body.Data.Items[0].UpdatedAt.IsZero())
}

func TestListQuestionsEndpointSupportsSorting(t *testing.T) {
	router, service := newLibraryAPIRouter(t)

	_, err := service.CreateQuestion(t.Context(), library.SaveQuestionCommand{
		Type:       library.QuestionTypeSingleChoice,
		Title:      "Draft choice",
		Content:    map[string]any{"text": "draft"},
		Answer:     map[string]any{"choice": "A"},
		Difficulty: apiStringPtr("EASY"),
		Status:     library.QuestionStatusDraft,
	})
	require.NoError(t, err)

	_, err = service.CreateQuestion(t.Context(), library.SaveQuestionCommand{
		Type:       library.QuestionTypeShortAnswer,
		Title:      "Published answer",
		Content:    map[string]any{"text": "published answer"},
		Answer:     map[string]any{"reference": "answer"},
		Difficulty: apiStringPtr("MEDIUM"),
		Status:     library.QuestionStatusPublished,
	})
	require.NoError(t, err)

	_, err = service.CreateQuestion(t.Context(), library.SaveQuestionCommand{
		Type:       library.QuestionTypeTrueFalse,
		Title:      "Published true false",
		Content:    map[string]any{"text": "published true false"},
		Answer:     map[string]any{"correct": true},
		Difficulty: apiStringPtr("EASY"),
		Status:     library.QuestionStatusPublished,
	})
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodGet, "/api/admin/questions?status=published&sort_field=type&sort_order=desc&page=1&page_size=10", nil)
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	require.Equal(t, http.StatusOK, resp.Code)

	var body struct {
		Code int `json:"code"`
		Data struct {
			Items []questionResponse `json:"items"`
			Total int64              `json:"total"`
		} `json:"data"`
	}
	require.NoError(t, json.Unmarshal(resp.Body.Bytes(), &body))
	require.Equal(t, 0, body.Code)
	require.EqualValues(t, 2, body.Data.Total)
	require.Len(t, body.Data.Items, 2)
	require.Equal(t, library.QuestionTypeTrueFalse, body.Data.Items[0].Type)
	require.Equal(t, library.QuestionTypeShortAnswer, body.Data.Items[1].Type)
}

func TestListQuestionsEndpointNormalizesUnsafeSortAndPaging(t *testing.T) {
	router, service := newLibraryAPIRouter(t)

	_, err := service.CreateQuestion(t.Context(), library.SaveQuestionCommand{
		Type:       library.QuestionTypeSingleChoice,
		Title:      "Safe sort",
		Content:    map[string]any{"text": "safe sort"},
		Answer:     map[string]any{"choice": "A"},
		Difficulty: apiStringPtr("EASY"),
		Status:     library.QuestionStatusDraft,
	})
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodGet, "/api/admin/questions?sort_field=updated_at%3Bdrop%20table%20questions&sort_order=asc&page=0&page_size=100000", nil)
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	require.Equal(t, http.StatusOK, resp.Code)

	var body struct {
		Code int `json:"code"`
		Data struct {
			Items    []questionResponse `json:"items"`
			Total    int64              `json:"total"`
			Page     int                `json:"page"`
			PageSize int                `json:"page_size"`
		} `json:"data"`
	}
	require.NoError(t, json.Unmarshal(resp.Body.Bytes(), &body))
	require.Equal(t, 0, body.Code)
	require.EqualValues(t, 1, body.Data.Total)
	require.Len(t, body.Data.Items, 1)
	require.Equal(t, 1, body.Data.Page)
	require.Equal(t, 100, body.Data.PageSize)
	require.Equal(t, "Safe sort", body.Data.Items[0].Title)
}
