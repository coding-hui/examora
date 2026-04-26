package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/coding-hui/examora/internal/auth"
	"github.com/coding-hui/examora/internal/transport/http/response"
)

const currentUserKey = "current_user"

func Authenticator(authSvc *auth.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		token, ok := strings.CutPrefix(header, "Bearer ")
		if !ok || token == "" {
			response.FromError(c, response.Unauthorized("missing bearer token"))
			c.Abort()
			return
		}
		user, err := authSvc.Authenticate(c.Request.Context(), token)
		if err != nil {
			response.FromError(c, err)
			c.Abort()
			return
		}
		c.Set(currentUserKey, user)
		c.Next()
	}
}

func RequireAdmin(authSvc *auth.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		if err := authSvc.RequireAdmin(CurrentUser(c)); err != nil {
			response.FromError(c, err)
			c.Abort()
			return
		}
		c.Next()
	}
}

func RequireClient(authSvc *auth.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		if err := authSvc.RequireClient(CurrentUser(c)); err != nil {
			response.FromError(c, err)
			c.Abort()
			return
		}
		c.Next()
	}
}

func CurrentUser(c *gin.Context) *auth.AuthenticatedUser {
	value, exists := c.Get(currentUserKey)
	if !exists {
		return &auth.AuthenticatedUser{}
	}
	user, ok := value.(*auth.AuthenticatedUser)
	if !ok {
		return &auth.AuthenticatedUser{}
	}
	return user
}
