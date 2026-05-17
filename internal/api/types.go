package api

import (
	"time"

	"github.com/coding-hui/examora/internal/exam"
	"github.com/coding-hui/examora/internal/judge"
	"github.com/coding-hui/examora/internal/library"
)

// region Auth
// endregion

// region Library and Exam

type saveQuestionRequest struct {
	Type          string                `json:"type"`
	Title         string                `json:"title"`
	Content       map[string]any        `json:"content"`
	Answer        map[string]any        `json:"answer"`
	Difficulty    *string               `json:"difficulty"`
	Language      *string               `json:"language"`
	StarterCode   *string               `json:"starter_code"`
	TimeLimitMS   int                   `json:"time_limit_ms"`
	MemoryLimitMB int                   `json:"memory_limit_mb"`
	Status        string                `json:"status"`
	TestCases     []saveTestCaseRequest `json:"test_cases"`
}

type patchQuestionRequest struct {
	Status string `json:"status"`
}

type batchIDsRequest struct {
	IDs []uint64 `json:"ids"`
}

type saveUserGroupRequest struct {
	ParentID    *uint64 `json:"parent_id"`
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Status      string  `json:"status"`
}

func (r saveUserGroupRequest) command(createdBy uint64) exam.SaveUserGroupCommand {
	return exam.SaveUserGroupCommand{
		ParentID:    r.ParentID,
		Name:        r.Name,
		Description: r.Description,
		Status:      r.Status,
		CreatedBy:   createdBy,
	}
}

type assignExamTargetsRequest struct {
	UserIDs      []uint64 `json:"user_ids"`
	UserGroupIDs []uint64 `json:"user_group_ids"`
}

func (r assignExamTargetsRequest) command(createdBy uint64) exam.AssignExamTargetsCommand {
	return exam.AssignExamTargetsCommand{
		UserIDs:      r.UserIDs,
		UserGroupIDs: r.UserGroupIDs,
		CreatedBy:    createdBy,
	}
}

type batchQuestionStatusRequest struct {
	IDs    []uint64 `json:"ids"`
	Status string   `json:"status"`
}

type saveTestCaseRequest struct {
	ID             uint64 `json:"id"`
	Input          string `json:"input"`
	ExpectedOutput string `json:"expected_output"`
	TimeLimitMS    int    `json:"time_limit_ms"`
	MemoryLimitMB  int    `json:"memory_limit_mb"`
	IsSample       bool   `json:"is_sample"`
	IsHidden       bool   `json:"is_hidden"`
	SortOrder      int    `json:"sort_order"`
}

type questionResponse struct {
	ID            uint64             `json:"id"`
	Type          string             `json:"type"`
	Title         string             `json:"title"`
	Content       map[string]any     `json:"content"`
	Answer        map[string]any     `json:"answer,omitempty"`
	Difficulty    *string            `json:"difficulty,omitempty"`
	Language      *string            `json:"language,omitempty"`
	StarterCode   *string            `json:"starter_code,omitempty"`
	TimeLimitMS   int                `json:"time_limit_ms"`
	MemoryLimitMB int                `json:"memory_limit_mb"`
	Status        string             `json:"status"`
	TestCases     []testCaseResponse `json:"test_cases,omitempty"`
	CreatedBy     uint64             `json:"created_by"`
	CreatedAt     time.Time          `json:"created_at"`
	UpdatedAt     time.Time          `json:"updated_at"`
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

type updatePaperQuestionRequest struct {
	Score     float64 `json:"score"`
	SortOrder int     `json:"sort_order"`
}

type savePaperOutlineRequest struct {
	Sections []savePaperSectionRequest `json:"sections"`
}

type savePaperSectionRequest struct {
	ID          uint64                     `json:"id"`
	Title       string                     `json:"title"`
	Description string                     `json:"description"`
	SortOrder   int                        `json:"sort_order"`
	Questions   []savePaperQuestionRequest `json:"questions"`
}

type savePaperQuestionRequest struct {
	QuestionID uint64  `json:"question_id"`
	Score      float64 `json:"score"`
	SortOrder  int     `json:"sort_order"`
}

type paperResponse struct {
	ID            uint64    `json:"id"`
	Title         string    `json:"title"`
	Description   string    `json:"description"`
	Status        string    `json:"status"`
	CreatedBy     uint64    `json:"created_by"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
	QuestionCount int       `json:"question_count"`
	TotalScore    float64   `json:"total_score"`
}

type paperQuestionResponse struct {
	ID         uint64    `json:"id"`
	PaperID    uint64    `json:"paper_id"`
	SectionID  uint64    `json:"section_id"`
	QuestionID uint64    `json:"question_id"`
	Score      float64   `json:"score"`
	SortOrder  int       `json:"sort_order"`
	CreatedAt  time.Time `json:"created_at"`
}

type paperQuestionListResponse struct {
	ID         uint64    `json:"id"`
	PaperID    uint64    `json:"paper_id"`
	SectionID  uint64    `json:"section_id"`
	QuestionID uint64    `json:"question_id"`
	Score      float64   `json:"score"`
	SortOrder  int       `json:"sort_order"`
	CreatedAt  time.Time `json:"created_at"`
	Title      string    `json:"title"`
	Type       string    `json:"type"`
	Difficulty *string   `json:"difficulty,omitempty"`
	Status     string    `json:"status"`
}

type paperOutlineResponse struct {
	Paper         paperResponse          `json:"paper"`
	Sections      []paperSectionResponse `json:"sections"`
	QuestionCount int                    `json:"question_count"`
	TotalScore    float64                `json:"total_score"`
}

type paperSectionResponse struct {
	ID            uint64                      `json:"id"`
	PaperID       uint64                      `json:"paper_id"`
	Title         string                      `json:"title"`
	Description   string                      `json:"description"`
	SortOrder     int                         `json:"sort_order"`
	QuestionCount int                         `json:"question_count"`
	TotalScore    float64                     `json:"total_score"`
	CreatedAt     time.Time                   `json:"created_at"`
	UpdatedAt     time.Time                   `json:"updated_at"`
	Questions     []paperQuestionListResponse `json:"questions"`
}

type saveExamRequest struct {
	Title           string  `json:"title"`
	Description     string  `json:"description"`
	PaperID         *uint64 `json:"paper_id"`
	Status          string  `json:"status"`
	DurationMinutes int     `json:"duration_minutes"`
}

type publishExamRequest struct {
	StartTime       time.Time `json:"start_time" binding:"required"`
	EndTime         time.Time `json:"end_time" binding:"required"`
	DurationMinutes int       `json:"duration_minutes" binding:"required,min=1"`
}

type startSessionRequest struct {
	DeviceID *string `json:"device_id"`
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

type examDetailResponse struct {
	examResponse
	ExamSnapshotID        *uint64    `json:"exam_snapshot_id"`
	PublishedAt           *time.Time `json:"published_at"`
	SnapshotQuestionCount int        `json:"snapshot_question_count"`
	SnapshotTotalScore    float64    `json:"snapshot_total_score"`
	CandidateCount        int64      `json:"candidate_count"`
	SubmittedCount        int64      `json:"submitted_count"`
	ResultCount           int64      `json:"result_count"`
	AuditEventCount       int64      `json:"audit_event_count"`
}

type examSnapshotResponse struct {
	ID              uint64    `json:"id"`
	ExamID          uint64    `json:"exam_id"`
	PaperSnapshotID uint64    `json:"paper_snapshot_id"`
	StartTime       time.Time `json:"start_time"`
	EndTime         time.Time `json:"end_time"`
	DurationMinutes int       `json:"duration_minutes"`
	PublishedAt     time.Time `json:"published_at"`
}

type userGroupResponse struct {
	ID               uint64              `json:"id"`
	ParentID         *uint64             `json:"parent_id,omitempty"`
	Name             string              `json:"name"`
	Description      string              `json:"description"`
	Status           string              `json:"status"`
	Source           string              `json:"source"`
	ExternalProvider *string             `json:"external_provider,omitempty"`
	ExternalID       *string             `json:"external_id,omitempty"`
	ExternalParentID *string             `json:"external_parent_id,omitempty"`
	SyncMode         string              `json:"sync_mode"`
	LastSyncedAt     *time.Time          `json:"last_synced_at,omitempty"`
	CreatedBy        uint64              `json:"created_by"`
	CreatedAt        time.Time           `json:"created_at"`
	UpdatedAt        time.Time           `json:"updated_at"`
	MemberCount      int                 `json:"member_count,omitempty"`
	ChildCount       int                 `json:"child_count,omitempty"`
	Children         []userGroupResponse `json:"children,omitempty"`
}

type userGroupMemberResponse struct {
	User        userResponse `json:"user"`
	UserGroupID uint64       `json:"user_group_id"`
	Direct      bool         `json:"direct"`
	Source      string       `json:"source"`
	CreatedAt   time.Time    `json:"created_at"`
}

type examAssignmentResponse struct {
	ID             uint64    `json:"id"`
	ExamID         uint64    `json:"exam_id"`
	ExamSnapshotID uint64    `json:"exam_snapshot_id"`
	TargetType     string    `json:"target_type"`
	TargetID       uint64    `json:"target_id"`
	CreatedBy      uint64    `json:"created_by"`
	CreatedAt      time.Time `json:"created_at"`
}

type candidatePaperResponse struct {
	ExamSnapshotID   uint64                          `json:"exam_snapshot_id"`
	Title            string                          `json:"title"`
	StartTime        time.Time                       `json:"start_time"`
	EndTime          time.Time                       `json:"end_time"`
	DurationMinutes  int                             `json:"duration_minutes"`
	RemainingSeconds int                             `json:"remaining_seconds"`
	Sections         []candidatePaperSectionResponse `json:"sections,omitempty"`
	Questions        []candidateQuestionResponse     `json:"questions"`
}

type candidatePaperSectionResponse struct {
	SnapshotID    uint64                      `json:"snapshot_id"`
	Title         string                      `json:"title"`
	Description   string                      `json:"description"`
	SortOrder     int                         `json:"sort_order"`
	QuestionCount int                         `json:"question_count"`
	TotalScore    float64                     `json:"total_score"`
	Questions     []candidateQuestionResponse `json:"questions"`
}

type candidateQuestionResponse struct {
	SnapshotID      uint64                   `json:"snapshot_id"`
	QuestionID      uint64                   `json:"question_id"`
	Type            string                   `json:"type"`
	Title           string                   `json:"title"`
	Content         map[string]any           `json:"content"`
	Score           float64                  `json:"score"`
	SortOrder       int                      `json:"sort_order"`
	SampleTestCases []sampleTestCaseResponse `json:"sample_test_cases,omitempty"`
	StarterCode     *string                  `json:"starter_code,omitempty"`
	TimeLimitMs     int                      `json:"time_limit_ms"`
}

type sampleTestCaseResponse struct {
	Input          string `json:"input"`
	ExpectedOutput string `json:"expected_output"`
}

type examSessionResponse struct {
	ID               uint64     `json:"id"`
	ExamSnapshotID   uint64     `json:"exam_snapshot_id"`
	UserID           uint64     `json:"user_id"`
	Status           string     `json:"status"`
	StartedAt        *time.Time `json:"started_at,omitempty"`
	SubmittedAt      *time.Time `json:"submitted_at,omitempty"`
	RemainingSeconds *int       `json:"remaining_seconds,omitempty"`
}

type saveAnswersRequest struct {
	Answers map[string]map[string]any `json:"answers"`
}

type createSubmissionRequest struct {
	ExamID     uint64         `json:"exam_id"`
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

type examResultResponse struct {
	ID             uint64                      `json:"id"`
	ExamID         uint64                      `json:"exam_id"`
	ExamSnapshotID uint64                      `json:"exam_snapshot_id"`
	ExamSessionID  uint64                      `json:"exam_session_id"`
	UserID         uint64                      `json:"user_id"`
	Status         string                      `json:"status"`
	Score          float64                     `json:"score"`
	MaxScore       float64                     `json:"max_score"`
	SubmittedAt    time.Time                   `json:"submitted_at"`
	GradedAt       *time.Time                  `json:"graded_at,omitempty"`
	Sections       []examResultSectionResponse `json:"sections,omitempty"`
	Questions      []questionResultResponse    `json:"questions,omitempty"`
}

type examResultSectionResponse struct {
	SectionSnapshotID uint64                   `json:"section_snapshot_id"`
	Title             string                   `json:"title"`
	Description       string                   `json:"description,omitempty"`
	SortOrder         int                      `json:"sort_order"`
	Score             float64                  `json:"score"`
	MaxScore          float64                  `json:"max_score"`
	QuestionCount     int                      `json:"question_count"`
	Questions         []questionResultResponse `json:"questions,omitempty"`
}

type questionResultResponse struct {
	ID                 uint64         `json:"id"`
	SectionSnapshotID  uint64         `json:"section_snapshot_id"`
	QuestionSnapshotID uint64         `json:"question_snapshot_id"`
	QuestionID         uint64         `json:"question_id"`
	Type               string         `json:"type"`
	SortOrder          int            `json:"sort_order"`
	QuestionSortOrder  int            `json:"question_sort_order"`
	Answer             map[string]any `json:"answer,omitempty"`
	Status             string         `json:"status"`
	Score              float64        `json:"score"`
	MaxScore           float64        `json:"max_score"`
	Result             map[string]any `json:"result,omitempty"`
	SubmissionID       *uint64        `json:"submission_id,omitempty"`
	JudgedAt           *time.Time     `json:"judged_at,omitempty"`
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
	tcs := make([]library.TestCase, 0, len(r.TestCases))
	for _, tc := range r.TestCases {
		tcs = append(tcs, library.TestCase{
			ID:             tc.ID,
			Input:          tc.Input,
			ExpectedOutput: tc.ExpectedOutput,
			TimeLimitMS:    tc.TimeLimitMS,
			MemoryLimitMB:  tc.MemoryLimitMB,
			IsSample:       tc.IsSample,
			IsHidden:       tc.IsHidden,
			SortOrder:      tc.SortOrder,
		})
	}
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
		TestCases:     tcs,
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

func (r updatePaperQuestionRequest) command() library.UpdatePaperQuestionCommand {
	return library.UpdatePaperQuestionCommand{Score: r.Score, SortOrder: r.SortOrder}
}

func (r savePaperOutlineRequest) command() library.SavePaperOutlineCommand {
	sections := make([]library.SavePaperSectionCommand, 0, len(r.Sections))
	for _, section := range r.Sections {
		questions := make([]library.SavePaperSectionQuestionCommand, 0, len(section.Questions))
		for _, question := range section.Questions {
			questions = append(questions, library.SavePaperSectionQuestionCommand{
				QuestionID: question.QuestionID,
				Score:      question.Score,
				SortOrder:  question.SortOrder,
			})
		}
		sections = append(sections, library.SavePaperSectionCommand{
			ID:          section.ID,
			Title:       section.Title,
			Description: section.Description,
			SortOrder:   section.SortOrder,
			Questions:   questions,
		})
	}
	return library.SavePaperOutlineCommand{Sections: sections}
}

func (r saveExamRequest) command(createdBy uint64) exam.SaveExamCommand {
	return exam.SaveExamCommand{Title: r.Title, Description: r.Description, PaperID: r.PaperID, Status: r.Status, DurationMinutes: r.DurationMinutes, CreatedBy: createdBy}
}

func (r createSubmissionRequest) command() exam.CreateSubmissionCommand {
	return exam.CreateSubmissionCommand{ExamID: r.ExamID, QuestionID: r.QuestionID, Answer: r.Answer, Code: r.Code, Language: r.Language}
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

func toQuestionResponse(q library.Question, includeAnswer bool) questionResponse {
	resp := questionResponse{ID: q.ID, Type: q.Type, Title: q.Title, Content: q.Content, Difficulty: q.Difficulty, Language: q.Language, StarterCode: q.StarterCode, TimeLimitMS: q.TimeLimitMS, MemoryLimitMB: q.MemoryLimitMB, Status: q.Status, CreatedBy: q.CreatedBy, CreatedAt: q.CreatedAt, UpdatedAt: q.UpdatedAt}
	if includeAnswer {
		resp.Answer = q.Answer
	}
	return resp
}

func toQuestionResponseWithTestCases(q library.Question, tcs []library.TestCase, includeAnswer bool) questionResponse {
	resp := toQuestionResponse(q, includeAnswer)
	resp.TestCases = make([]testCaseResponse, 0, len(tcs))
	for _, tc := range tcs {
		resp.TestCases = append(resp.TestCases, toTestCaseResponse(tc, includeAnswer))
	}
	return resp
}

func toQuestionAdminResponse(q library.Question) questionResponse {
	return toQuestionResponse(q, false)
}

func toTestCaseResponse(tc library.TestCase, includeExpected bool) testCaseResponse {
	resp := testCaseResponse{ID: tc.ID, QuestionID: tc.QuestionID, Input: tc.Input, TimeLimitMS: tc.TimeLimitMS, MemoryLimitMB: tc.MemoryLimitMB, IsSample: tc.IsSample, IsHidden: tc.IsHidden, SortOrder: tc.SortOrder, CreatedAt: tc.CreatedAt}
	if includeExpected {
		resp.ExpectedOutput = tc.ExpectedOutput
	}
	return resp
}

func toPaperResponse(p library.Paper) paperResponse {
	return paperResponse{ID: p.ID, Title: p.Title, Description: p.Description, Status: p.Status, CreatedBy: p.CreatedBy, CreatedAt: p.CreatedAt, UpdatedAt: p.UpdatedAt, QuestionCount: p.QuestionCount, TotalScore: p.TotalScore}
}

func toPaperQuestionResponse(pq library.PaperQuestion) paperQuestionResponse {
	return paperQuestionResponse{ID: pq.ID, PaperID: pq.PaperID, SectionID: pq.SectionID, QuestionID: pq.QuestionID, Score: pq.Score, SortOrder: pq.SortOrder, CreatedAt: pq.CreatedAt}
}

func toPaperQuestionListResponse(pq library.PaperQuestionWithQuestion) paperQuestionListResponse {
	return paperQuestionListResponse{
		ID:         pq.ID,
		PaperID:    pq.PaperID,
		SectionID:  pq.SectionID,
		QuestionID: pq.QuestionID,
		Score:      pq.Score,
		SortOrder:  pq.SortOrder,
		CreatedAt:  pq.CreatedAt,
		Title:      pq.QuestionTitle,
		Type:       pq.QuestionType,
		Difficulty: pq.QuestionDifficulty,
		Status:     pq.QuestionStatus,
	}
}

func toPaperOutlineResponse(outline *library.PaperOutline) paperOutlineResponse {
	sections := make([]paperSectionResponse, 0, len(outline.Sections))
	for _, section := range outline.Sections {
		questions := make([]paperQuestionListResponse, 0, len(section.Questions))
		for _, question := range section.Questions {
			questions = append(questions, toPaperQuestionListResponse(question))
		}
		sections = append(sections, paperSectionResponse{
			ID:            section.ID,
			PaperID:       section.PaperID,
			Title:         section.Title,
			Description:   section.Description,
			SortOrder:     section.SortOrder,
			QuestionCount: section.QuestionCount,
			TotalScore:    section.TotalScore,
			CreatedAt:     section.CreatedAt,
			UpdatedAt:     section.UpdatedAt,
			Questions:     questions,
		})
	}
	return paperOutlineResponse{
		Paper:         toPaperResponse(outline.Paper),
		Sections:      sections,
		QuestionCount: outline.QuestionCount,
		TotalScore:    outline.TotalScore,
	}
}

func toExamResponse(e exam.Exam) examResponse {
	return examResponse{ID: e.ID, Title: e.Title, Description: e.Description, PaperID: e.PaperID, Status: e.Status, StartTime: e.StartTime, EndTime: e.EndTime, DurationMinutes: e.DurationMinutes, CreatedBy: e.CreatedBy, CreatedAt: e.CreatedAt, UpdatedAt: e.UpdatedAt}
}

func toExamDetailResponse(e exam.ExamDetail) examDetailResponse {
	return examDetailResponse{
		examResponse:          toExamResponse(e.Exam),
		ExamSnapshotID:        e.ExamSnapshotID,
		PublishedAt:           e.PublishedAt,
		SnapshotQuestionCount: e.SnapshotQuestionCount,
		SnapshotTotalScore:    e.SnapshotTotalScore,
		CandidateCount:        e.CandidateCount,
		SubmittedCount:        e.SubmittedCount,
		ResultCount:           e.ResultCount,
		AuditEventCount:       e.AuditEventCount,
	}
}

func toSubmissionResponse(s exam.Submission) submissionResponse {
	return submissionResponse{ID: s.ID, ExamID: s.ExamID, UserID: s.UserID, QuestionID: s.QuestionID, Answer: s.Answer, Code: s.Code, Language: s.Language, Status: s.Status, Score: s.Score, Result: s.Result, SubmittedAt: s.SubmittedAt, JudgedAt: s.JudgedAt}
}

func toExamResultResponse(r exam.ExamResult, includeSensitive bool) examResultResponse {
	questions := make([]questionResultResponse, 0, len(r.Questions))
	for _, q := range r.Questions {
		item := toQuestionResultResponse(q, includeSensitive)
		questions = append(questions, item)
	}
	sections := make([]examResultSectionResponse, 0, len(r.Sections))
	for _, section := range r.Sections {
		sectionQuestions := make([]questionResultResponse, 0, len(section.Questions))
		for _, q := range section.Questions {
			sectionQuestions = append(sectionQuestions, toQuestionResultResponse(q, includeSensitive))
		}
		sections = append(sections, examResultSectionResponse{
			SectionSnapshotID: section.SectionSnapshotID,
			Title:             section.Title,
			Description:       section.Description,
			SortOrder:         section.SortOrder,
			Score:             section.Score,
			MaxScore:          section.MaxScore,
			QuestionCount:     section.QuestionCount,
			Questions:         sectionQuestions,
		})
	}
	return examResultResponse{ID: r.ID, ExamID: r.ExamID, ExamSnapshotID: r.ExamSnapshotID, ExamSessionID: r.ExamSessionID, UserID: r.UserID, Status: r.Status, Score: r.Score, MaxScore: r.MaxScore, SubmittedAt: r.SubmittedAt, GradedAt: r.GradedAt, Sections: sections, Questions: questions}
}

func toQuestionResultResponse(q exam.QuestionResult, includeSensitive bool) questionResultResponse {
	item := questionResultResponse{ID: q.ID, SectionSnapshotID: q.SectionSnapshotID, QuestionSnapshotID: q.QuestionSnapshotID, QuestionID: q.QuestionID, Type: q.Type, SortOrder: q.SortOrder, QuestionSortOrder: q.QuestionSortOrder, Status: q.Status, Score: q.Score, MaxScore: q.MaxScore, JudgedAt: q.JudgedAt}
	if includeSensitive {
		item.Answer = q.Answer
		item.Result = q.Result
		item.SubmissionID = q.SubmissionID
	}
	return item
}

func toClientEventResponse(ev exam.ClientEvent) clientEventResponse {
	return clientEventResponse{ID: ev.ID, ExamID: ev.ExamID, UserID: ev.UserID, DeviceID: ev.DeviceID, EventType: ev.EventType, Payload: ev.Payload, CreatedAt: ev.CreatedAt}
}

func toJudgeTaskResponse(task judge.Task) judgeTaskResponse {
	return judgeTaskResponse{ID: task.ID, SubmissionID: task.SubmissionID, QuestionID: task.QuestionID, UserID: task.UserID, Language: task.Language, Status: task.Status, RetryCount: task.RetryCount, MaxRetryCount: task.MaxRetryCount, ErrorMessage: task.ErrorMessage, ResultSummary: task.ResultSummary, CreatedAt: task.CreatedAt, UpdatedAt: task.UpdatedAt, StartedAt: task.StartedAt, FinishedAt: task.FinishedAt}
}

func toExamSnapshotResponse(s exam.ExamSnapshot) examSnapshotResponse {
	return examSnapshotResponse{
		ID:              s.ID,
		ExamID:          s.ExamID,
		PaperSnapshotID: s.PaperSnapshotID,
		StartTime:       s.StartTime,
		EndTime:         s.EndTime,
		DurationMinutes: s.DurationMinutes,
		PublishedAt:     s.PublishedAt,
	}
}

func toCandidatePaperResponse(p *exam.CandidatePaper) candidatePaperResponse {
	questions := make([]candidateQuestionResponse, 0, len(p.Questions))
	for _, q := range p.Questions {
		questions = append(questions, toCandidateQuestionResponse(q))
	}
	sections := make([]candidatePaperSectionResponse, 0, len(p.Sections))
	for _, section := range p.Sections {
		sectionQuestions := make([]candidateQuestionResponse, 0, len(section.Questions))
		for _, q := range section.Questions {
			sectionQuestions = append(sectionQuestions, toCandidateQuestionResponse(q))
		}
		sections = append(sections, candidatePaperSectionResponse{
			SnapshotID:    section.SnapshotID,
			Title:         section.Title,
			Description:   section.Description,
			SortOrder:     section.SortOrder,
			QuestionCount: section.QuestionCount,
			TotalScore:    section.TotalScore,
			Questions:     sectionQuestions,
		})
	}
	return candidatePaperResponse{
		ExamSnapshotID:   p.ExamSnapshotID,
		Title:            p.Title,
		StartTime:        p.StartTime,
		EndTime:          p.EndTime,
		DurationMinutes:  p.DurationMinutes,
		RemainingSeconds: p.RemainingSeconds,
		Sections:         sections,
		Questions:        questions,
	}
}

func toCandidateQuestionResponse(q exam.CandidateQuestion) candidateQuestionResponse {
	sampleCases := make([]sampleTestCaseResponse, 0, len(q.SampleTestCases))
	for _, sc := range q.SampleTestCases {
		sampleCases = append(sampleCases, sampleTestCaseResponse{
			Input:          sc.Input,
			ExpectedOutput: sc.ExpectedOutput,
		})
	}
	return candidateQuestionResponse{
		SnapshotID:      q.SnapshotID,
		QuestionID:      q.QuestionID,
		Type:            q.Type,
		Title:           q.Title,
		Content:         q.Content,
		Score:           q.Score,
		SortOrder:       q.SortOrder,
		SampleTestCases: sampleCases,
		StarterCode:     q.StarterCode,
		TimeLimitMs:     q.TimeLimitMs,
	}
}

func toExamSessionResponse(session exam.ExamSession) examSessionResponse {
	return examSessionResponse{
		ID:               session.ID,
		ExamSnapshotID:   session.ExamSnapshotID,
		UserID:           session.UserID,
		Status:           session.Status,
		StartedAt:        session.StartedAt,
		SubmittedAt:      session.SubmittedAt,
		RemainingSeconds: session.RemainingSeconds,
	}
}

func toUserGroupResponse(group exam.UserGroup) userGroupResponse {
	return userGroupResponse{
		ID:               group.ID,
		ParentID:         group.ParentID,
		Name:             group.Name,
		Description:      group.Description,
		Status:           group.Status,
		Source:           group.Source,
		ExternalProvider: group.ExternalProvider,
		ExternalID:       group.ExternalID,
		ExternalParentID: group.ExternalParentID,
		SyncMode:         group.SyncMode,
		LastSyncedAt:     group.LastSyncedAt,
		CreatedBy:        group.CreatedBy,
		CreatedAt:        group.CreatedAt,
		UpdatedAt:        group.UpdatedAt,
	}
}

func toUserGroupTreeResponse(node exam.UserGroupTreeNode) userGroupResponse {
	item := toUserGroupResponse(node.UserGroup)
	item.Children = make([]userGroupResponse, 0, len(node.Children))
	for _, child := range node.Children {
		item.Children = append(item.Children, toUserGroupTreeResponse(child))
	}
	return item
}

func userGroupTreeToResponses(tree []exam.UserGroupTreeNode) []userGroupResponse {
	items := make([]userGroupResponse, 0, len(tree))
	for _, node := range tree {
		items = append(items, toUserGroupTreeResponse(node))
	}
	return items
}

func toExamAssignmentResponse(assignment exam.ExamAssignment) examAssignmentResponse {
	return examAssignmentResponse{
		ID:             assignment.ID,
		ExamID:         assignment.ExamID,
		ExamSnapshotID: assignment.ExamSnapshotID,
		TargetType:     assignment.TargetType,
		TargetID:       assignment.TargetID,
		CreatedBy:      assignment.CreatedBy,
		CreatedAt:      assignment.CreatedAt,
	}
}

func examAssignmentsToResponses(assignments []exam.ExamAssignment) []examAssignmentResponse {
	items := make([]examAssignmentResponse, 0, len(assignments))
	for _, assignment := range assignments {
		items = append(items, toExamAssignmentResponse(assignment))
	}
	return items
}

// endregion
