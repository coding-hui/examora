package library_test

import (
	"context"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/coding-hui/examora/internal/infra/database"
	"github.com/coding-hui/examora/internal/infra/transaction"
	"github.com/coding-hui/examora/internal/library"
	librarystore "github.com/coding-hui/examora/internal/library/store"
)

func newLibraryService(t *testing.T) (*library.Service, *librarystore.Store) {
	t.Helper()
	db, err := database.Open(filepath.Join(t.TempDir(), "examora-test.db"))
	require.NoError(t, err)
	require.NoError(t, database.AutoMigrate(db))

	store := librarystore.New(db)
	service, err := library.ProvideService(store, transaction.NewManager(db))
	require.NoError(t, err)
	return service, store
}

func stringPtr(value string) *string {
	return &value
}

func choiceContent(text string) map[string]any {
	return map[string]any{
		"text": text,
		"options": []any{
			map[string]any{"key": "A", "text": "A"},
			map[string]any{"key": "B", "text": "B"},
		},
	}
}

func TestListQuestionsFilters(t *testing.T) {
	service, _ := newLibraryService(t)
	ctx := context.Background()

	_, err := service.CreateQuestion(ctx, library.SaveQuestionCommand{
		Type:       library.QuestionTypeSingleChoice,
		Title:      "Go basics",
		Content:    choiceContent("Which keyword starts a goroutine?"),
		Answer:     map[string]any{"choice": "A"},
		Difficulty: stringPtr("EASY"),
		Status:     library.QuestionStatusDraft,
	})
	require.NoError(t, err)

	_, err = service.CreateQuestion(ctx, library.SaveQuestionCommand{
		Type:       library.QuestionTypeShortAnswer,
		Title:      "HTTP lifecycle",
		Content:    map[string]any{"text": "Describe request handling."},
		Answer:     map[string]any{"reference": "router, handler, response"},
		Difficulty: stringPtr("MEDIUM"),
		Status:     library.QuestionStatusPublished,
	})
	require.NoError(t, err)

	items, total, err := service.ListQuestions(ctx, library.QuestionFilter{
		Keyword:    "go",
		Type:       library.QuestionTypeSingleChoice,
		Difficulty: "EASY",
		Status:     library.QuestionStatusDraft,
		PageNum:    1,
		PageSize:   20,
	})
	require.NoError(t, err)
	require.EqualValues(t, 1, total)
	require.Len(t, items, 1)
	require.Equal(t, "Go basics", items[0].Title)
}

func TestListQuestionsDefaultSortIsStableLatestFirst(t *testing.T) {
	service, _ := newLibraryService(t)
	ctx := context.Background()

	first, err := service.CreateQuestion(ctx, library.SaveQuestionCommand{
		Type:    library.QuestionTypeSingleChoice,
		Title:   "First question",
		Content: choiceContent("first"),
		Answer:  map[string]any{"choice": "A"},
		Status:  library.QuestionStatusDraft,
	})
	require.NoError(t, err)

	second, err := service.CreateQuestion(ctx, library.SaveQuestionCommand{
		Type:    library.QuestionTypeShortAnswer,
		Title:   "Second question",
		Content: map[string]any{"text": "second"},
		Answer:  map[string]any{"reference": "second"},
		Status:  library.QuestionStatusDraft,
	})
	require.NoError(t, err)

	items, total, err := service.ListQuestions(ctx, library.QuestionFilter{PageNum: 1, PageSize: 20})
	require.NoError(t, err)
	require.EqualValues(t, 2, total)
	require.Len(t, items, 2)
	require.Equal(t, second.ID, items[0].ID)
	require.Equal(t, first.ID, items[1].ID)
}

func TestProgrammingQuestionReplacesTestCases(t *testing.T) {
	service, _ := newLibraryService(t)
	ctx := context.Background()

	question, err := service.CreateQuestion(ctx, library.SaveQuestionCommand{
		Type:        library.QuestionTypeProgramming,
		Title:       "Sum two numbers",
		Content:     map[string]any{"text": "Read two ints and print their sum."},
		Language:    stringPtr("GO"),
		Status:      library.QuestionStatusDraft,
		TimeLimitMS: 1000,
		TestCases: []library.TestCase{
			{Input: "1 2", ExpectedOutput: "3", IsSample: true},
			{Input: "3 4", ExpectedOutput: "7", IsHidden: true},
		},
	})
	require.NoError(t, err)

	cases, err := service.ListTestCases(ctx, question.ID, true)
	require.NoError(t, err)
	require.Len(t, cases, 2)

	_, err = service.UpdateQuestion(ctx, question.ID, library.SaveQuestionCommand{
		Type:        library.QuestionTypeProgramming,
		Title:       "Sum two integers",
		Content:     map[string]any{"text": "Read two ints and print their sum."},
		Language:    stringPtr("GO"),
		Status:      library.QuestionStatusPublished,
		TimeLimitMS: 1500,
		TestCases: []library.TestCase{
			{Input: "5 8", ExpectedOutput: "13", IsSample: true},
		},
	})
	require.NoError(t, err)

	cases, err = service.ListTestCases(ctx, question.ID, true)
	require.NoError(t, err)
	require.Len(t, cases, 1)
	require.Equal(t, "5 8", cases[0].Input)
	require.Equal(t, "13", cases[0].ExpectedOutput)
}

func TestCreateQuestionValidatesStructuredQuestionPayloads(t *testing.T) {
	service, _ := newLibraryService(t)
	ctx := context.Background()

	tests := []struct {
		name string
		cmd  library.SaveQuestionCommand
	}{
		{
			name: "single choice answer must reference option key",
			cmd: library.SaveQuestionCommand{
				Type:    library.QuestionTypeSingleChoice,
				Title:   "Single",
				Content: choiceContent("Pick one"),
				Answer:  map[string]any{"choice": "C"},
			},
		},
		{
			name: "multiple choice answers are required",
			cmd: library.SaveQuestionCommand{
				Type:    library.QuestionTypeMultipleChoice,
				Title:   "Multiple",
				Content: choiceContent("Pick many"),
				Answer:  map[string]any{"choices": []any{}},
			},
		},
		{
			name: "true false answer must be boolean",
			cmd: library.SaveQuestionCommand{
				Type:    library.QuestionTypeTrueFalse,
				Title:   "True false",
				Content: map[string]any{"text": "Go is compiled"},
				Answer:  map[string]any{"correct": "true"},
			},
		},
		{
			name: "fill blank answers are required",
			cmd: library.SaveQuestionCommand{
				Type:    library.QuestionTypeFillBlank,
				Title:   "Blank",
				Content: map[string]any{"text": "Go was created at ____."},
				Answer:  map[string]any{"blanks": []any{""}},
			},
		},
		{
			name: "short answer reference is required",
			cmd: library.SaveQuestionCommand{
				Type:    library.QuestionTypeShortAnswer,
				Title:   "Short",
				Content: map[string]any{"text": "Describe HTTP."},
				Answer:  map[string]any{"reference": " "},
			},
		},
		{
			name: "programming requires test case expected output",
			cmd: library.SaveQuestionCommand{
				Type:     library.QuestionTypeProgramming,
				Title:    "Code",
				Content:  map[string]any{"text": "Print hello"},
				Language: stringPtr("GO"),
				TestCases: []library.TestCase{
					{Input: "", ExpectedOutput: ""},
				},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := service.CreateQuestion(ctx, tt.cmd)
			require.ErrorIs(t, err, library.ErrInvalidQuestion)
		})
	}
}

func TestPatchQuestionStatusPublishedValidatesExistingQuestionCompleteness(t *testing.T) {
	service, store := newLibraryService(t)
	ctx := context.Background()

	question := &library.Question{
		Type:          library.QuestionTypeProgramming,
		Title:         "Incomplete programming",
		Content:       map[string]any{"text": "Print hello"},
		Language:      stringPtr("GO"),
		TimeLimitMS:   2000,
		MemoryLimitMB: 256,
		Status:        library.QuestionStatusDraft,
	}
	require.NoError(t, store.CreateQuestion(ctx, question))

	_, err := service.PatchQuestionStatus(ctx, question.ID, library.QuestionStatusPublished)
	require.ErrorIs(t, err, library.ErrInvalidQuestion)

	_, err = service.AddTestCase(ctx, question.ID, library.SaveTestCaseCommand{
		Input:          "",
		ExpectedOutput: "hello",
	})
	require.NoError(t, err)

	published, err := service.PatchQuestionStatus(ctx, question.ID, library.QuestionStatusPublished)
	require.NoError(t, err)
	require.Equal(t, library.QuestionStatusPublished, published.Status)
}

func TestAddPaperQuestionValidatesPublishedQuestionScoreAndDuplicates(t *testing.T) {
	service, _ := newLibraryService(t)
	ctx := context.Background()

	paper, err := service.CreatePaper(ctx, library.SavePaperCommand{
		Title:  "Backend paper",
		Status: library.PaperStatusDraft,
	})
	require.NoError(t, err)
	draft, err := service.CreateQuestion(ctx, library.SaveQuestionCommand{
		Type:    library.QuestionTypeTrueFalse,
		Title:   "Draft question",
		Content: map[string]any{"text": "Go is compiled."},
		Answer:  map[string]any{"correct": true},
		Status:  library.QuestionStatusDraft,
	})
	require.NoError(t, err)

	_, err = service.AddPaperQuestion(ctx, paper.ID, library.AddPaperQuestionCommand{
		QuestionID: draft.ID,
		Score:      10,
	})
	require.ErrorIs(t, err, library.ErrInvalidPaper)

	published, err := service.CreateQuestion(ctx, library.SaveQuestionCommand{
		Type:    library.QuestionTypeTrueFalse,
		Title:   "Published question",
		Content: map[string]any{"text": "Go is compiled."},
		Answer:  map[string]any{"correct": true},
		Status:  library.QuestionStatusPublished,
	})
	require.NoError(t, err)

	_, err = service.AddPaperQuestion(ctx, paper.ID, library.AddPaperQuestionCommand{
		QuestionID: published.ID,
		Score:      0,
	})
	require.ErrorIs(t, err, library.ErrInvalidPaper)

	_, err = service.AddPaperQuestion(ctx, paper.ID, library.AddPaperQuestionCommand{
		QuestionID: published.ID,
		Score:      10,
	})
	require.NoError(t, err)

	_, err = service.AddPaperQuestion(ctx, paper.ID, library.AddPaperQuestionCommand{
		QuestionID: published.ID,
		Score:      20,
	})
	require.ErrorIs(t, err, library.ErrPaperQuestionExists)
}

func TestStoreAddPaperQuestionMapsUniqueConstraintToConflict(t *testing.T) {
	service, store := newLibraryService(t)
	ctx := context.Background()

	paper, err := service.CreatePaper(ctx, library.SavePaperCommand{
		Title:  "Backend paper",
		Status: library.PaperStatusDraft,
	})
	require.NoError(t, err)
	question, err := service.CreateQuestion(ctx, library.SaveQuestionCommand{
		Type:    library.QuestionTypeTrueFalse,
		Title:   "Published question",
		Content: map[string]any{"text": "Go is compiled."},
		Answer:  map[string]any{"correct": true},
		Status:  library.QuestionStatusPublished,
	})
	require.NoError(t, err)

	err = store.AddPaperQuestion(ctx, &library.PaperQuestion{
		PaperID:    paper.ID,
		QuestionID: question.ID,
		Score:      10,
	})
	require.NoError(t, err)
	err = store.AddPaperQuestion(ctx, &library.PaperQuestion{
		PaperID:    paper.ID,
		QuestionID: question.ID,
		Score:      20,
	})
	require.ErrorIs(t, err, library.ErrPaperQuestionExists)
}

func TestDeleteQuestionRejectsReferencedQuestion(t *testing.T) {
	service, store := newLibraryService(t)
	ctx := context.Background()

	question, err := service.CreateQuestion(ctx, library.SaveQuestionCommand{
		Type:    library.QuestionTypeTrueFalse,
		Title:   "Go is compiled",
		Content: map[string]any{"text": "Go is a compiled language."},
		Answer:  map[string]any{"correct": true},
		Status:  library.QuestionStatusPublished,
	})
	require.NoError(t, err)

	paper, err := service.CreatePaper(ctx, library.SavePaperCommand{
		Title:  "Backend paper",
		Status: library.PaperStatusDraft,
	})
	require.NoError(t, err)
	_, err = service.AddPaperQuestion(ctx, paper.ID, library.AddPaperQuestionCommand{
		QuestionID: question.ID,
		Score:      10,
	})
	require.NoError(t, err)

	err = service.DeleteQuestion(ctx, question.ID)
	require.ErrorIs(t, err, library.ErrQuestionReferenced)

	exists, err := store.QuestionExists(ctx, question.ID)
	require.NoError(t, err)
	require.True(t, exists)
}
