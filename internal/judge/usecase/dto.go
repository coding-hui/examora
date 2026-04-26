package usecase

type JudgeTaskPayload struct {
	JudgeTaskID  uint64 `json:"judge_task_id"`
	SubmissionID uint64 `json:"submission_id"`
	QuestionID   uint64 `json:"question_id"`
	UserID       uint64 `json:"user_id"`
	Language     string `json:"language"`
}

type SubmissionDTO struct {
	ID         uint64
	QuestionID uint64
	UserID     uint64
	Code       string
	Language   string
}

type TestCaseDTO struct {
	ID             uint64
	Input          string
	ExpectedOutput string
	TimeLimitMS    int
	MemoryLimitMB  int
}

type SandboxRunRequest struct {
	Language      string `json:"language"`
	SourceCode    string `json:"source_code"`
	Stdin         string `json:"stdin"`
	TimeLimitMS   int    `json:"time_limit_ms"`
	MemoryLimitMB int    `json:"memory_limit_mb"`
}

type SandboxRunResult struct {
	Status   string `json:"status"`
	Stdout   string `json:"stdout"`
	Stderr   string `json:"stderr"`
	ExitCode int    `json:"exit_code"`
	TimeMS   int64  `json:"time_ms"`
	MemoryKB int64  `json:"memory_kb"`
}
