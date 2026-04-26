package library

import (
	"context"
	"time"

	"github.com/coding-hui/examora/internal/page"
)

const (
	QuestionTypeSingleChoice   = "SINGLE_CHOICE"
	QuestionTypeMultipleChoice = "MULTIPLE_CHOICE"
	QuestionTypeTrueFalse      = "TRUE_FALSE"
	QuestionTypeFillBlank      = "FILL_BLANK"
	QuestionTypeShortAnswer    = "SHORT_ANSWER"
	QuestionTypeProgramming    = "PROGRAMMING"
	QuestionStatusDraft        = "DRAFT"
	QuestionStatusPublished    = "PUBLISHED"
)

type Question struct {
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

type TestCase struct {
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

type SaveQuestionCommand struct {
	Type          string
	Title         string
	Content       map[string]any
	Answer        map[string]any
	Difficulty    *string
	Language      *string
	StarterCode   *string
	TimeLimitMS   int
	MemoryLimitMB int
	Status        string
	CreatedBy     uint64
}

type SaveTestCaseCommand struct {
	Input          string
	ExpectedOutput string
	TimeLimitMS    int
	MemoryLimitMB  int
	IsSample       bool
	IsHidden       bool
	SortOrder      int
}

func (s *Service) ListQuestions(ctx context.Context, q page.Query) (page.Result[Question], error) {
	items, total, err := s.store.ListQuestions(ctx, q.Normalize())
	if err != nil {
		return page.Result[Question]{}, err
	}
	q = q.Normalize()
	return page.Result[Question]{Items: items, Total: total, Page: q.Page, PageSize: q.PageSize}, nil
}

func (s *Service) GetQuestion(ctx context.Context, id uint64) (*Question, error) {
	return s.store.GetQuestion(ctx, id)
}

func (s *Service) CreateQuestion(ctx context.Context, cmd SaveQuestionCommand) (*Question, error) {
	q := fromQuestionCommand(cmd)
	if q.Status == "" {
		q.Status = QuestionStatusDraft
	}
	if q.TimeLimitMS == 0 {
		q.TimeLimitMS = 2000
	}
	if q.MemoryLimitMB == 0 {
		q.MemoryLimitMB = 256
	}
	if err := s.store.CreateQuestion(ctx, q); err != nil {
		return nil, err
	}
	return q, nil
}

func (s *Service) UpdateQuestion(ctx context.Context, id uint64, cmd SaveQuestionCommand) (*Question, error) {
	q := fromQuestionCommand(cmd)
	q.ID = id
	if err := s.store.UpdateQuestion(ctx, q); err != nil {
		return nil, err
	}
	return q, nil
}

func (s *Service) DeleteQuestion(ctx context.Context, id uint64) error {
	return s.store.DeleteQuestion(ctx, id)
}

func (s *Service) AddTestCase(ctx context.Context, questionID uint64, cmd SaveTestCaseCommand) (*TestCase, error) {
	tc := &TestCase{
		QuestionID:     questionID,
		Input:          cmd.Input,
		ExpectedOutput: cmd.ExpectedOutput,
		TimeLimitMS:    cmd.TimeLimitMS,
		MemoryLimitMB:  cmd.MemoryLimitMB,
		IsSample:       cmd.IsSample,
		IsHidden:       cmd.IsHidden,
		SortOrder:      cmd.SortOrder,
	}
	if tc.TimeLimitMS == 0 {
		tc.TimeLimitMS = 2000
	}
	if tc.MemoryLimitMB == 0 {
		tc.MemoryLimitMB = 256
	}
	if err := s.store.AddTestCase(ctx, tc); err != nil {
		return nil, err
	}
	return tc, nil
}

func (s *Service) ListTestCases(ctx context.Context, questionID uint64, includeHidden bool) ([]TestCase, error) {
	return s.store.ListTestCases(ctx, questionID, includeHidden)
}

func fromQuestionCommand(cmd SaveQuestionCommand) *Question {
	return &Question{
		Type:          cmd.Type,
		Title:         cmd.Title,
		Content:       cmd.Content,
		Answer:        cmd.Answer,
		Difficulty:    cmd.Difficulty,
		Language:      cmd.Language,
		StarterCode:   cmd.StarterCode,
		TimeLimitMS:   cmd.TimeLimitMS,
		MemoryLimitMB: cmd.MemoryLimitMB,
		Status:        cmd.Status,
		CreatedBy:     cmd.CreatedBy,
	}
}
