package exam_test

import (
	"context"
	"path/filepath"
	"strconv"
	"testing"
	"time"

	"github.com/stretchr/testify/require"

	"github.com/coding-hui/examora/internal/exam"
	examstore "github.com/coding-hui/examora/internal/exam/store"
	"github.com/coding-hui/examora/internal/infra/database"
	"github.com/coding-hui/examora/internal/infra/transaction"
	"github.com/coding-hui/examora/internal/library"
	librarystore "github.com/coding-hui/examora/internal/library/store"
)

type examFixture struct {
	exams     *exam.Service
	examStore *examstore.Store
	library   *library.Service
}

func newExamFixture(t *testing.T) *examFixture {
	t.Helper()

	db, err := database.Open(filepath.Join(t.TempDir(), "examora-test.db"))
	require.NoError(t, err)
	require.NoError(t, database.AutoMigrate(db))

	libraryStore := librarystore.New(db)
	libraryService, err := library.ProvideService(libraryStore, transaction.NewManager(db))
	require.NoError(t, err)

	examStore := examstore.New(db)
	examService, err := exam.ProvideService(examStore, libraryStore, nil, db)
	require.NoError(t, err)

	return &examFixture{
		exams:     examService,
		examStore: examStore,
		library:   libraryService,
	}
}

func strPtr(value string) *string {
	return &value
}

func publishableExam(t *testing.T, fx *examFixture) *exam.Exam {
	t.Helper()
	ctx := context.Background()

	choice, err := fx.library.CreateQuestion(ctx, library.SaveQuestionCommand{
		Type:    library.QuestionTypeSingleChoice,
		Title:   "Original choice",
		Content: map[string]any{"text": "Pick A", "options": []any{"A", "B"}},
		Answer:  map[string]any{"choice": "A"},
		Status:  library.QuestionStatusDraft,
	})
	require.NoError(t, err)

	programming, err := fx.library.CreateQuestion(ctx, library.SaveQuestionCommand{
		Type:     library.QuestionTypeProgramming,
		Title:    "Original programming",
		Content:  map[string]any{"text": "Print hello"},
		Language: strPtr("GO"),
		Status:   library.QuestionStatusDraft,
		Answer:   map[string]any{},
		TestCases: []library.TestCase{
			{Input: "", ExpectedOutput: "hello", IsSample: true, SortOrder: 1},
			{Input: "hidden", ExpectedOutput: "secret", IsHidden: true, SortOrder: 2},
		},
	})
	require.NoError(t, err)

	paper, err := fx.library.CreatePaper(ctx, library.SavePaperCommand{
		Title:  "M1 paper",
		Status: library.PaperStatusDraft,
	})
	require.NoError(t, err)
	_, err = fx.library.AddPaperQuestion(ctx, paper.ID, library.AddPaperQuestionCommand{
		QuestionID: choice.ID,
		Score:      10,
		SortOrder:  1,
	})
	require.NoError(t, err)
	_, err = fx.library.AddPaperQuestion(ctx, paper.ID, library.AddPaperQuestionCommand{
		QuestionID: programming.ID,
		Score:      20,
		SortOrder:  2,
	})
	require.NoError(t, err)

	created, err := fx.exams.CreateExam(ctx, exam.SaveExamCommand{
		Title:           "M1 exam",
		Description:     "snapshot flow",
		PaperID:         &paper.ID,
		Status:          exam.StatusDraft,
		DurationMinutes: 60,
	})
	require.NoError(t, err)
	return created
}

func TestPublishSnapshotFreezesSourceQuestionData(t *testing.T) {
	fx := newExamFixture(t)
	ctx := context.Background()
	created := publishableExam(t, fx)

	start := time.Now().Add(-time.Minute)
	end := time.Now().Add(time.Hour)
	snapshot, err := fx.exams.PublishExamWithSnapshot(ctx, created.ID, start, end, 60)
	require.NoError(t, err)

	snaps, err := fx.examStore.ListQuestionSnapshots(ctx, snapshot.ID)
	require.NoError(t, err)
	require.Len(t, snaps, 2)
	require.Equal(t, "Original choice", snaps[0].Title)
	require.Equal(t, map[string]any{"choice": "A"}, snaps[0].Answer)

	_, err = fx.library.UpdateQuestion(ctx, snaps[0].QuestionID, library.SaveQuestionCommand{
		Type:    library.QuestionTypeSingleChoice,
		Title:   "Changed after publish",
		Content: map[string]any{"text": "Pick B"},
		Answer:  map[string]any{"choice": "B"},
		Status:  library.QuestionStatusPublished,
	})
	require.NoError(t, err)

	snaps, err = fx.examStore.ListQuestionSnapshots(ctx, snapshot.ID)
	require.NoError(t, err)
	require.Equal(t, "Original choice", snaps[0].Title)
	require.Equal(t, map[string]any{"choice": "A"}, snaps[0].Answer)
}

func TestCandidatePaperIsSafeAndUsesExamTitle(t *testing.T) {
	fx := newExamFixture(t)
	ctx := context.Background()
	created := publishableExam(t, fx)

	start := time.Now().Add(-time.Minute)
	end := time.Now().Add(time.Hour)
	_, err := fx.exams.PublishExamWithSnapshot(ctx, created.ID, start, end, 60)
	require.NoError(t, err)

	_, err = fx.exams.StartExamSession(ctx, created.ID, 42, "127.0.0.1", "device-1")
	require.NoError(t, err)

	paper, err := fx.exams.GetCandidatePaper(ctx, created.ID, 42)
	require.NoError(t, err)
	require.Equal(t, "M1 exam", paper.Title)
	require.Len(t, paper.Questions, 2)

	choice := paper.Questions[0]
	require.Equal(t, "Original choice", choice.Title)
	require.Empty(t, choice.SampleTestCases)

	programming := paper.Questions[1]
	require.Equal(t, "Original programming", programming.Title)
	require.Len(t, programming.SampleTestCases, 1)
	require.Equal(t, "", programming.SampleTestCases[0].Input)
	require.Equal(t, "hello", programming.SampleTestCases[0].ExpectedOutput)
}

func TestSaveAnswersRequiresInProgressSessionAndKnownSnapshotQuestion(t *testing.T) {
	fx := newExamFixture(t)
	ctx := context.Background()
	created := publishableExam(t, fx)

	start := time.Now().Add(-time.Minute)
	end := time.Now().Add(time.Hour)
	snapshot, err := fx.exams.PublishExamWithSnapshot(ctx, created.ID, start, end, 60)
	require.NoError(t, err)

	_, err = fx.exams.StartExamSession(ctx, created.ID, 42, "127.0.0.1", "device-1")
	require.NoError(t, err)
	snaps, err := fx.examStore.ListQuestionSnapshots(ctx, snapshot.ID)
	require.NoError(t, err)

	err = fx.exams.SaveAnswers(ctx, created.ID, 42, map[string]map[string]any{
		"999999": {"choice": "A"},
	})
	require.ErrorIs(t, err, exam.ErrForbidden)

	err = fx.exams.SaveAnswers(ctx, created.ID, 42, map[string]map[string]any{
		"not-a-number":                      {"choice": "ignored"},
		strconv.FormatUint(snaps[0].ID, 10): {"choice": "A"},
	})
	require.NoError(t, err)
}

func TestSubmitExamIsIdempotent(t *testing.T) {
	fx := newExamFixture(t)
	ctx := context.Background()
	created := publishableExam(t, fx)

	start := time.Now().Add(-time.Minute)
	end := time.Now().Add(time.Hour)
	_, err := fx.exams.PublishExamWithSnapshot(ctx, created.ID, start, end, 60)
	require.NoError(t, err)
	_, err = fx.exams.StartExamSession(ctx, created.ID, 42, "127.0.0.1", "device-1")
	require.NoError(t, err)

	require.NoError(t, fx.exams.SubmitExam(ctx, created.ID, 42))
	require.NoError(t, fx.exams.SubmitExam(ctx, created.ID, 42))

	session, err := fx.exams.GetCurrentSession(ctx, created.ID, 42)
	require.NoError(t, err)
	require.Equal(t, exam.SessionStatusSubmitted, session.Status)
	require.NotNil(t, session.SubmittedAt)
	require.NotNil(t, session.RemainingSeconds)
	require.Zero(t, *session.RemainingSeconds)
}

func TestPublishRejectsInvalidTimeWindow(t *testing.T) {
	fx := newExamFixture(t)
	ctx := context.Background()
	created := publishableExam(t, fx)

	start := time.Now()
	err := func() error {
		_, err := fx.exams.PublishExamWithSnapshot(ctx, created.ID, start, start, 60)
		return err
	}()
	require.ErrorIs(t, err, exam.ErrInvalidExamWindow)
}
