package api

import (
	"time"

	"github.com/coding-hui/examora/internal/exam"
	"github.com/coding-hui/examora/internal/judge"
	"github.com/coding-hui/examora/internal/library"
	"github.com/coding-hui/examora/internal/page"
)

// region Auth
// endregion

// region Library and Exam

type saveQuestionRequest struct {
	Type          string         `json:"type"`
	Title         string         `json:"title"`
	Content       map[string]any `json:"content"`
	Answer        map[string]any `json:"answer"`
	Difficulty    *string        `json:"difficulty"`
	Language      *string        `json:"language"`
	StarterCode   *string        `json:"starter_code"`
	TimeLimitMS   int            `json:"time_limit_ms"`
	MemoryLimitMB int            `json:"memory_limit_mb"`
	Status        string         `json:"status"`
}

type saveTestCaseRequest struct {
	Input          string `json:"input"`
	ExpectedOutput string `json:"expected_output"`
	TimeLimitMS    int    `json:"time_limit_ms"`
	MemoryLimitMB  int    `json:"memory_limit_mb"`
	IsSample       bool   `json:"is_sample"`
	IsHidden       bool   `json:"is_hidden"`
	SortOrder      int    `json:"sort_order"`
}

type questionResponse struct {
	ID            uint64         `json:"id"`
	Type          string         `json:"type"`
	Title         string         `json:"title"`
	Content       map[string]any `json:"content"`
	Answer        map[string]any `json:"answer,omitempty"`
	Difficulty    *string        `json:"difficulty,omitempty"`
	Language      *string        `json:"language,omitempty"`
	StarterCode   *string        `json:"starter_code,omitempty"`
	TimeLimitMS   int            `json:"time_limit_ms"`
	MemoryLimitMB int            `json:"memory_limit_mb"`
	Status        string         `json:"status"`
	CreatedBy     uint64         `json:"created_by"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
}

type testCaseResponse struct {
	ID             uint64    `json:"id"`
	QuestionID     uint64    `json:"question_id"`
	Input          string    `json:"input"`
	ExpectedOutput string    `json:"expected_output,omitempty"`
	TimeLimitMS    int       `json:"time_limit_ms"`
	MemoryLimitMB  int       `json:"memory_limit_mb"`
	IsSample       bool      `json:"is_sample"`
	IsHidden       bool      `json:"is_hidden"`
	SortOrder      int       `json:"sort_order"`
	CreatedAt      time.Time `json:"created_at"`
}

type savePaperRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Status      string `json:"status"`
}

type addPaperQuestionRequest struct {
	QuestionID uint64  `json:"question_id"`
	Score      float64 `json:"score"`
	SortOrder  int     `json:"sort_order"`
}

type paperResponse struct {
	ID          uint64    `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Status      string    `json:"status"`
	CreatedBy   uint64    `json:"created_by"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type paperQuestionResponse struct {
	ID         uint64    `json:"id"`
	PaperID    uint64    `json:"paper_id"`
	QuestionID uint64    `json:"question_id"`
	Score      float64   `json:"score"`
	SortOrder  int       `json:"sort_order"`
	CreatedAt  time.Time `json:"created_at"`
}

type saveExamRequest struct {
	Title           string  `json:"title"`
	Description     string  `json:"description"`
	PaperID         *uint64 `json:"paper_id"`
	Status          string  `json:"status"`
	DurationMinutes int     `json:"duration_minutes"`
}

type examResponse struct {
	ID              uint64     `json:"id"`
	Title           string     `json:"title"`
	Description     string     `json:"description"`
	PaperID         *uint64    `json:"paper_id"`
	Status          string     `json:"status"`
	StartTime       *time.Time `json:"start_time"`
	EndTime         *time.Time `json:"end_time"`
	DurationMinutes int        `json:"duration_minutes"`
	CreatedBy       uint64     `json:"created_by"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

type createSubmissionRequest struct {
	QuestionID uint64         `json:"question_id"`
	Answer     map[string]any `json:"answer"`
	Code       string         `json:"code"`
	Language   string         `json:"language"`
}

type createdSubmissionResponse struct {
	Submission submissionResponse `json:"submission"`
}

type submissionResponse struct {
	ID          uint64         `json:"id"`
	ExamID      uint64         `json:"exam_id"`
	UserID      uint64         `json:"user_id"`
	QuestionID  uint64         `json:"question_id"`
	Answer      map[string]any `json:"answer,omitempty"`
	Code        string         `json:"code,omitempty"`
	Language    string         `json:"language,omitempty"`
	Status      string         `json:"status"`
	Score       float64        `json:"score"`
	Result      map[string]any `json:"result,omitempty"`
	SubmittedAt time.Time      `json:"submitted_at"`
	JudgedAt    *time.Time     `json:"judged_at"`
}

type recordEventRequest struct {
	ExamID    uint64         `json:"exam_id"`
	DeviceID  *string        `json:"device_id"`
	EventType string         `json:"event_type"`
	Payload   map[string]any `json:"payload"`
}

type clientEventResponse struct {
	ID        uint64         `json:"id"`
	ExamID    uint64         `json:"exam_id"`
	UserID    uint64         `json:"user_id"`
	DeviceID  *string        `json:"device_id"`
	EventType string         `json:"event_type"`
	Payload   map[string]any `json:"payload"`
	CreatedAt time.Time      `json:"created_at"`
}

// endregion

// region Judge

type judgeTaskResponse struct {
	ID            uint64         `json:"id"`
	SubmissionID  uint64         `json:"submission_id"`
	QuestionID    uint64         `json:"question_id"`
	UserID        uint64         `json:"user_id"`
	Language      string         `json:"language"`
	Status        string         `json:"status"`
	RetryCount    int            `json:"retry_count"`
	MaxRetryCount int            `json:"max_retry_count"`
	ErrorMessage  *string        `json:"error_message,omitempty"`
	ResultSummary map[string]any `json:"result_summary,omitempty"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	StartedAt     *time.Time     `json:"started_at,omitempty"`
	FinishedAt    *time.Time     `json:"finished_at,omitempty"`
}

// endregion

// region Command converters

func (r saveQuestionRequest) command(createdBy uint64) library.SaveQuestionCommand {
	return library.SaveQuestionCommand{
		Type:          r.Type,
		Title:         r.Title,
		Content:       r.Content,
		Answer:        r.Answer,
		Difficulty:    r.Difficulty,
		Language:      r.Language,
		StarterCode:   r.StarterCode,
		TimeLimitMS:   r.TimeLimitMS,
		MemoryLimitMB: r.MemoryLimitMB,
		Status:        r.Status,
		CreatedBy:     createdBy,
	}
}

func (r saveTestCaseRequest) command() library.SaveTestCaseCommand {
	return library.SaveTestCaseCommand{Input: r.Input, ExpectedOutput: r.ExpectedOutput, TimeLimitMS: r.TimeLimitMS, MemoryLimitMB: r.MemoryLimitMB, IsSample: r.IsSample, IsHidden: r.IsHidden, SortOrder: r.SortOrder}
}

func (r savePaperRequest) command(createdBy uint64) library.SavePaperCommand {
	return library.SavePaperCommand{Title: r.Title, Description: r.Description, Status: r.Status, CreatedBy: createdBy}
}

func (r addPaperQuestionRequest) command() library.AddPaperQuestionCommand {
	return library.AddPaperQuestionCommand{QuestionID: r.QuestionID, Score: r.Score, SortOrder: r.SortOrder}
}

func (r saveExamRequest) command(createdBy uint64) exam.SaveExamCommand {
	return exam.SaveExamCommand{Title: r.Title, Description: r.Description, PaperID: r.PaperID, Status: r.Status, DurationMinutes: r.DurationMinutes, CreatedBy: createdBy}
}

func (r createSubmissionRequest) command() exam.CreateSubmissionCommand {
	return exam.CreateSubmissionCommand{QuestionID: r.QuestionID, Answer: r.Answer, Code: r.Code, Language: r.Language}
}

func (r recordEventRequest) command(defaultType string) exam.RecordEventCommand {
	eventType := r.EventType
	if eventType == "" {
		eventType = defaultType
	}
	return exam.RecordEventCommand{ExamID: r.ExamID, DeviceID: r.DeviceID, EventType: eventType, Payload: r.Payload}
}

// endregion

// region Response converters

func pageResponse[T any, U any](result page.Result[T], mapper func(T) U) page.Result[U] {
	items := make([]U, 0, len(result.Items))
	for _, item := range result.Items {
		items = append(items, mapper(item))
	}
	return page.Result[U]{Items: items, Total: result.Total, Page: result.Page, PageSize: result.PageSize}
}

func toQuestionResponse(q library.Question, includeAnswer bool) questionResponse {
	resp := questionResponse{ID: q.ID, Type: q.Type, Title: q.Title, Content: q.Content, Difficulty: q.Difficulty, Language: q.Language, StarterCode: q.StarterCode, TimeLimitMS: q.TimeLimitMS, MemoryLimitMB: q.MemoryLimitMB, Status: q.Status, CreatedBy: q.CreatedBy, CreatedAt: q.CreatedAt, UpdatedAt: q.UpdatedAt}
	if includeAnswer {
		resp.Answer = q.Answer
	}
	return resp
}

func toTestCaseResponse(tc library.TestCase, includeExpected bool) testCaseResponse {
	resp := testCaseResponse{ID: tc.ID, QuestionID: tc.QuestionID, Input: tc.Input, TimeLimitMS: tc.TimeLimitMS, MemoryLimitMB: tc.MemoryLimitMB, IsSample: tc.IsSample, IsHidden: tc.IsHidden, SortOrder: tc.SortOrder, CreatedAt: tc.CreatedAt}
	if includeExpected {
		resp.ExpectedOutput = tc.ExpectedOutput
	}
	return resp
}

func toPaperResponse(p library.Paper) paperResponse {
	return paperResponse{ID: p.ID, Title: p.Title, Description: p.Description, Status: p.Status, CreatedBy: p.CreatedBy, CreatedAt: p.CreatedAt, UpdatedAt: p.UpdatedAt}
}

func toPaperQuestionResponse(pq library.PaperQuestion) paperQuestionResponse {
	return paperQuestionResponse{ID: pq.ID, PaperID: pq.PaperID, QuestionID: pq.QuestionID, Score: pq.Score, SortOrder: pq.SortOrder, CreatedAt: pq.CreatedAt}
}

func toExamResponse(e exam.Exam) examResponse {
	return examResponse{ID: e.ID, Title: e.Title, Description: e.Description, PaperID: e.PaperID, Status: e.Status, StartTime: e.StartTime, EndTime: e.EndTime, DurationMinutes: e.DurationMinutes, CreatedBy: e.CreatedBy, CreatedAt: e.CreatedAt, UpdatedAt: e.UpdatedAt}
}

func toSubmissionResponse(s exam.Submission) submissionResponse {
	return submissionResponse{ID: s.ID, ExamID: s.ExamID, UserID: s.UserID, QuestionID: s.QuestionID, Answer: s.Answer, Code: s.Code, Language: s.Language, Status: s.Status, Score: s.Score, Result: s.Result, SubmittedAt: s.SubmittedAt, JudgedAt: s.JudgedAt}
}

func toClientEventResponse(ev exam.ClientEvent) clientEventResponse {
	return clientEventResponse{ID: ev.ID, ExamID: ev.ExamID, UserID: ev.UserID, DeviceID: ev.DeviceID, EventType: ev.EventType, Payload: ev.Payload, CreatedAt: ev.CreatedAt}
}

func toJudgeTaskResponse(task judge.Task) judgeTaskResponse {
	return judgeTaskResponse{ID: task.ID, SubmissionID: task.SubmissionID, QuestionID: task.QuestionID, UserID: task.UserID, Language: task.Language, Status: task.Status, RetryCount: task.RetryCount, MaxRetryCount: task.MaxRetryCount, ErrorMessage: task.ErrorMessage, ResultSummary: task.ResultSummary, CreatedAt: task.CreatedAt, UpdatedAt: task.UpdatedAt, StartedAt: task.StartedAt, FinishedAt: task.FinishedAt}
}

func toJudgeTaskPage(result page.Result[judge.Task]) page.Result[judgeTaskResponse] {
	return pageResponse(result, toJudgeTaskResponse)
}

// endregion
