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

func (s *Service) PatchQuestionStatus(ctx context.Context, id uint64, status string) (*Question, error) {
	if status != QuestionStatusDraft && status != QuestionStatusPublished {
		return nil, fmt.Errorf("%w: unsupported question status", ErrInvalidQuestion)
	}
	q, err := s.store.GetQuestion(ctx, id)
	if err != nil {
		return nil, err
	}
	if status == QuestionStatusPublished {
		tcs, err := s.store.ListTestCases(ctx, id, true)
		if err != nil {
			return nil, err
		}
		if err := ValidateQuestionForPublish(q, tcs); err != nil {
			return nil, err
		}
	}
	q.Status = status
	if err := s.store.UpdateQuestion(ctx, q); err != nil {
		return nil, err
	}
	return q, nil
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

	if err := validateQuestionShape(cmd.Type, cmd.Content, cmd.Answer); err != nil {
		return err
	}
	if cmd.Type == QuestionTypeProgramming {
		if err := validateProgrammingFields(cmd.Language, cmd.TestCases); err != nil {
			return err
		}
	}
	return nil
}

func ValidateQuestionForPublish(q *Question, tcs []TestCase) error {
	if q == nil {
		return ErrQuestionNotFound
	}
	if strings.TrimSpace(q.Title) == "" {
		return fmt.Errorf("%w: title is required", ErrInvalidQuestion)
	}
	if q.TimeLimitMS < 1 {
		return fmt.Errorf("%w: time limit must be positive", ErrInvalidQuestion)
	}
	if q.MemoryLimitMB < 1 {
		return fmt.Errorf("%w: memory limit must be positive", ErrInvalidQuestion)
	}
	if err := validateQuestionShape(q.Type, q.Content, q.Answer); err != nil {
		return err
	}
	if q.Type == QuestionTypeProgramming {
		return validateProgrammingFields(q.Language, tcs)
	}
	return nil
}

func validateQuestionShape(questionType string, content, answer map[string]any) error {
	if err := validateContentText(content); err != nil {
		return err
	}
	switch questionType {
	case QuestionTypeSingleChoice:
		options, err := validateChoiceOptions(content)
		if err != nil {
			return err
		}
		choice, ok := stringValue(answer, "choice")
		if !ok || choice == "" {
			return fmt.Errorf("%w: single choice answer.choice is required", ErrInvalidQuestion)
		}
		if _, ok := options[choice]; !ok {
			return fmt.Errorf("%w: single choice answer must match an option key", ErrInvalidQuestion)
		}
	case QuestionTypeMultipleChoice:
		options, err := validateChoiceOptions(content)
		if err != nil {
			return err
		}
		choices, ok := stringSliceValue(answer, "choices")
		if !ok || len(choices) == 0 {
			return fmt.Errorf("%w: multiple choice answer.choices is required", ErrInvalidQuestion)
		}
		seen := map[string]struct{}{}
		for _, choice := range choices {
			if _, ok := options[choice]; !ok {
				return fmt.Errorf("%w: multiple choice answers must match option keys", ErrInvalidQuestion)
			}
			if _, ok := seen[choice]; ok {
				return fmt.Errorf("%w: multiple choice answers must be unique", ErrInvalidQuestion)
			}
			seen[choice] = struct{}{}
		}
	case QuestionTypeTrueFalse:
		if _, ok := boolValue(answer, "correct"); !ok {
			return fmt.Errorf("%w: true/false answer.correct is required", ErrInvalidQuestion)
		}
	case QuestionTypeFillBlank:
		blanks, ok := stringSliceValue(answer, "blanks")
		if !ok || len(blanks) == 0 {
			return fmt.Errorf("%w: fill blank answer.blanks is required", ErrInvalidQuestion)
		}
	case QuestionTypeShortAnswer:
		reference, ok := stringValue(answer, "reference")
		if !ok || reference == "" {
			return fmt.Errorf("%w: short answer answer.reference is required", ErrInvalidQuestion)
		}
	case QuestionTypeProgramming:
		return nil
	default:
		return fmt.Errorf("%w: unsupported question type", ErrInvalidQuestion)
	}
	return nil
}

func validateContentText(content map[string]any) error {
	text, ok := stringValue(content, "text")
	if !ok || text == "" {
		return fmt.Errorf("%w: content.text is required", ErrInvalidQuestion)
	}
	return nil
}

func validateChoiceOptions(content map[string]any) (map[string]struct{}, error) {
	raw, ok := content["options"]
	if !ok {
		return nil, fmt.Errorf("%w: content.options is required", ErrInvalidQuestion)
	}
	var items []any
	switch values := raw.(type) {
	case []any:
		items = values
	case []map[string]any:
		items = make([]any, 0, len(values))
		for _, value := range values {
			items = append(items, value)
		}
	case []string:
		items = make([]any, 0, len(values))
		for _, value := range values {
			items = append(items, value)
		}
	default:
		return nil, fmt.Errorf("%w: content.options must be an array", ErrInvalidQuestion)
	}
	if len(items) < 2 {
		return nil, fmt.Errorf("%w: content.options requires at least two options", ErrInvalidQuestion)
	}
	keys := make(map[string]struct{}, len(items))
	for _, item := range items {
		var key string
		var text string
		switch option := item.(type) {
		case map[string]any:
			var ok bool
			key, ok = stringValue(option, "key")
			if !ok || key == "" {
				return nil, fmt.Errorf("%w: option key is required", ErrInvalidQuestion)
			}
			text, ok = stringValue(option, "text")
			if !ok || text == "" {
				return nil, fmt.Errorf("%w: option text is required", ErrInvalidQuestion)
			}
		case string:
			key = strings.TrimSpace(option)
			text = key
		default:
			return nil, fmt.Errorf("%w: content.options items must be objects or strings", ErrInvalidQuestion)
		}
		if key == "" || text == "" {
			return nil, fmt.Errorf("%w: option key and text are required", ErrInvalidQuestion)
		}
		if _, exists := keys[key]; exists {
			return nil, fmt.Errorf("%w: option keys must be unique", ErrInvalidQuestion)
		}
		keys[key] = struct{}{}
	}
	return keys, nil
}

func validateProgrammingFields(language *string, testCases []TestCase) error {
	if language == nil || strings.TrimSpace(*language) == "" {
		return fmt.Errorf("%w: programming language is required", ErrInvalidQuestion)
	}
	if len(testCases) == 0 {
		return fmt.Errorf("%w: programming question requires at least one test case", ErrInvalidQuestion)
	}
	for i := range testCases {
		normalizeTestCase(&testCases[i], i)
		if testCases[i].TimeLimitMS < 1 {
			return fmt.Errorf("%w: test case time limit must be positive", ErrInvalidQuestion)
		}
		if testCases[i].MemoryLimitMB < 1 {
			return fmt.Errorf("%w: test case memory limit must be positive", ErrInvalidQuestion)
		}
		if strings.TrimSpace(testCases[i].ExpectedOutput) == "" {
			return fmt.Errorf("%w: test case expected output is required", ErrInvalidQuestion)
		}
	}
	return nil
}

func stringValue(values map[string]any, key string) (string, bool) {
	if values == nil {
		return "", false
	}
	value, ok := values[key].(string)
	if !ok {
		return "", false
	}
	return strings.TrimSpace(value), true
}

func stringSliceValue(values map[string]any, key string) ([]string, bool) {
	if values == nil {
		return nil, false
	}
	raw, ok := values[key]
	if !ok {
		return nil, false
	}
	switch items := raw.(type) {
	case []string:
		result := make([]string, 0, len(items))
		for _, item := range items {
			value := strings.TrimSpace(item)
			if value == "" {
				return nil, false
			}
			result = append(result, value)
		}
		return result, true
	case []any:
		result := make([]string, 0, len(items))
		for _, item := range items {
			value, ok := item.(string)
			if !ok {
				return nil, false
			}
			value = strings.TrimSpace(value)
			if value == "" {
				return nil, false
			}
			result = append(result, value)
		}
		return result, true
	default:
		return nil, false
	}
}

func boolValue(values map[string]any, key string) (bool, bool) {
	if values == nil {
		return false, false
	}
	value, ok := values[key].(bool)
	return value, ok
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
