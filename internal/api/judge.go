package api

import (
	"github.com/gin-gonic/gin"

	"github.com/coding-hui/examora/internal/transport/http/response"
)

func (s *Server) registerJudgeRoutes(admin *gin.RouterGroup) {
	admin.GET("/judge/tasks", s.listJudgeTasks)
	admin.GET("/judge/tasks/:id", s.getJudgeTask)
}

func (s *Server) listJudgeTasks(c *gin.Context) {
	result, err := s.judge.List(c.Request.Context(), pageQuery(c))
	if err != nil {
		writeError(c, err)
		return
	}
	response.Success(c, toJudgeTaskPage(result))
}

func (s *Server) getJudgeTask(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	task, err := s.judge.Get(c.Request.Context(), id)
	if err != nil {
		writeError(c, err)
		return
	}
	response.Success(c, toJudgeTaskResponse(*task))
}
