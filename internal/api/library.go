package api

import (
	"github.com/gin-gonic/gin"

	"github.com/coding-hui/examora/internal/library"
	"github.com/coding-hui/examora/internal/transport/http/response"
)

func (s *Server) registerLibraryAdminRoutes(admin *gin.RouterGroup) {
	admin.GET("/questions", s.listQuestions)
	admin.POST("/questions", s.createQuestion)
	admin.PATCH("/questions/batch/status", s.batchPatchQuestionStatus)
	admin.DELETE("/questions/batch", s.batchDeleteQuestions)
	admin.GET("/questions/:id", s.getQuestion)
	admin.PUT("/questions/:id", s.updateQuestion)
	admin.PATCH("/questions/:id", s.patchQuestion)
	admin.DELETE("/questions/:id", s.deleteQuestion)
	admin.POST("/questions/:id/test-cases", s.addTestCase)
	admin.GET("/questions/:id/test-cases", s.listTestCases)

	admin.GET("/papers", s.listPapers)
	admin.POST("/papers", s.createPaper)
	admin.DELETE("/papers/batch", s.batchDeletePapers)
	admin.GET("/papers/:id", s.getPaper)
	admin.PUT("/papers/:id", s.updatePaper)
	admin.DELETE("/papers/:id", s.deletePaper)
	admin.GET("/papers/:id/outline", s.getPaperOutline)
	admin.PUT("/papers/:id/outline", s.savePaperOutline)
	admin.GET("/papers/:id/questions", s.listPaperQuestions)
	admin.POST("/papers/:id/questions", s.addPaperQuestion)
	admin.PATCH("/papers/:id/questions/:question_id", s.updatePaperQuestion)
	admin.DELETE("/papers/:id/questions/:question_id", s.removePaperQuestion)
}

func (s *Server) listQuestions(c *gin.Context) {
	pageNum, pageSize := pageQuery(c)
	filter := library.QuestionFilter{
		Keyword:    c.Query("keyword"),
		Type:       c.Query("type"),
		Difficulty: c.Query("difficulty"),
		Status:     c.Query("status"),
		SortField:  c.Query("sort_field"),
		SortOrder:  c.Query("sort_order"),
		PageNum:    pageNum,
		PageSize:   pageSize,
	}
	items, total, err := s.library.ListQuestions(c.Request.Context(), filter)
	if err != nil {
		writeError(c, err)
		return
	}
	response.PageSuccessWith(c, items, total, pageNum, pageSize, toQuestionAdminResponse)
}

func (s *Server) getQuestion(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	q, err := s.library.GetQuestion(c.Request.Context(), id)
	if err != nil {
		writeError(c, err)
		return
	}
	tcs, err := s.library.ListTestCases(c.Request.Context(), id, true)
	if err != nil {
		writeError(c, err)
		return
	}
	response.Success(c, toQuestionResponseWithTestCases(*q, tcs, true))
}

func (s *Server) createQuestion(c *gin.Context) {
	req, ok := bindJSON[saveQuestionRequest](c)
	if !ok {
		return
	}
	q, err := s.library.CreateQuestion(c.Request.Context(), req.command(currentUserID(c)))
	if err != nil {
		writeError(c, err)
		return
	}
	tcs, err := s.library.ListTestCases(c.Request.Context(), q.ID, true)
	if err != nil {
		writeError(c, err)
		return
	}
	response.Created(c, toQuestionResponseWithTestCases(*q, tcs, true))
}

func (s *Server) updateQuestion(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	req, ok := bindJSON[saveQuestionRequest](c)
	if !ok {
		return
	}
	q, err := s.library.UpdateQuestion(c.Request.Context(), id, req.command(currentUserID(c)))
	if err != nil {
		writeError(c, err)
		return
	}
	tcs, err := s.library.ListTestCases(c.Request.Context(), id, true)
	if err != nil {
		writeError(c, err)
		return
	}
	response.Success(c, toQuestionResponseWithTestCases(*q, tcs, true))
}

func (s *Server) patchQuestion(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	req, ok := bindJSON[patchQuestionRequest](c)
	if !ok {
		return
	}
	q, err := s.library.PatchQuestionStatus(c.Request.Context(), id, req.Status)
	if err != nil {
		writeError(c, err)
		return
	}
	response.Success(c, toQuestionAdminResponse(*q))
}

func (s *Server) deleteQuestion(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	if err := s.library.DeleteQuestion(c.Request.Context(), id); err != nil {
		writeError(c, err)
		return
	}
	response.NoContent(c)
}

func (s *Server) batchPatchQuestionStatus(c *gin.Context) {
	req, ok := bindJSON[batchQuestionStatusRequest](c)
	if !ok {
		return
	}
	if len(normalizeBatchIDs(req.IDs)) == 0 {
		response.BadRequest(c, "ids are required")
		return
	}
	result := s.library.BatchPatchQuestionStatus(c.Request.Context(), req.IDs, req.Status)
	response.Success(c, result)
}

func (s *Server) batchDeleteQuestions(c *gin.Context) {
	req, ok := bindJSON[batchIDsRequest](c)
	if !ok {
		return
	}
	if len(normalizeBatchIDs(req.IDs)) == 0 {
		response.BadRequest(c, "ids are required")
		return
	}
	result := s.library.BatchDeleteQuestions(c.Request.Context(), req.IDs)
	response.Success(c, result)
}

func (s *Server) addTestCase(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	req, ok := bindJSON[saveTestCaseRequest](c)
	if !ok {
		return
	}
	tc, err := s.library.AddTestCase(c.Request.Context(), id, req.command())
	if err != nil {
		writeError(c, err)
		return
	}
	response.Created(c, toTestCaseResponse(*tc, true))
}

func (s *Server) listTestCases(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	items, err := s.library.ListTestCases(c.Request.Context(), id, true)
	if err != nil {
		writeError(c, err)
		return
	}
	resp := make([]testCaseResponse, 0, len(items))
	for _, item := range items {
		resp = append(resp, toTestCaseResponse(item, true))
	}
	response.Success(c, resp)
}

func (s *Server) listPapers(c *gin.Context) {
	pageNum, pageSize := pageQuery(c)
	items, total, err := s.library.ListPapers(c.Request.Context(), library.PaperFilter{
		Keyword:  c.Query("keyword"),
		Status:   c.Query("status"),
		PageNum:  pageNum,
		PageSize: pageSize,
	})
	if err != nil {
		writeError(c, err)
		return
	}
	response.PageSuccessWith(c, items, total, pageNum, pageSize, toPaperResponse)
}

func (s *Server) getPaper(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	p, err := s.library.GetPaper(c.Request.Context(), id)
	if err != nil {
		writeError(c, err)
		return
	}
	response.Success(c, toPaperResponse(*p))
}

func (s *Server) createPaper(c *gin.Context) {
	req, ok := bindJSON[savePaperRequest](c)
	if !ok {
		return
	}
	p, err := s.library.CreatePaper(c.Request.Context(), req.command(currentUserID(c)))
	if err != nil {
		writeError(c, err)
		return
	}
	response.Created(c, toPaperResponse(*p))
}

func (s *Server) updatePaper(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	req, ok := bindJSON[savePaperRequest](c)
	if !ok {
		return
	}
	p, err := s.library.UpdatePaper(c.Request.Context(), id, req.command(currentUserID(c)))
	if err != nil {
		writeError(c, err)
		return
	}
	response.Success(c, toPaperResponse(*p))
}

func (s *Server) deletePaper(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	if err := s.library.DeletePaper(c.Request.Context(), id); err != nil {
		writeError(c, err)
		return
	}
	response.NoContent(c)
}

func (s *Server) batchDeletePapers(c *gin.Context) {
	req, ok := bindJSON[batchIDsRequest](c)
	if !ok {
		return
	}
	if len(normalizeBatchIDs(req.IDs)) == 0 {
		response.BadRequest(c, "ids are required")
		return
	}
	result := s.library.BatchDeletePapers(c.Request.Context(), req.IDs)
	response.Success(c, result)
}

func (s *Server) getPaperOutline(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	outline, err := s.library.GetPaperOutline(c.Request.Context(), id)
	if err != nil {
		writeError(c, err)
		return
	}
	response.Success(c, toPaperOutlineResponse(outline))
}

func (s *Server) savePaperOutline(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	req, ok := bindJSON[savePaperOutlineRequest](c)
	if !ok {
		return
	}
	outline, err := s.library.SavePaperOutline(c.Request.Context(), id, req.command())
	if err != nil {
		writeError(c, err)
		return
	}
	response.Success(c, toPaperOutlineResponse(outline))
}

func (s *Server) addPaperQuestion(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	req, ok := bindJSON[addPaperQuestionRequest](c)
	if !ok {
		return
	}
	pq, err := s.library.AddPaperQuestion(c.Request.Context(), id, req.command())
	if err != nil {
		writeError(c, err)
		return
	}
	response.Created(c, toPaperQuestionResponse(*pq))
}

func (s *Server) listPaperQuestions(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	items, err := s.library.ListPaperQuestions(c.Request.Context(), id)
	if err != nil {
		writeError(c, err)
		return
	}
	resp := make([]paperQuestionListResponse, 0, len(items))
	for _, item := range items {
		resp = append(resp, toPaperQuestionListResponse(item))
	}
	response.Success(c, resp)
}

func (s *Server) updatePaperQuestion(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	questionID, ok := parseUintParam(c, "question_id")
	if !ok {
		return
	}
	req, ok := bindJSON[updatePaperQuestionRequest](c)
	if !ok {
		return
	}
	pq, err := s.library.UpdatePaperQuestion(c.Request.Context(), id, questionID, req.command())
	if err != nil {
		writeError(c, err)
		return
	}
	response.Success(c, toPaperQuestionListResponse(*pq))
}

func (s *Server) removePaperQuestion(c *gin.Context) {
	id, ok := parseUintParam(c, "id")
	if !ok {
		return
	}
	questionID, ok := parseUintParam(c, "question_id")
	if !ok {
		return
	}
	if err := s.library.RemovePaperQuestion(c.Request.Context(), id, questionID); err != nil {
		writeError(c, err)
		return
	}
	response.NoContent(c)
}
