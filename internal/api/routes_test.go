package api

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
)

func TestRegisterRoutesUsesVersionedResourcePaths(t *testing.T) {
	gin.SetMode(gin.TestMode)

	server := &Server{}
	router := gin.New()
	server.RegisterRoutes(router)

	registered := map[string]struct{}{}
	for _, route := range router.Routes() {
		registered[route.Method+" "+route.Path] = struct{}{}
	}

	require.Contains(t, registered, "POST /api/v1/auth/login")
	require.Contains(t, registered, "GET /api/v1/questions")
	require.Contains(t, registered, "GET /api/v1/exams/available")
	require.Contains(t, registered, "POST /api/v1/exams/:id/sessions/start")
	require.Contains(t, registered, "POST /api/v1/submissions")

	require.NotContains(t, registered, "POST /api/auth/login")
	require.NotContains(t, registered, "GET /api/admin/questions")
	require.NotContains(t, registered, "GET /api/client/exams")
	require.NotContains(t, registered, "POST /api/client/exams/:id/sessions/start")
}

func TestRemovedLegacyRoutePrefixesReturnNotFound(t *testing.T) {
	gin.SetMode(gin.TestMode)

	server := &Server{}
	router := gin.New()
	server.RegisterRoutes(router)

	for _, path := range []string{
		"/api/auth/login",
		"/api/admin/questions",
		"/api/client/exams",
		"/api/client/exams/1/sessions/start",
	} {
		req := httptest.NewRequest(http.MethodGet, path, nil)
		resp := httptest.NewRecorder()

		router.ServeHTTP(resp, req)

		require.Equal(t, http.StatusNotFound, resp.Code, path)
	}
}
