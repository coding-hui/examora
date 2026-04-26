package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"

	authentity "github.com/coding-hui/examora/internal/auth/entity"
	authusecase "github.com/coding-hui/examora/internal/auth/usecase"
	"github.com/coding-hui/examora/internal/transport/http/response"
)

const currentUserKey = "current_user"

func Authenticator(auth *authusecase.Usecase) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		token, ok := strings.CutPrefix(header, "Bearer ")
		if !ok || token == "" {
			response.FromError(c, response.Unauthorized("missing bearer token"))
			c.Abort()
			return
		}
		user, err := auth.Authenticate(c.Request.Context(), token)
		if err != nil {
			response.FromError(c, err)
			c.Abort()
			return
		}
		c.Set(currentUserKey, user)
		c.Next()
	}
}

func RequireAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		if err := authusecase.RequireAdmin(CurrentUser(c)); err != nil {
			response.FromError(c, err)
			c.Abort()
			return
		}
		c.Next()
	}
}

func RequireClient() gin.HandlerFunc {
	return func(c *gin.Context) {
		if err := authusecase.RequireClient(CurrentUser(c)); err != nil {
			response.FromError(c, err)
			c.Abort()
			return
		}
		c.Next()
	}
}

func CurrentUser(c *gin.Context) *authentity.User {
	value, exists := c.Get(currentUserKey)
	if !exists {
		return &authentity.User{}
	}
	user, ok := value.(*authentity.User)
	if !ok {
		return &authentity.User{}
	}
	return user
}
