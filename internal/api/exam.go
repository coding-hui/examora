package api

import (
	"github.com/gin-gonic/gin"

	examSvc "github.com/coding-hui/examora/internal/exam"
	"github.com/coding-hui/examora/internal/transport/http/response"
)

func (s *Server) registerExamAdminRoutes(admin *gin.RouterGroup) {
	admin.GET("/exams", s.listExams)
	admin.POST("/exams", s.createExam)
	admin.POST("/exams/batch/close", s.batchCloseExams)
	admin.GET("/exams/:id", s.getExam)
	admin.PUT("/exams/:id", s.updateExam)
	admin.POST("/exams/:id/publish", s.publishExamWithSnapshot)
	admin.POST("/exams/:id/close", s.closeExam)
	admin.GET("/exams/:id/results", s.listExamResults)
	admin.GET("/exam-results/:id", s.getExamResult)
}

func (s *Server) listCandidateExams(c *gin.Context) {
	userID := currentUserID(c)
	items, err := s.exam.ListAvailableExams(c.Request.Context(), userID)
	if err != nil {
		writeError(c, err)
		return
	}
	response.Success(c, map[string]any{"items": items})
}

func (s *Server) registerExamClientRoutes(client *gin.RouterGroup) {
	client.GET("/available", s.listCandidateExams)
	client.GET("/:id/paper", s.getCandidatePaper)
	client.POST("/:id/sessions/start", s.startExamSession)
	client.GET("/:id/sessions/current", s.getCurrentSession)
	client.POST("/:id/answers", s.saveAnswers)
	client.POST("/:id/submit", s.submitExam)
	client.GET("/:id/result", s.getMyExamResult)
}

func (s *Server) registerClientCommonRoutes(client *gin.RouterGroup) {
	client.POST("/submissions", s.createSubmission)
	client.GET("/submissions/:id", s.getSubmission)
	client.GET("/submissions/:id/result", s.getSubmission)
	client.POST("/heartbeat", s.recordClientEvent("HEARTBEAT"))
	client.POST("/device-bind", s.recordClientEvent("DEVICE_BIND"))
	client.POST("/security-report", s.recordClientEvent("SECURITY_REPORT"))
	client.POST("/exam-events", s.recordClientEvent(""))
}

func (s *Server) listExams(c *gin.Context) {
	pageNum, pageSize := pageQuery(c)
	items, total, err := s.exam.ListExams(c.Request.Context(), pageNum, pageSize)
	if err != nil {
		writeError(c, err)
		return
	}
	response.PageSuccessWith(c, items, total, pageNum, pageSize, toExamResponse)
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

func (s *Server) batchCloseExams(c *gin.Context) {
	req, ok := bindJSON[batchIDsRequest](c)
	if !ok {
		return
	}
	if len(normalizeBatchIDs(req.IDs)) == 0 {
		response.BadRequest(c, "ids are required")
		return
	}
	result := s.exam.BatchCloseExams(c.Request.Context(), req.IDs)
	response.Success(c, result)
}

// M1: Candidate exam flow handlers

func (s *Server) publishExamWithSnapshot(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	var req publishExamRequest
	if !bindJSONAndCheck(c, &req) {
		return
	}
	snapshot, err := s.exam.PublishExamWithSnapshot(c.Request.Context(), id, req.StartTime, req.EndTime, req.DurationMinutes)
	if err != nil {
		writeError(c, err)
		return
	}
	response.Created(c, toExamSnapshotResponse(*snapshot))
}

func (s *Server) getCandidatePaper(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	paper, err := s.exam.GetCandidatePaper(c.Request.Context(), id, currentUserID(c))
	if err != nil {
		writeError(c, err)
		return
	}
	response.Success(c, toCandidatePaperResponse(paper))
}

func (s *Server) startExamSession(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	var req startSessionRequest
	if !bindJSONAndCheck(c, &req) {
		return
	}
	ipAddress := c.ClientIP()
	deviceID := ""
	if req.DeviceID != nil {
		deviceID = *req.DeviceID
	}
	session, err := s.exam.StartExamSession(c.Request.Context(), id, currentUserID(c), ipAddress, deviceID)
	if err != nil {
		writeError(c, err)
		return
	}
	response.Created(c, toExamSessionResponse(*session))
}

func (s *Server) getCurrentSession(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	session, err := s.exam.GetCurrentSession(c.Request.Context(), id, currentUserID(c))
	if err != nil {
		writeError(c, err)
		return
	}
	response.Success(c, toExamSessionResponse(*session))
}

func (s *Server) submitExam(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	if err := s.exam.SubmitExam(c.Request.Context(), id, currentUserID(c)); err != nil {
		writeError(c, err)
		return
	}
	response.NoContent(c)
}

func (s *Server) createSubmission(c *gin.Context) {
	req, ok := bindJSON[createSubmissionRequest](c)
	if !ok {
		return
	}
	if req.ExamID == 0 || req.QuestionID == 0 {
		response.BadRequest(c, "exam_id and question_id are required")
		return
	}
	created, err := s.exam.CreateSubmission(c.Request.Context(), req.ExamID, currentUserID(c), req.command())
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

func (s *Server) listExamResults(c *gin.Context) {
	examID, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	pageNum, pageSize := pageQuery(c)
	items, total, err := s.exam.ListExamResults(c.Request.Context(), examID, pageNum, pageSize)
	if err != nil {
		writeError(c, err)
		return
	}
	response.PageSuccessWith(c, items, total, pageNum, pageSize, func(item examSvc.ExamResult) examResultResponse {
		return toExamResultResponse(item, false)
	})
}

func (s *Server) getExamResult(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	result, err := s.exam.GetExamResult(c.Request.Context(), id)
	if err != nil {
		writeError(c, err)
		return
	}
	response.Success(c, toExamResultResponse(*result, true))
}

func (s *Server) getMyExamResult(c *gin.Context) {
	examID, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	result, err := s.exam.GetExamResultForUser(c.Request.Context(), examID, currentUserID(c))
	if err != nil {
		writeError(c, err)
		return
	}
	response.Success(c, toExamResultResponse(*result, false))
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

func (s *Server) saveAnswers(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	var req saveAnswersRequest
	if !bindJSONAndCheck(c, &req) {
		return
	}
	if err := s.exam.SaveAnswers(c.Request.Context(), id, currentUserID(c), req.Answers); err != nil {
		writeError(c, err)
		return
	}
	response.NoContent(c)
}
