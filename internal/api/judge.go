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
	pageNum, pageSize := pageQuery(c)
	items, total, err := s.judge.List(c.Request.Context(), pageNum, pageSize)
	if err != nil {
		writeError(c, err)
		return
	}
	response.PageSuccessWith(c, items, total, pageNum, pageSize, toJudgeTaskResponse)
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
