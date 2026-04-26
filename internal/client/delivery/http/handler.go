package http

import (
	"github.com/coding-hui/examora/internal/client/usecase"
	"github.com/coding-hui/examora/internal/transport/http/middleware"
	"github.com/coding-hui/examora/internal/transport/http/response"
	"github.com/gin-gonic/gin"
)

type Handler struct{ uc *usecase.Usecase }

func RegisterRoutes(g *gin.RouterGroup, uc *usecase.Usecase) {
	h := &Handler{uc: uc}
	g.POST("/heartbeat", h.Record("HEARTBEAT"))
	g.POST("/device-bind", h.Record("DEVICE_BIND"))
	g.POST("/security-report", h.Record("SECURITY_REPORT"))
	g.POST("/exam-events", h.Record(""))
}
func (h *Handler) Record(defaultType string) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req usecase.EventRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			response.BadRequest(c, "invalid request")
			return
		}
		if req.EventType == "" {
			req.EventType = defaultType
		}
		ev, err := h.uc.RecordEvent(c.Request.Context(), middleware.CurrentUser(c).ID, req)
		if err != nil {
			response.FromError(c, err)
			return
		}
		response.Created(c, ev)
	}
}
