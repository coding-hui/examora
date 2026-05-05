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

func TestListQuestionsFilters(t *testing.T) {
	service, _ := newLibraryService(t)
	ctx := context.Background()

	_, err := service.CreateQuestion(ctx, library.SaveQuestionCommand{
		Type:       library.QuestionTypeSingleChoice,
		Title:      "Go basics",
		Content:    map[string]any{"text": "Which keyword starts a goroutine?"},
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
		Content: map[string]any{"text": "first"},
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

func TestDeleteQuestionRejectsReferencedQuestion(t *testing.T) {
	service, store := newLibraryService(t)
	ctx := context.Background()

	question, err := service.CreateQuestion(ctx, library.SaveQuestionCommand{
		Type:    library.QuestionTypeTrueFalse,
		Title:   "Go is compiled",
		Content: map[string]any{"text": "Go is a compiled language."},
		Answer:  map[string]any{"correct": true},
		Status:  library.QuestionStatusDraft,
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
