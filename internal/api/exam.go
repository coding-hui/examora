package api

import (
	"github.com/gin-gonic/gin"

	"github.com/coding-hui/examora/internal/transport/http/response"
)

func (s *Server) registerExamAdminRoutes(admin *gin.RouterGroup) {
	admin.GET("/exams", s.listExams)
	admin.POST("/exams", s.createExam)
	admin.GET("/exams/:id", s.getExam)
	admin.PUT("/exams/:id", s.updateExam)
	admin.POST("/exams/:id/publish", s.publishExam)
	admin.POST("/exams/:id/close", s.closeExam)
}

func (s *Server) registerExamClientRoutes(client *gin.RouterGroup) {
	client.POST("/exams/:exam_id/submissions", s.createSubmission)
	client.GET("/submissions/:id", s.getSubmission)
	client.GET("/submissions/:id/result", s.getSubmission)
	client.POST("/heartbeat", s.recordClientEvent("HEARTBEAT"))
	client.POST("/device-bind", s.recordClientEvent("DEVICE_BIND"))
	client.POST("/security-report", s.recordClientEvent("SECURITY_REPORT"))
	client.POST("/exam-events", s.recordClientEvent(""))
}

func (s *Server) listExams(c *gin.Context) {
	result, err := s.exam.ListExams(c.Request.Context(), pageQuery(c))
	if err != nil {
		writeError(c, err)
		return
	}
	response.Success(c, pageResponse(result, toExamResponse))
}

func (s *Server) getExam(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	exam, err := s.exam.GetExam(c.Request.Context(), id)
	if err != nil {
		writeError(c, err)
		return
	}
	response.Success(c, toExamResponse(*exam))
}

func (s *Server) createExam(c *gin.Context) {
	req, ok := bindJSON[saveExamRequest](c)
	if !ok {
		return
	}
	exam, err := s.exam.CreateExam(c.Request.Context(), req.command(currentUserID(c)))
	if err != nil {
		writeError(c, err)
		return
	}
	response.Created(c, toExamResponse(*exam))
}

func (s *Server) updateExam(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	req, ok := bindJSON[saveExamRequest](c)
	if !ok {
		return
	}
	exam, err := s.exam.UpdateExam(c.Request.Context(), id, req.command(currentUserID(c)))
	if err != nil {
		writeError(c, err)
		return
	}
	response.Success(c, toExamResponse(*exam))
}

func (s *Server) publishExam(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	if err := s.exam.PublishExam(c.Request.Context(), id); err != nil {
		writeError(c, err)
		return
	}
	response.NoContent(c)
}

func (s *Server) closeExam(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	if err := s.exam.CloseExam(c.Request.Context(), id); err != nil {
		writeError(c, err)
		return
	}
	response.NoContent(c)
}

func (s *Server) createSubmission(c *gin.Context) {
	examID, ok := parseUintParam(c, "exam_id")
	if !ok {
		return
	}
	req, ok := bindJSON[createSubmissionRequest](c)
	if !ok {
		return
	}
	created, err := s.exam.CreateSubmission(c.Request.Context(), examID, currentUserID(c), req.command())
	if err != nil {
		writeError(c, err)
		return
	}
	response.Created(c, createdSubmissionResponse{Submission: toSubmissionResponse(*created.Submission)})
}

func (s *Server) getSubmission(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	submission, err := s.exam.GetSubmission(c.Request.Context(), id, currentUserID(c))
	if err != nil {
		writeError(c, err)
		return
	}
	response.Success(c, toSubmissionResponse(*submission))
}

func (s *Server) recordClientEvent(defaultType string) gin.HandlerFunc {
	return func(c *gin.Context) {
		req, ok := bindJSON[recordEventRequest](c)
		if !ok {
			return
		}
		ev, err := s.exam.RecordClientEvent(c.Request.Context(), currentUserID(c), req.command(defaultType))
		if err != nil {
			writeError(c, err)
			return
		}
		response.Created(c, toClientEventResponse(*ev))
	}
}
