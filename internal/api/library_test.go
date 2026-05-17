package api

import (
	"bytes"
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
	admin := router.Group("/api/v1")
	server.registerLibraryAdminRoutes(admin)
	return router, service
}

func apiStringPtr(value string) *string {
	return &value
}

func apiChoiceContent(text string) map[string]any {
	return map[string]any{
		"text": text,
		"options": []any{
			map[string]any{"key": "A", "text": "A"},
			map[string]any{"key": "B", "text": "B"},
		},
	}
}

func TestListQuestionsEndpointSupportsFiltersAndPaging(t *testing.T) {
	router, service := newLibraryAPIRouter(t)

	_, err := service.CreateQuestion(t.Context(), library.SaveQuestionCommand{
		Type:       library.QuestionTypeSingleChoice,
		Title:      "Go basics",
		Content:    apiChoiceContent("Which keyword starts a goroutine?"),
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

	req := httptest.NewRequest(http.MethodGet, "/api/v1/questions?keyword=middleware&type=short_answer&difficulty=medium&status=published&page=1&page_size=10", nil)
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

func TestListQuestionsEndpointSupportsUpdatedAtSorting(t *testing.T) {
	router, service := newLibraryAPIRouter(t)

	_, err := service.CreateQuestion(t.Context(), library.SaveQuestionCommand{
		Type:       library.QuestionTypeSingleChoice,
		Title:      "Draft choice",
		Content:    apiChoiceContent("draft"),
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

	req := httptest.NewRequest(http.MethodGet, "/api/v1/questions?status=published&sort_field=updated_at&sort_order=desc&page=1&page_size=10", nil)
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
	require.Equal(t, "Published true false", body.Data.Items[0].Title)
	require.Equal(t, "Published answer", body.Data.Items[1].Title)
}

func TestListQuestionsEndpointNormalizesUnsafeSortAndPaging(t *testing.T) {
	router, service := newLibraryAPIRouter(t)

	_, err := service.CreateQuestion(t.Context(), library.SaveQuestionCommand{
		Type:       library.QuestionTypeSingleChoice,
		Title:      "Safe sort",
		Content:    apiChoiceContent("safe sort"),
		Answer:     map[string]any{"choice": "A"},
		Difficulty: apiStringPtr("EASY"),
		Status:     library.QuestionStatusDraft,
	})
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/questions?sort_field=updated_at%3Bdrop%20table%20questions&sort_order=asc&page=0&page_size=100000", nil)
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

func TestBatchPatchQuestionStatusEndpointReturnsPartialFailures(t *testing.T) {
	router, service := newLibraryAPIRouter(t)
	ctx := t.Context()

	ready, err := service.CreateQuestion(ctx, library.SaveQuestionCommand{
		Type:    library.QuestionTypeTrueFalse,
		Title:   "Ready",
		Content: map[string]any{"text": "Go is compiled."},
		Answer:  map[string]any{"correct": true},
		Status:  library.QuestionStatusDraft,
	})
	require.NoError(t, err)
	bodyBytes, err := json.Marshal(map[string]any{
		"ids":    []uint64{ready.ID, 99999},
		"status": library.QuestionStatusPublished,
	})
	require.NoError(t, err)
	req := httptest.NewRequest(http.MethodPatch, "/api/v1/questions/batch/status", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	require.Equal(t, http.StatusOK, resp.Code)
	var body struct {
		Code int                 `json:"code"`
		Data library.BatchResult `json:"data"`
	}
	require.NoError(t, json.Unmarshal(resp.Body.Bytes(), &body))
	require.Equal(t, 0, body.Code)
	require.Equal(t, 1, body.Data.SuccessCount)
	require.Equal(t, 1, body.Data.FailedCount)
	require.Len(t, body.Data.Failures, 1)

	published, err := service.GetQuestion(ctx, ready.ID)
	require.NoError(t, err)
	require.Equal(t, library.QuestionStatusPublished, published.Status)
}

func TestBatchPatchQuestionStatusEndpointReportsReferencedPublishedPaperFailure(t *testing.T) {
	router, service := newLibraryAPIRouter(t)
	ctx := t.Context()

	referenced, err := service.CreateQuestion(ctx, library.SaveQuestionCommand{
		Type:    library.QuestionTypeTrueFalse,
		Title:   "Referenced",
		Content: map[string]any{"text": "Go is compiled."},
		Answer:  map[string]any{"correct": true},
		Status:  library.QuestionStatusPublished,
	})
	require.NoError(t, err)
	loose, err := service.CreateQuestion(ctx, library.SaveQuestionCommand{
		Type:    library.QuestionTypeTrueFalse,
		Title:   "Loose",
		Content: map[string]any{"text": "Go has maps."},
		Answer:  map[string]any{"correct": true},
		Status:  library.QuestionStatusPublished,
	})
	require.NoError(t, err)
	paper, err := service.CreatePaper(ctx, library.SavePaperCommand{
		Title:  "Published paper",
		Status: library.PaperStatusDraft,
	})
	require.NoError(t, err)
	_, err = service.AddPaperQuestion(ctx, paper.ID, library.AddPaperQuestionCommand{
		QuestionID: referenced.ID,
		Score:      10,
	})
	require.NoError(t, err)
	_, err = service.UpdatePaper(ctx, paper.ID, library.SavePaperCommand{
		Title:  paper.Title,
		Status: library.PaperStatusPublished,
	})
	require.NoError(t, err)

	bodyBytes, err := json.Marshal(map[string]any{
		"ids":    []uint64{referenced.ID, loose.ID},
		"status": library.QuestionStatusDraft,
	})
	require.NoError(t, err)
	req := httptest.NewRequest(http.MethodPatch, "/api/v1/questions/batch/status", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	require.Equal(t, http.StatusOK, resp.Code)
	var body struct {
		Data library.BatchResult `json:"data"`
	}
	require.NoError(t, json.Unmarshal(resp.Body.Bytes(), &body))
	require.Equal(t, 1, body.Data.SuccessCount)
	require.Equal(t, 1, body.Data.FailedCount)
	require.Len(t, body.Data.Failures, 1)
	require.Equal(t, referenced.ID, body.Data.Failures[0].ID)
	require.Contains(t, body.Data.Failures[0].Reason, library.ErrQuestionReferenced.Error())
}

func TestBatchDeleteQuestionsEndpointProtectsReferencedQuestions(t *testing.T) {
	router, service := newLibraryAPIRouter(t)
	ctx := t.Context()

	referenced, err := service.CreateQuestion(ctx, library.SaveQuestionCommand{
		Type:    library.QuestionTypeTrueFalse,
		Title:   "Referenced",
		Content: map[string]any{"text": "Go is compiled."},
		Answer:  map[string]any{"correct": true},
		Status:  library.QuestionStatusPublished,
	})
	require.NoError(t, err)
	loose, err := service.CreateQuestion(ctx, library.SaveQuestionCommand{
		Type:    library.QuestionTypeTrueFalse,
		Title:   "Loose",
		Content: map[string]any{"text": "Go has maps."},
		Answer:  map[string]any{"correct": true},
		Status:  library.QuestionStatusDraft,
	})
	require.NoError(t, err)
	paper, err := service.CreatePaper(ctx, library.SavePaperCommand{
		Title:  "Backend paper",
		Status: library.PaperStatusDraft,
	})
	require.NoError(t, err)
	_, err = service.AddPaperQuestion(ctx, paper.ID, library.AddPaperQuestionCommand{
		QuestionID: referenced.ID,
		Score:      5,
		SortOrder:  1,
	})
	require.NoError(t, err)

	bodyBytes, err := json.Marshal(map[string]any{"ids": []uint64{referenced.ID, loose.ID}})
	require.NoError(t, err)
	req := httptest.NewRequest(http.MethodDelete, "/api/v1/questions/batch", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	require.Equal(t, http.StatusOK, resp.Code)
	var body struct {
		Data library.BatchResult `json:"data"`
	}
	require.NoError(t, json.Unmarshal(resp.Body.Bytes(), &body))
	require.Equal(t, 1, body.Data.SuccessCount)
	require.Equal(t, 1, body.Data.FailedCount)
	require.Contains(t, body.Data.Failures[0].Reason, library.ErrQuestionReferenced.Error())
	_, err = service.GetQuestion(ctx, loose.ID)
	require.Error(t, err)
	_, err = service.GetQuestion(ctx, referenced.ID)
	require.NoError(t, err)
}

func TestBatchDeleteQuestionsEndpointRejectsEmptyIDs(t *testing.T) {
	router, _ := newLibraryAPIRouter(t)

	req := httptest.NewRequest(http.MethodDelete, "/api/v1/questions/batch", bytes.NewReader([]byte(`{"ids":[]}`)))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	require.Equal(t, http.StatusBadRequest, resp.Code)
}

func TestListPapersEndpointSupportsFiltersAndSummary(t *testing.T) {
	router, service := newLibraryAPIRouter(t)
	ctx := t.Context()

	draft, err := service.CreatePaper(ctx, library.SavePaperCommand{
		Title:       "Backend basics",
		Description: "Go and HTTP",
		Status:      library.PaperStatusDraft,
	})
	require.NoError(t, err)
	_, err = service.CreatePaper(ctx, library.SavePaperCommand{
		Title:       "Frontend basics",
		Description: "React",
		Status:      library.PaperStatusDraft,
	})
	require.NoError(t, err)
	question, err := service.CreateQuestion(ctx, library.SaveQuestionCommand{
		Type:    library.QuestionTypeTrueFalse,
		Title:   "Go is compiled",
		Content: map[string]any{"text": "Go is compiled."},
		Answer:  map[string]any{"correct": true},
		Status:  library.QuestionStatusPublished,
	})
	require.NoError(t, err)
	_, err = service.AddPaperQuestion(ctx, draft.ID, library.AddPaperQuestionCommand{
		QuestionID: question.ID,
		Score:      12.5,
		SortOrder:  1,
	})
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/papers?keyword=backend&status=draft&page=1&page_size=10", nil)
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	require.Equal(t, http.StatusOK, resp.Code)

	var body struct {
		Code int `json:"code"`
		Data struct {
			Items []paperResponse `json:"items"`
			Total int64           `json:"total"`
		} `json:"data"`
	}
	require.NoError(t, json.Unmarshal(resp.Body.Bytes(), &body))
	require.Equal(t, 0, body.Code)
	require.EqualValues(t, 1, body.Data.Total)
	require.Len(t, body.Data.Items, 1)
	require.Equal(t, "Backend basics", body.Data.Items[0].Title)
	require.Equal(t, library.PaperStatusDraft, body.Data.Items[0].Status)
	require.Equal(t, 1, body.Data.Items[0].QuestionCount)
	require.Equal(t, 12.5, body.Data.Items[0].TotalScore)
}

func TestUpdatePaperEndpointRejectsInvalidPublish(t *testing.T) {
	router, service := newLibraryAPIRouter(t)
	ctx := t.Context()

	paper, err := service.CreatePaper(ctx, library.SavePaperCommand{
		Title:  "Empty publish paper",
		Status: library.PaperStatusDraft,
	})
	require.NoError(t, err)
	bodyBytes, err := json.Marshal(map[string]any{
		"title":  paper.Title,
		"status": library.PaperStatusPublished,
	})
	require.NoError(t, err)
	req := httptest.NewRequest(http.MethodPut, "/api/v1/papers/1", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	require.Equal(t, http.StatusBadRequest, resp.Code)
	loaded, err := service.GetPaper(ctx, paper.ID)
	require.NoError(t, err)
	require.Equal(t, library.PaperStatusDraft, loaded.Status)
}

func TestBatchDeletePapersEndpointReturnsPartialFailures(t *testing.T) {
	router, service := newLibraryAPIRouter(t)
	ctx := t.Context()

	first, err := service.CreatePaper(ctx, library.SavePaperCommand{
		Title:  "First",
		Status: library.PaperStatusDraft,
	})
	require.NoError(t, err)
	second, err := service.CreatePaper(ctx, library.SavePaperCommand{
		Title:  "Second",
		Status: library.PaperStatusDraft,
	})
	require.NoError(t, err)

	bodyBytes, err := json.Marshal(map[string]any{"ids": []uint64{first.ID, second.ID, 99999}})
	require.NoError(t, err)
	req := httptest.NewRequest(http.MethodDelete, "/api/v1/papers/batch", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	require.Equal(t, http.StatusOK, resp.Code)
	var body struct {
		Data library.BatchResult `json:"data"`
	}
	require.NoError(t, json.Unmarshal(resp.Body.Bytes(), &body))
	require.Equal(t, 2, body.Data.SuccessCount)
	require.Equal(t, 1, body.Data.FailedCount)
	require.Len(t, body.Data.Failures, 1)
}

func TestListPaperQuestionsEndpointReturnsQuestionSummary(t *testing.T) {
	router, service := newLibraryAPIRouter(t)

	paper, err := service.CreatePaper(t.Context(), library.SavePaperCommand{
		Title:  "Backend paper",
		Status: library.PaperStatusDraft,
	})
	require.NoError(t, err)
	question, err := service.CreateQuestion(t.Context(), library.SaveQuestionCommand{
		Type:       library.QuestionTypeTrueFalse,
		Title:      "Go is compiled",
		Content:    map[string]any{"text": "Go is compiled."},
		Answer:     map[string]any{"correct": true},
		Difficulty: apiStringPtr("EASY"),
		Status:     library.QuestionStatusPublished,
	})
	require.NoError(t, err)
	_, err = service.AddPaperQuestion(t.Context(), paper.ID, library.AddPaperQuestionCommand{
		QuestionID: question.ID,
		Score:      5,
		SortOrder:  2,
	})
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/papers/1/questions", nil)
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	require.Equal(t, http.StatusOK, resp.Code)

	var body struct {
		Code int                         `json:"code"`
		Data []paperQuestionListResponse `json:"data"`
	}
	require.NoError(t, json.Unmarshal(resp.Body.Bytes(), &body))
	require.Equal(t, 0, body.Code)
	require.Len(t, body.Data, 1)
	require.Equal(t, question.ID, body.Data[0].QuestionID)
	require.Equal(t, "Go is compiled", body.Data[0].Title)
	require.Equal(t, library.QuestionTypeTrueFalse, body.Data[0].Type)
	require.Equal(t, "EASY", *body.Data[0].Difficulty)
	require.Equal(t, library.QuestionStatusPublished, body.Data[0].Status)
	require.Equal(t, 5.0, body.Data[0].Score)
	require.Equal(t, 2, body.Data[0].SortOrder)
}

func TestUpdatePaperQuestionEndpointUpdatesScoreAndSortOrder(t *testing.T) {
	router, service := newLibraryAPIRouter(t)

	paper, err := service.CreatePaper(t.Context(), library.SavePaperCommand{
		Title:  "Backend paper",
		Status: library.PaperStatusDraft,
	})
	require.NoError(t, err)
	question, err := service.CreateQuestion(t.Context(), library.SaveQuestionCommand{
		Type:    library.QuestionTypeTrueFalse,
		Title:   "Go is compiled",
		Content: map[string]any{"text": "Go is compiled."},
		Answer:  map[string]any{"correct": true},
		Status:  library.QuestionStatusPublished,
	})
	require.NoError(t, err)
	_, err = service.AddPaperQuestion(t.Context(), paper.ID, library.AddPaperQuestionCommand{
		QuestionID: question.ID,
		Score:      5,
		SortOrder:  2,
	})
	require.NoError(t, err)

	bodyBytes, err := json.Marshal(map[string]any{"score": 12.5, "sort_order": 1})
	require.NoError(t, err)
	req := httptest.NewRequest(http.MethodPatch, "/api/v1/papers/1/questions/1", bytes.NewReader(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	require.Equal(t, http.StatusOK, resp.Code)

	var body struct {
		Code int                       `json:"code"`
		Data paperQuestionListResponse `json:"data"`
	}
	require.NoError(t, json.Unmarshal(resp.Body.Bytes(), &body))
	require.Equal(t, 0, body.Code)
	require.Equal(t, question.ID, body.Data.QuestionID)
	require.Equal(t, "Go is compiled", body.Data.Title)
	require.Equal(t, 12.5, body.Data.Score)
	require.Equal(t, 1, body.Data.SortOrder)
}
