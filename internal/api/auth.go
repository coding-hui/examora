package api

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/coding-hui/examora/internal/auth"
	"github.com/coding-hui/examora/internal/transport/http/response"
)

const (
	stateCookieName = "logto_oauth_state"
	tokenCookieName = "examora_token"
)

func (s *Server) registerAuthRoutes(router *gin.Engine, authMiddleware gin.HandlerFunc) {
	router.GET("/api/auth/config", s.getAuthConfig)
	router.POST("/api/auth/login", s.login)
	router.GET("/api/auth/logto/login", s.logtoLogin)
	router.GET("/api/auth/logto/callback", s.logtoCallback)
	router.POST("/api/auth/logout", authMiddleware, s.logout)
	router.GET("/api/auth/me", authMiddleware, s.me)
}

func (s *Server) getAuthConfig(c *gin.Context) {
	response.Success(c, s.auth.GetConfig(c.Request.Context()))
}

func (s *Server) login(c *gin.Context) {
	req, ok := bindJSON[auth.LoginRequest](c)
	if !ok {
		return
	}
	resp, err := s.auth.Login(c.Request.Context(), &req)
	if err != nil {
		writeError(c, err)
		return
	}
	secure := requestScheme(c) == "https"
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(tokenCookieName, resp.Token, int(resp.ExpiresAt-time.Now().Unix()), "/", "", secure, true)
	response.Success(c, resp)
}

func (s *Server) logtoLogin(c *gin.Context) {
	if !s.cfg.IsLogtoEnabled() {
		response.BadRequest(c, "logto is not enabled")
		return
	}
	if s.cfg.LogtoEndpoint == "" {
		response.BadRequest(c, "logto endpoint not configured")
		return
	}

	state := generateSecureState()
	scheme := requestScheme(c)
	callbackURL := fmt.Sprintf("%s://%s/api/auth/logto/callback", scheme, c.Request.Host)

	c.SetSameSite(http.SameSiteStrictMode)
	c.SetCookie(stateCookieName, state, 300, "/", "", scheme == "https", true)

	authURL := fmt.Sprintf(
		"%s/oidc/auth?client_id=%s&redirect_uri=%s&response_type=code&scope=openid%%20profile&state=%s",
		s.cfg.LogtoEndpoint,
		s.cfg.LogtoAppID,
		url.QueryEscape(callbackURL),
		url.QueryEscape(state),
	)
	c.Redirect(http.StatusFound, authURL)
}

func (s *Server) logtoCallback(c *gin.Context) {
	if !s.cfg.IsLogtoEnabled() {
		response.BadRequest(c, "logto is not enabled")
		return
	}

	code := c.Query("code")
	if code == "" {
		response.BadRequest(c, "missing authorization code")
		return
	}
	state := c.Query("state")
	if state == "" {
		response.BadRequest(c, "missing state parameter")
		return
	}
	cookieState, err := c.Cookie(stateCookieName)
	if err != nil || cookieState == "" || cookieState != state {
		response.BadRequest(c, "invalid or expired state")
		return
	}

	scheme := requestScheme(c)
	c.SetCookie(stateCookieName, "", -1, "/", "", scheme == "https", true)

	callbackURL := fmt.Sprintf("%s://%s/api/auth/logto/callback", scheme, c.Request.Host)
	tokenURL := fmt.Sprintf("%s/oidc/token", s.cfg.LogtoEndpoint)
	resp, err := http.PostForm(tokenURL, url.Values{
		"grant_type":   {"authorization_code"},
		"client_id":    {s.cfg.LogtoAppID},
		"code":         {code},
		"redirect_uri": {callbackURL},
	})
	if err != nil {
		writeError(c, response.Internal("failed to exchange code for token"))
		return
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode != http.StatusOK {
		writeError(c, response.Internal(fmt.Sprintf("logto token exchange failed: status %d", resp.StatusCode)))
		return
	}

	var tokenResp struct {
		AccessToken  string `json:"access_token"`
		IDToken      string `json:"id_token"`
		RefreshToken string `json:"refresh_token"`
		ExpiresIn    int    `json:"expires_in"`
		TokenType    string `json:"token_type"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		writeError(c, response.Internal("failed to parse token response"))
		return
	}
	if tokenResp.IDToken == "" {
		writeError(c, response.Unauthorized("no id token received from logto"))
		return
	}

	claims, err := s.auth.VerifyLogtoIDToken(c.Request.Context(), tokenResp.IDToken)
	if err != nil {
		writeError(c, err)
		return
	}
	loginResp, err := s.auth.LoginWithLogto(c.Request.Context(), claims.Subject, claims.Email)
	if err != nil {
		writeError(c, err)
		return
	}

	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(tokenCookieName, loginResp.Token, int(loginResp.ExpiresAt-time.Now().Unix()), "/", "", scheme == "https", true)
	c.Redirect(http.StatusFound, "/")
}

func (s *Server) logout(c *gin.Context) {
	token, ok := bearerToken(c)
	if !ok {
		response.BadRequest(c, "missing bearer token")
		return
	}
	if err := s.auth.Logout(c.Request.Context(), token); err != nil {
		writeError(c, err)
		return
	}
	c.SetCookie(tokenCookieName, "", -1, "/", "", requestScheme(c) == "https", true)
	response.Success(c, nil)
}

func (s *Server) me(c *gin.Context) {
	token, _ := bearerToken(c)
	data, err := s.auth.Me(c.Request.Context(), token)
	if err != nil {
		writeError(c, err)
		return
	}
	response.Success(c, data)
}

func bearerToken(c *gin.Context) (string, bool) {
	header := c.GetHeader("Authorization")
	token, ok := strings.CutPrefix(header, "Bearer ")
	return token, ok && token != ""
}

func requestScheme(c *gin.Context) string {
	if c.Request.TLS != nil || c.GetHeader("X-Forwarded-Proto") == "https" {
		return "https"
	}
	return "http"
}

func generateSecureState() string {
	b := make([]byte, 32)
	_, _ = rand.Read(b)
	return base64.URLEncoding.EncodeToString(b)
}
