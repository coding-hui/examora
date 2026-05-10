package library

import (
	"context"
	"fmt"
	"strings"
	"time"
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

type QuestionFilter struct {
	Keyword    string
	Type       string
	Difficulty string
	Status     string
	SortField  string
	SortOrder  string
	PageNum    int
	PageSize   int
}

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
	TestCases     []TestCase
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

func (s *Service) ListQuestions(ctx context.Context, filter QuestionFilter) ([]Question, int64, error) {
	filter.Keyword = strings.TrimSpace(filter.Keyword)
	filter.Type = strings.ToUpper(strings.TrimSpace(filter.Type))
	filter.Difficulty = strings.ToUpper(strings.TrimSpace(filter.Difficulty))
	filter.Status = strings.ToUpper(strings.TrimSpace(filter.Status))
	filter.SortField = normalizeQuestionSortField(filter.SortField)
	filter.SortOrder = normalizeSortOrder(filter.SortOrder)
	if filter.PageNum < 1 {
		filter.PageNum = 1
	}
	if filter.PageSize < 1 {
		filter.PageSize = 20
	}
	if filter.PageSize > 100 {
		filter.PageSize = 100
	}
	return s.store.ListQuestions(ctx, filter)
}

func normalizeQuestionSortField(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "updated_at":
		return strings.ToLower(strings.TrimSpace(value))
	default:
		return "updated_at"
	}
}

func normalizeSortOrder(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "asc":
		return "asc"
	default:
		return "desc"
	}
}

func (s *Service) GetQuestion(ctx context.Context, id uint64) (*Question, error) {
	return s.store.GetQuestion(ctx, id)
}

func (s *Service) CreateQuestion(ctx context.Context, cmd SaveQuestionCommand) (*Question, error) {
	if err := normalizeAndValidateQuestionCommand(&cmd); err != nil {
		return nil, err
	}
	q := fromQuestionCommand(cmd)
	var created *Question
	err := s.withTx(ctx, func(ctx context.Context) error {
		if err := s.store.CreateQuestion(ctx, q); err != nil {
			return err
		}
		created = q
		if len(cmd.TestCases) > 0 {
			if err := s.store.UpsertTestCases(ctx, q.ID, cmd.TestCases); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return created, nil
}

func (s *Service) UpdateQuestion(ctx context.Context, id uint64, cmd SaveQuestionCommand) (*Question, error) {
	if _, err := s.store.GetQuestion(ctx, id); err != nil {
		return nil, err
	}
	if err := normalizeAndValidateQuestionCommand(&cmd); err != nil {
		return nil, err
	}
	q := fromQuestionCommand(cmd)
	q.ID = id
	err := s.withTx(ctx, func(ctx context.Context) error {
		if err := s.store.UpdateQuestion(ctx, q); err != nil {
			return err
		}
		if err := s.store.DeleteTestCasesByQuestionID(ctx, id); err != nil {
			return err
		}
		if len(cmd.TestCases) > 0 {
			if err := s.store.UpsertTestCases(ctx, id, cmd.TestCases); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return s.store.GetQuestion(ctx, id)
}

func (s *Service) DeleteQuestion(ctx context.Context, id uint64) error {
	if _, err := s.store.GetQuestion(ctx, id); err != nil {
		return err
	}
	count, err := s.store.CountPaperQuestions(ctx, id)
	if err != nil {
		return err
	}
	if count > 0 {
		return ErrQuestionReferenced
	}
	return s.store.DeleteQuestion(ctx, id)
}

func (s *Service) AddTestCase(ctx context.Context, questionID uint64, cmd SaveTestCaseCommand) (*TestCase, error) {
	if _, err := s.store.GetQuestion(ctx, questionID); err != nil {
		return nil, err
	}
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
	if tc.TimeLimitMS < 1 {
		return nil, fmt.Errorf("%w: test case time limit must be positive", ErrInvalidQuestion)
	}
	if tc.MemoryLimitMB < 1 {
		return nil, fmt.Errorf("%w: test case memory limit must be positive", ErrInvalidQuestion)
	}
	if strings.TrimSpace(tc.ExpectedOutput) == "" {
		return nil, fmt.Errorf("%w: test case expected output is required", ErrInvalidQuestion)
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

func normalizeAndValidateQuestionCommand(cmd *SaveQuestionCommand) error {
	cmd.Type = strings.TrimSpace(cmd.Type)
	cmd.Title = strings.TrimSpace(cmd.Title)
	cmd.Status = strings.TrimSpace(cmd.Status)
	if cmd.Status == "" {
		cmd.Status = QuestionStatusDraft
	}
	if cmd.Content == nil {
		cmd.Content = map[string]any{}
	}
	if cmd.TimeLimitMS == 0 {
		cmd.TimeLimitMS = 2000
	}
	if cmd.MemoryLimitMB == 0 {
		cmd.MemoryLimitMB = 256
	}

	if !validQuestionType(cmd.Type) {
		return fmt.Errorf("%w: unsupported question type", ErrInvalidQuestion)
	}
	if cmd.Title == "" {
		return fmt.Errorf("%w: title is required", ErrInvalidQuestion)
	}
	if cmd.Status != QuestionStatusDraft && cmd.Status != QuestionStatusPublished {
		return fmt.Errorf("%w: unsupported question status", ErrInvalidQuestion)
	}
	if cmd.TimeLimitMS < 1 {
		return fmt.Errorf("%w: time limit must be positive", ErrInvalidQuestion)
	}
	if cmd.MemoryLimitMB < 1 {
		return fmt.Errorf("%w: memory limit must be positive", ErrInvalidQuestion)
	}

	if cmd.Type == QuestionTypeProgramming {
		if cmd.Language == nil || strings.TrimSpace(*cmd.Language) == "" {
			return fmt.Errorf("%w: programming language is required", ErrInvalidQuestion)
		}
		if len(cmd.TestCases) == 0 {
			return fmt.Errorf("%w: programming question requires at least one test case", ErrInvalidQuestion)
		}
		for i := range cmd.TestCases {
			normalizeTestCase(&cmd.TestCases[i], i)
			if cmd.TestCases[i].TimeLimitMS < 1 {
				return fmt.Errorf("%w: test case time limit must be positive", ErrInvalidQuestion)
			}
			if cmd.TestCases[i].MemoryLimitMB < 1 {
				return fmt.Errorf("%w: test case memory limit must be positive", ErrInvalidQuestion)
			}
			if strings.TrimSpace(cmd.TestCases[i].ExpectedOutput) == "" {
				return fmt.Errorf("%w: test case expected output is required", ErrInvalidQuestion)
			}
		}
		return nil
	}

	if len(cmd.Answer) == 0 {
		return fmt.Errorf("%w: answer is required", ErrInvalidQuestion)
	}
	return nil
}

func normalizeTestCase(tc *TestCase, index int) {
	if tc.TimeLimitMS == 0 {
		tc.TimeLimitMS = 2000
	}
	if tc.MemoryLimitMB == 0 {
		tc.MemoryLimitMB = 256
	}
	if tc.SortOrder == 0 {
		tc.SortOrder = index
	}
}

func validQuestionType(questionType string) bool {
	switch questionType {
	case QuestionTypeSingleChoice,
		QuestionTypeMultipleChoice,
		QuestionTypeTrueFalse,
		QuestionTypeFillBlank,
		QuestionTypeShortAnswer,
		QuestionTypeProgramming:
		return true
	default:
		return false
	}
}
