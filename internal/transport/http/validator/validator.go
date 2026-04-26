package validator

import "github.com/gin-gonic/gin"

func BindJSON(c *gin.Context, dst any) error {
	return c.ShouldBindJSON(dst)
}
