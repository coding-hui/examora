package exam_test

import (
	"context"
	"encoding/json"
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
	exams        *exam.Service
	examStore    *examstore.Store
	library      *library.Service
	libraryStore *librarystore.Store
	judge        *recordingJudgeDispatcher
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
	judgeDispatcher := &recordingJudgeDispatcher{}
	examService, err := exam.ProvideService(examStore, libraryStore, judgeDispatcher, db)
	require.NoError(t, err)

	return &examFixture{
		exams:        examService,
		examStore:    examStore,
		library:      libraryService,
		libraryStore: libraryStore,
		judge:        judgeDispatcher,
	}
}

type recordedJudgeTask struct {
	SubmissionID uint64
	QuestionID   uint64
	UserID       uint64
	Language     string
}

type recordingJudgeDispatcher struct {
	tasks []recordedJudgeTask
}

func (r *recordingJudgeDispatcher) CreateAndEnqueue(_ context.Context, submissionID, questionID, userID uint64, language string) error {
	r.tasks = append(r.tasks, recordedJudgeTask{
		SubmissionID: submissionID,
		QuestionID:   questionID,
		UserID:       userID,
		Language:     language,
	})
	return nil
}

func strPtr(value string) *string {
	return &value
}

func TestBatchCloseExamsReturnsPartialFailures(t *testing.T) {
	fx := newExamFixture(t)
	ctx := context.Background()

	published, err := fx.exams.CreateExam(ctx, exam.SaveExamCommand{
		Title:  "Published exam",
		Status: exam.StatusPublished,
	})
	require.NoError(t, err)
	draft, err := fx.exams.CreateExam(ctx, exam.SaveExamCommand{
		Title:  "Draft exam",
		Status: exam.StatusDraft,
	})
	require.NoError(t, err)

	result := fx.exams.BatchCloseExams(ctx, []uint64{published.ID, draft.ID, 99999})

	require.Equal(t, 1, result.SuccessCount)
	require.Equal(t, 2, result.FailedCount)
	require.Len(t, result.Failures, 2)
	closed, err := fx.exams.GetExam(ctx, published.ID)
	require.NoError(t, err)
	require.Equal(t, exam.StatusClosed, closed.Status)
	unchanged, err := fx.exams.GetExam(ctx, draft.ID)
	require.NoError(t, err)
	require.Equal(t, exam.StatusDraft, unchanged.Status)
}

func publishableExam(t *testing.T, fx *examFixture) *exam.Exam {
	t.Helper()
	ctx := context.Background()

	choice, err := fx.library.CreateQuestion(ctx, library.SaveQuestionCommand{
		Type:  library.QuestionTypeSingleChoice,
		Title: "Original choice",
		Content: map[string]any{
			"text": "Pick A",
			"options": []any{
				map[string]any{"key": "A", "text": "A"},
				map[string]any{"key": "B", "text": "B"},
			},
		},
		Answer: map[string]any{"choice": "A"},
		Status: library.QuestionStatusPublished,
	})
	require.NoError(t, err)

	programming, err := fx.library.CreateQuestion(ctx, library.SaveQuestionCommand{
		Type:     library.QuestionTypeProgramming,
		Title:    "Original programming",
		Content:  map[string]any{"text": "Print hello"},
		Language: strPtr("GO"),
		Status:   library.QuestionStatusPublished,
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
	_, err = fx.library.UpdatePaper(ctx, paper.ID, library.SavePaperCommand{
		Title:  paper.Title,
		Status: library.PaperStatusPublished,
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

func assignCandidate(t *testing.T, fx *examFixture, examID, userID uint64) {
	t.Helper()
	result, err := fx.exams.AssignCandidates(context.Background(), examID, []uint64{userID})
	require.NoError(t, err)
	require.Equal(t, 1, result.SuccessCount)
}

func objectiveExam(t *testing.T, fx *examFixture) *exam.Exam {
	t.Helper()
	ctx := context.Background()

	questions := []struct {
		title   string
		qtype   string
		content map[string]any
		answer  map[string]any
		score   float64
	}{
		{
			title: "Single choice",
			qtype: library.QuestionTypeSingleChoice,
			content: map[string]any{
				"text": "Pick A",
				"options": []any{
					map[string]any{"key": "A", "text": "A"},
					map[string]any{"key": "B", "text": "B"},
				},
			},
			answer: map[string]any{"choice": "A"},
			score:  10,
		},
		{
			title: "Multiple choice",
			qtype: library.QuestionTypeMultipleChoice,
			content: map[string]any{
				"text": "Pick A and C",
				"options": []any{
					map[string]any{"key": "A", "text": "A"},
					map[string]any{"key": "B", "text": "B"},
					map[string]any{"key": "C", "text": "C"},
				},
			},
			answer: map[string]any{"choices": []any{"A", "C"}},
			score:  10,
		},
		{
			title:   "True false",
			qtype:   library.QuestionTypeTrueFalse,
			content: map[string]any{"text": "Examora is an exam platform."},
			answer:  map[string]any{"correct": true},
			score:   10,
		},
		{
			title:   "Fill blank",
			qtype:   library.QuestionTypeFillBlank,
			content: map[string]any{"text": "Fill two blanks."},
			answer:  map[string]any{"blanks": []any{"alpha", "beta"}},
			score:   10,
		},
	}

	paper, err := fx.library.CreatePaper(ctx, library.SavePaperCommand{
		Title:  "Objective paper",
		Status: library.PaperStatusDraft,
	})
	require.NoError(t, err)

	for index, item := range questions {
		created, err := fx.library.CreateQuestion(ctx, library.SaveQuestionCommand{
			Type:    item.qtype,
			Title:   item.title,
			Content: item.content,
			Answer:  item.answer,
			Status:  library.QuestionStatusPublished,
		})
		require.NoError(t, err)
		_, err = fx.library.AddPaperQuestion(ctx, paper.ID, library.AddPaperQuestionCommand{
			QuestionID: created.ID,
			Score:      item.score,
			SortOrder:  index + 1,
		})
		require.NoError(t, err)
	}
	_, err = fx.library.UpdatePaper(ctx, paper.ID, library.SavePaperCommand{
		Title:  paper.Title,
		Status: library.PaperStatusPublished,
	})
	require.NoError(t, err)

	created, err := fx.exams.CreateExam(ctx, exam.SaveExamCommand{
		Title:           "Objective exam",
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
		Type:  library.QuestionTypeSingleChoice,
		Title: "Changed after publish",
		Content: map[string]any{
			"text": "Pick B",
			"options": []any{
				map[string]any{"key": "A", "text": "A"},
				map[string]any{"key": "B", "text": "B"},
			},
		},
		Answer: map[string]any{"choice": "B"},
		Status: library.QuestionStatusPublished,
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

	assignCandidate(t, fx, created.ID, 42)
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

func TestPublishSnapshotFreezesPaperSections(t *testing.T) {
	fx := newExamFixture(t)
	ctx := context.Background()

	first, err := fx.library.CreateQuestion(ctx, library.SaveQuestionCommand{
		Type:    library.QuestionTypeSingleChoice,
		Title:   "Pick A",
		Content: map[string]any{"text": "Pick A", "options": []any{map[string]any{"key": "A", "text": "A"}, map[string]any{"key": "B", "text": "B"}}},
		Answer:  map[string]any{"choice": "A"},
		Status:  library.QuestionStatusPublished,
	})
	require.NoError(t, err)
	second, err := fx.library.CreateQuestion(ctx, library.SaveQuestionCommand{
		Type:    library.QuestionTypeShortAnswer,
		Title:   "Explain HTTP",
		Content: map[string]any{"text": "Explain HTTP"},
		Answer:  map[string]any{"reference": "protocol"},
		Status:  library.QuestionStatusPublished,
	})
	require.NoError(t, err)
	paper, err := fx.library.CreatePaper(ctx, library.SavePaperCommand{
		Title:  "Structured paper",
		Status: library.PaperStatusDraft,
	})
	require.NoError(t, err)
	outline, err := fx.library.SavePaperOutline(ctx, paper.ID, library.SavePaperOutlineCommand{
		Sections: []library.SavePaperSectionCommand{
			{
				Title:       "第一大题 单选题",
				Description: "每题 2 分",
				SortOrder:   1,
				Questions: []library.SavePaperSectionQuestionCommand{
					{QuestionID: first.ID, Score: 2, SortOrder: 1},
				},
			},
			{
				Title:       "第二大题 简答题",
				Description: "按要点给分",
				SortOrder:   2,
				Questions: []library.SavePaperSectionQuestionCommand{
					{QuestionID: second.ID, Score: 10, SortOrder: 1},
				},
			},
		},
	})
	require.NoError(t, err)
	_, err = fx.library.UpdatePaper(ctx, paper.ID, library.SavePaperCommand{
		Title:  paper.Title,
		Status: library.PaperStatusPublished,
	})
	require.NoError(t, err)
	created, err := fx.exams.CreateExam(ctx, exam.SaveExamCommand{
		Title:           "Structured exam",
		PaperID:         &paper.ID,
		Status:          exam.StatusDraft,
		DurationMinutes: 60,
	})
	require.NoError(t, err)

	start := time.Now().Add(-time.Minute)
	end := time.Now().Add(time.Hour)
	snapshot, err := fx.exams.PublishExamWithSnapshot(ctx, created.ID, start, end, 60)
	require.NoError(t, err)

	sections, err := fx.examStore.ListPaperSectionSnapshots(ctx, snapshot.ID)
	require.NoError(t, err)
	require.Len(t, sections, 2)
	require.Equal(t, outline.Sections[0].ID, sections[0].SourceSectionID)
	require.Equal(t, "第一大题 单选题", sections[0].Title)
	require.Equal(t, 2.0, sections[0].TotalScore)
	require.Equal(t, "第二大题 简答题", sections[1].Title)

	snaps, err := fx.examStore.ListQuestionSnapshots(ctx, snapshot.ID)
	require.NoError(t, err)
	require.Len(t, snaps, 2)
	require.Equal(t, sections[0].ID, snaps[0].SectionSnapshotID)
	require.Equal(t, 1, snaps[0].QuestionSortOrder)
	require.Equal(t, sections[1].ID, snaps[1].SectionSnapshotID)

	_, err = fx.library.SavePaperOutline(ctx, paper.ID, library.SavePaperOutlineCommand{
		Sections: []library.SavePaperSectionCommand{
			{
				ID:        outline.Sections[0].ID,
				Title:     "修改后的大题",
				SortOrder: 1,
				Questions: []library.SavePaperSectionQuestionCommand{
					{QuestionID: first.ID, Score: 99, SortOrder: 1},
				},
			},
		},
	})
	require.NoError(t, err)

	sections, err = fx.examStore.ListPaperSectionSnapshots(ctx, snapshot.ID)
	require.NoError(t, err)
	require.Equal(t, "第一大题 单选题", sections[0].Title)
	require.Equal(t, 2.0, sections[0].TotalScore)

	assignCandidate(t, fx, created.ID, 42)
	_, err = fx.exams.StartExamSession(ctx, created.ID, 42, "127.0.0.1", "device-1")
	require.NoError(t, err)
	candidatePaper, err := fx.exams.GetCandidatePaper(ctx, created.ID, 42)
	require.NoError(t, err)
	require.Len(t, candidatePaper.Sections, 2)
	require.Equal(t, "第一大题 单选题", candidatePaper.Sections[0].Title)
	require.Len(t, candidatePaper.Sections[0].Questions, 1)
	require.Equal(t, first.ID, candidatePaper.Sections[0].Questions[0].QuestionID)
	require.Equal(t, "第二大题 简答题", candidatePaper.Sections[1].Title)
}

func TestSaveAnswersRequiresInProgressSessionAndKnownSnapshotQuestion(t *testing.T) {
	fx := newExamFixture(t)
	ctx := context.Background()
	created := publishableExam(t, fx)

	start := time.Now().Add(-time.Minute)
	end := time.Now().Add(time.Hour)
	snapshot, err := fx.exams.PublishExamWithSnapshot(ctx, created.ID, start, end, 60)
	require.NoError(t, err)

	assignCandidate(t, fx, created.ID, 42)
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
	assignCandidate(t, fx, created.ID, 42)
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

func TestSubmitExamGradesStrictObjectiveQuestions(t *testing.T) {
	fx := newExamFixture(t)
	ctx := context.Background()
	created := objectiveExam(t, fx)

	start := time.Now().Add(-time.Minute)
	end := time.Now().Add(time.Hour)
	snapshot, err := fx.exams.PublishExamWithSnapshot(ctx, created.ID, start, end, 60)
	require.NoError(t, err)
	assignCandidate(t, fx, created.ID, 42)
	session, err := fx.exams.StartExamSession(ctx, created.ID, 42, "127.0.0.1", "device-1")
	require.NoError(t, err)

	snaps, err := fx.examStore.ListQuestionSnapshots(ctx, snapshot.ID)
	require.NoError(t, err)
	require.Len(t, snaps, 4)

	require.NoError(t, fx.exams.SaveAnswers(ctx, created.ID, 42, map[string]map[string]any{
		strconv.FormatUint(snaps[0].ID, 10): {"choice": "A"},
		strconv.FormatUint(snaps[1].ID, 10): {"choices": []any{"C", "A"}},
		strconv.FormatUint(snaps[2].ID, 10): {"correct": true},
		strconv.FormatUint(snaps[3].ID, 10): {"blanks": []any{"alpha", "wrong"}},
	}))

	require.NoError(t, fx.exams.SubmitExam(ctx, created.ID, 42))

	result, err := fx.exams.GetExamResultForUser(ctx, created.ID, 42)
	require.NoError(t, err)
	require.Equal(t, session.ID, result.ExamSessionID)
	require.Equal(t, exam.ResultStatusGraded, result.Status)
	require.Equal(t, 40.0, result.MaxScore)
	require.Equal(t, 30.0, result.Score)
	require.Len(t, result.Questions, 4)
	require.Equal(t, 10.0, result.Questions[0].Score)
	require.Equal(t, 10.0, result.Questions[1].Score)
	require.Equal(t, 10.0, result.Questions[2].Score)
	require.Equal(t, 0.0, result.Questions[3].Score)
}

func TestSubmitExamCreatesProgrammingJudgeTaskFromDraft(t *testing.T) {
	fx := newExamFixture(t)
	ctx := context.Background()
	created := publishableExam(t, fx)

	start := time.Now().Add(-time.Minute)
	end := time.Now().Add(time.Hour)
	snapshot, err := fx.exams.PublishExamWithSnapshot(ctx, created.ID, start, end, 60)
	require.NoError(t, err)
	assignCandidate(t, fx, created.ID, 42)
	_, err = fx.exams.StartExamSession(ctx, created.ID, 42, "127.0.0.1", "device-1")
	require.NoError(t, err)
	snaps, err := fx.examStore.ListQuestionSnapshots(ctx, snapshot.ID)
	require.NoError(t, err)

	require.NoError(t, fx.exams.SaveAnswers(ctx, created.ID, 42, map[string]map[string]any{
		strconv.FormatUint(snaps[0].ID, 10): {"choice": "A"},
		strconv.FormatUint(snaps[1].ID, 10): {"code": "package main\nfunc main() {}", "language": "GO"},
	}))

	require.NoError(t, fx.exams.SubmitExam(ctx, created.ID, 42))
	require.NoError(t, fx.exams.SubmitExam(ctx, created.ID, 42))

	result, err := fx.exams.GetExamResultForUser(ctx, created.ID, 42)
	require.NoError(t, err)
	require.Equal(t, exam.ResultStatusJudging, result.Status)
	require.Equal(t, 30.0, result.MaxScore)
	require.Equal(t, 10.0, result.Score)
	require.Len(t, fx.judge.tasks, 1)
	require.Equal(t, snaps[1].ID, fx.judge.tasks[0].QuestionID)
	require.Equal(t, uint64(42), fx.judge.tasks[0].UserID)
	require.Equal(t, "GO", fx.judge.tasks[0].Language)
}

func TestJudgeResultUpdatesProgrammingQuestionAndExamScore(t *testing.T) {
	fx := newExamFixture(t)
	ctx := context.Background()
	created := publishableExam(t, fx)

	start := time.Now().Add(-time.Minute)
	end := time.Now().Add(time.Hour)
	snapshot, err := fx.exams.PublishExamWithSnapshot(ctx, created.ID, start, end, 60)
	require.NoError(t, err)
	assignCandidate(t, fx, created.ID, 42)
	_, err = fx.exams.StartExamSession(ctx, created.ID, 42, "127.0.0.1", "device-1")
	require.NoError(t, err)
	snaps, err := fx.examStore.ListQuestionSnapshots(ctx, snapshot.ID)
	require.NoError(t, err)

	require.NoError(t, fx.exams.SaveAnswers(ctx, created.ID, 42, map[string]map[string]any{
		strconv.FormatUint(snaps[0].ID, 10): {"choice": "A"},
		strconv.FormatUint(snaps[1].ID, 10): {"code": "package main\nfunc main() {}", "language": "GO"},
	}))
	require.NoError(t, fx.exams.SubmitExam(ctx, created.ID, 42))
	require.Len(t, fx.judge.tasks, 1)

	require.NoError(t, fx.examStore.UpdateJudgeResult(ctx, fx.judge.tasks[0].SubmissionID, "WRONG_ANSWER", 50, map[string]any{
		"total_cases":  2,
		"passed_cases": 1,
		"final_status": "WRONG_ANSWER",
	}))

	result, err := fx.exams.GetExamResultForUser(ctx, created.ID, 42)
	require.NoError(t, err)
	require.Equal(t, exam.ResultStatusGraded, result.Status)
	require.Equal(t, 20.0, result.Score)
	require.Equal(t, 30.0, result.MaxScore)
	require.Equal(t, 10.0, result.Questions[1].Score)
	require.Equal(t, "WRONG_ANSWER", result.Questions[1].Status)
	require.NotNil(t, result.GradedAt)
}

func TestJudgeTestCasesComeFromFrozenQuestionSnapshot(t *testing.T) {
	fx := newExamFixture(t)
	ctx := context.Background()
	created := publishableExam(t, fx)

	start := time.Now().Add(-time.Minute)
	end := time.Now().Add(time.Hour)
	snapshot, err := fx.exams.PublishExamWithSnapshot(ctx, created.ID, start, end, 60)
	require.NoError(t, err)
	snaps, err := fx.examStore.ListQuestionSnapshots(ctx, snapshot.ID)
	require.NoError(t, err)

	cases, err := fx.examStore.ListJudgeTestCases(ctx, snaps[1].ID)
	require.NoError(t, err)
	require.Len(t, cases, 2)
	require.Equal(t, "", cases[0].Input)
	require.Equal(t, "hello", cases[0].ExpectedOutput)
	require.Equal(t, "hidden", cases[1].Input)
	require.Equal(t, "secret", cases[1].ExpectedOutput)
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

func TestPublishRejectsExamWithoutPaper(t *testing.T) {
	fx := newExamFixture(t)
	ctx := context.Background()

	created, err := fx.exams.CreateExam(ctx, exam.SaveExamCommand{
		Title:           "No paper exam",
		Status:          exam.StatusDraft,
		DurationMinutes: 60,
	})
	require.NoError(t, err)

	_, err = fx.exams.PublishExamWithSnapshot(ctx, created.ID, time.Now(), time.Now().Add(time.Hour), 60)
	require.ErrorIs(t, err, exam.ErrInvalidExamStatusTransition)
}

func TestPublishRejectsDraftPaper(t *testing.T) {
	fx := newExamFixture(t)
	ctx := context.Background()

	question, err := fx.library.CreateQuestion(ctx, library.SaveQuestionCommand{
		Type:    library.QuestionTypeTrueFalse,
		Title:   "Go is compiled",
		Content: map[string]any{"text": "Go is compiled."},
		Answer:  map[string]any{"correct": true},
		Status:  library.QuestionStatusPublished,
	})
	require.NoError(t, err)
	paper, err := fx.library.CreatePaper(ctx, library.SavePaperCommand{
		Title:  "Draft paper",
		Status: library.PaperStatusDraft,
	})
	require.NoError(t, err)
	_, err = fx.library.AddPaperQuestion(ctx, paper.ID, library.AddPaperQuestionCommand{
		QuestionID: question.ID,
		Score:      10,
		SortOrder:  1,
	})
	require.NoError(t, err)
	created, err := fx.exams.CreateExam(ctx, exam.SaveExamCommand{
		Title:           "Draft paper exam",
		PaperID:         &paper.ID,
		Status:          exam.StatusDraft,
		DurationMinutes: 60,
	})
	require.NoError(t, err)

	_, err = fx.exams.PublishExamWithSnapshot(ctx, created.ID, time.Now(), time.Now().Add(time.Hour), 60)
	require.ErrorIs(t, err, exam.ErrInvalidExamStatusTransition)
}

func TestPublishRejectsEmptyPaper(t *testing.T) {
	fx := newExamFixture(t)
	ctx := context.Background()

	paper, err := fx.library.CreatePaper(ctx, library.SavePaperCommand{
		Title:  "Empty paper",
		Status: library.PaperStatusDraft,
	})
	require.NoError(t, err)
	created, err := fx.exams.CreateExam(ctx, exam.SaveExamCommand{
		Title:           "Empty exam",
		PaperID:         &paper.ID,
		Status:          exam.StatusDraft,
		DurationMinutes: 60,
	})
	require.NoError(t, err)

	_, err = fx.exams.PublishExamWithSnapshot(ctx, created.ID, time.Now(), time.Now().Add(time.Hour), 60)
	require.ErrorIs(t, err, exam.ErrInvalidExamStatusTransition)
}

func TestPublishRejectsInvalidPublishedQuestionShape(t *testing.T) {
	fx := newExamFixture(t)
	ctx := context.Background()

	dirty := &library.Question{
		Type:          library.QuestionTypeSingleChoice,
		Title:         "Dirty published question",
		Content:       map[string]any{"text": "Pick A"},
		Answer:        map[string]any{"choice": "A"},
		TimeLimitMS:   2000,
		MemoryLimitMB: 256,
		Status:        library.QuestionStatusPublished,
	}
	require.NoError(t, fx.libraryStore.CreateQuestion(ctx, dirty))
	paper, err := fx.library.CreatePaper(ctx, library.SavePaperCommand{
		Title:  "Dirty paper",
		Status: library.PaperStatusDraft,
	})
	require.NoError(t, err)
	_, err = fx.library.AddPaperQuestion(ctx, paper.ID, library.AddPaperQuestionCommand{
		QuestionID: dirty.ID,
		Score:      10,
	})
	require.NoError(t, err)
	_, err = fx.library.UpdatePaper(ctx, paper.ID, library.SavePaperCommand{
		Title:  paper.Title,
		Status: library.PaperStatusPublished,
	})
	require.NoError(t, err)
	created, err := fx.exams.CreateExam(ctx, exam.SaveExamCommand{
		Title:           "Dirty exam",
		PaperID:         &paper.ID,
		Status:          exam.StatusDraft,
		DurationMinutes: 60,
	})
	require.NoError(t, err)

	_, err = fx.exams.PublishExamWithSnapshot(ctx, created.ID, time.Now(), time.Now().Add(time.Hour), 60)
	require.ErrorIs(t, err, library.ErrInvalidQuestion)
}

func TestStartExamSessionRejectsClosedExam(t *testing.T) {
	fx := newExamFixture(t)
	ctx := context.Background()

	created := publishableExam(t, fx)
	start := time.Now().Add(-time.Minute)
	end := time.Now().Add(time.Hour)
	_, err := fx.exams.PublishExamWithSnapshot(ctx, created.ID, start, end, 60)
	require.NoError(t, err)

	// Close the exam
	require.NoError(t, fx.exams.CloseExam(ctx, created.ID))

	// Attempting to start a session should be rejected
	_, err = fx.exams.StartExamSession(ctx, created.ID, 42, "127.0.0.1", "device-1")
	require.ErrorIs(t, err, exam.ErrInvalidExamStatusTransition)
}

func TestAvailableExamItemUsesCandidateWireShape(t *testing.T) {
	payload, err := json.Marshal(exam.ExamSessionItem{
		ID:     1,
		Title:  "Final exam",
		Status: exam.SessionStatusNotStarted,
	})
	require.NoError(t, err)
	require.JSONEq(t, `{"id":1,"title":"Final exam","status":"NOT_STARTED"}`, string(payload))
}

func TestCandidateVisibilityRequiresAssignedSession(t *testing.T) {
	fx := newExamFixture(t)
	ctx := context.Background()

	created := publishableExam(t, fx)
	start := time.Now().Add(-time.Minute)
	end := time.Now().Add(time.Hour)
	_, err := fx.exams.PublishExamWithSnapshot(ctx, created.ID, start, end, 60)
	require.NoError(t, err)

	items, err := fx.exams.ListAvailableExams(ctx, 42)
	require.NoError(t, err)
	require.Empty(t, items)
	_, err = fx.exams.StartExamSession(ctx, created.ID, 42, "127.0.0.1", "device-1")
	require.ErrorIs(t, err, exam.ErrNotEligible)

	assigned, err := fx.exams.AssignCandidates(ctx, created.ID, []uint64{42})
	require.NoError(t, err)
	require.Equal(t, 1, assigned.SuccessCount)

	items, err = fx.exams.ListAvailableExams(ctx, 42)
	require.NoError(t, err)
	require.Len(t, items, 1)
	require.Equal(t, exam.SessionStatusNotStarted, items[0].Status)

	session, err := fx.exams.StartExamSession(ctx, created.ID, 42, "127.0.0.1", "device-1")
	require.NoError(t, err)
	require.Equal(t, exam.SessionStatusInProgress, session.Status)
	require.NotNil(t, session.StartedAt)
}

func TestListExamSessionsReturnsEmptyBeforeSnapshotExists(t *testing.T) {
	fx := newExamFixture(t)
	ctx := context.Background()

	created := publishableExam(t, fx)

	sessions, err := fx.exams.ListExamSessions(ctx, created.ID)
	require.NoError(t, err)
	require.Empty(t, sessions)
}

func TestRemoveCandidateAllowsOnlyNotStartedSession(t *testing.T) {
	fx := newExamFixture(t)
	ctx := context.Background()

	created := publishableExam(t, fx)
	start := time.Now().Add(-time.Minute)
	end := time.Now().Add(time.Hour)
	_, err := fx.exams.PublishExamWithSnapshot(ctx, created.ID, start, end, 60)
	require.NoError(t, err)
	_, err = fx.exams.AssignCandidates(ctx, created.ID, []uint64{42, 43})
	require.NoError(t, err)

	require.NoError(t, fx.exams.RemoveCandidate(ctx, created.ID, 42))
	items, err := fx.exams.ListAvailableExams(ctx, 42)
	require.NoError(t, err)
	require.Empty(t, items)

	assignCandidate(t, fx, created.ID, 43)
	_, err = fx.exams.StartExamSession(ctx, created.ID, 43, "127.0.0.1", "device-1")
	require.NoError(t, err)
	err = fx.exams.RemoveCandidate(ctx, created.ID, 43)
	require.ErrorIs(t, err, exam.ErrInvalidExamStatusTransition)
}

func TestUserGroupTreeIncludesDescendantStudents(t *testing.T) {
	fx := newExamFixture(t)
	ctx := context.Background()

	root, err := fx.exams.CreateUserGroup(ctx, exam.SaveUserGroupCommand{Name: "2026 Cohort"})
	require.NoError(t, err)
	child, err := fx.exams.CreateUserGroup(ctx, exam.SaveUserGroupCommand{Name: "Class A", ParentID: &root.ID})
	require.NoError(t, err)
	leaf, err := fx.exams.CreateUserGroup(ctx, exam.SaveUserGroupCommand{Name: "Project Team", ParentID: &child.ID})
	require.NoError(t, err)

	require.NoError(t, fx.exams.AddUserGroupMembers(ctx, child.ID, []uint64{101}))
	require.NoError(t, fx.exams.AddUserGroupMembers(ctx, leaf.ID, []uint64{102, 103}))

	rootStudents, err := fx.exams.ListUserGroupStudentIDs(ctx, root.ID, true)
	require.NoError(t, err)
	require.ElementsMatch(t, []uint64{101, 102, 103}, rootStudents)

	childStudents, err := fx.exams.ListUserGroupStudentIDs(ctx, child.ID, false)
	require.NoError(t, err)
	require.ElementsMatch(t, []uint64{101}, childStudents)
}

func TestAssignUserGroupsExpandsDescendantStudents(t *testing.T) {
	fx := newExamFixture(t)
	ctx := context.Background()

	created := publishableExam(t, fx)
	start := time.Now().Add(-time.Minute)
	end := time.Now().Add(time.Hour)
	_, err := fx.exams.PublishExamWithSnapshot(ctx, created.ID, start, end, 60)
	require.NoError(t, err)

	root, err := fx.exams.CreateUserGroup(ctx, exam.SaveUserGroupCommand{Name: "Exam Group"})
	require.NoError(t, err)
	child, err := fx.exams.CreateUserGroup(ctx, exam.SaveUserGroupCommand{Name: "Child Group", ParentID: &root.ID})
	require.NoError(t, err)
	require.NoError(t, fx.exams.AddUserGroupMembers(ctx, root.ID, []uint64{42}))
	require.NoError(t, fx.exams.AddUserGroupMembers(ctx, child.ID, []uint64{43, 42}))

	result, err := fx.exams.AssignExamTargets(ctx, created.ID, exam.AssignExamTargetsCommand{
		UserIDs:      []uint64{44},
		UserGroupIDs: []uint64{root.ID},
	})
	require.NoError(t, err)
	require.Equal(t, 3, result.SuccessCount)
	require.Equal(t, 0, result.FailedCount)

	sessions, err := fx.exams.ListExamSessions(ctx, created.ID)
	require.NoError(t, err)
	require.Len(t, sessions, 3)
	sessionUsers := make([]uint64, 0, len(sessions))
	for _, session := range sessions {
		sessionUsers = append(sessionUsers, session.UserID)
	}
	require.ElementsMatch(t, []uint64{42, 43, 44}, sessionUsers)

	assignments, err := fx.exams.ListExamAssignments(ctx, created.ID)
	require.NoError(t, err)
	require.Len(t, assignments, 2)
}

func TestStartExamSessionRejectsArchivedExam(t *testing.T) {
	fx := newExamFixture(t)
	ctx := context.Background()

	created := publishableExam(t, fx)
	start := time.Now().Add(-time.Minute)
	end := time.Now().Add(time.Hour)
	_, err := fx.exams.PublishExamWithSnapshot(ctx, created.ID, start, end, 60)
	require.NoError(t, err)

	// Manually set status to archived via UpdateExam
	_, err = fx.exams.UpdateExam(ctx, created.ID, exam.SaveExamCommand{
		Title:           created.Title,
		Status:          exam.StatusArchived,
		DurationMinutes: created.DurationMinutes,
		CreatedBy:       created.CreatedBy,
	})
	require.NoError(t, err)

	// Attempting to start a session should be rejected
	_, err = fx.exams.StartExamSession(ctx, created.ID, 42, "127.0.0.1", "device-1")
	require.ErrorIs(t, err, exam.ErrInvalidExamStatusTransition)
}

func TestClosedExamRejectsExistingSessionCandidateActions(t *testing.T) {
	fx := newExamFixture(t)
	ctx := context.Background()

	created := publishableExam(t, fx)
	start := time.Now().Add(-time.Minute)
	end := time.Now().Add(time.Hour)
	snapshot, err := fx.exams.PublishExamWithSnapshot(ctx, created.ID, start, end, 60)
	require.NoError(t, err)
	assignCandidate(t, fx, created.ID, 42)
	_, err = fx.exams.StartExamSession(ctx, created.ID, 42, "127.0.0.1", "device-1")
	require.NoError(t, err)
	snaps, err := fx.examStore.ListQuestionSnapshots(ctx, snapshot.ID)
	require.NoError(t, err)
	require.NotEmpty(t, snaps)

	require.NoError(t, fx.exams.CloseExam(ctx, created.ID))

	_, err = fx.exams.GetCandidatePaper(ctx, created.ID, 42)
	require.ErrorIs(t, err, exam.ErrInvalidExamStatusTransition)
	_, err = fx.exams.GetCurrentSession(ctx, created.ID, 42)
	require.ErrorIs(t, err, exam.ErrInvalidExamStatusTransition)
	err = fx.exams.SaveAnswers(ctx, created.ID, 42, map[string]map[string]any{
		strconv.FormatUint(snaps[0].ID, 10): {"choice": "A"},
	})
	require.ErrorIs(t, err, exam.ErrInvalidExamStatusTransition)
	err = fx.exams.SubmitExam(ctx, created.ID, 42)
	require.ErrorIs(t, err, exam.ErrInvalidExamStatusTransition)
}

func TestCreateSubmissionRequiresActiveExamSessionAndSnapshotQuestion(t *testing.T) {
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

	_, err = fx.exams.CreateSubmission(ctx, created.ID, 42, exam.CreateSubmissionCommand{
		QuestionID: snaps[1].ID,
		Code:       "package main\nfunc main() {}",
		Language:   "GO",
	})
	require.ErrorIs(t, err, exam.ErrForbidden)

	assignCandidate(t, fx, created.ID, 42)
	_, err = fx.exams.StartExamSession(ctx, created.ID, 42, "127.0.0.1", "device-1")
	require.NoError(t, err)
	_, err = fx.exams.CreateSubmission(ctx, created.ID, 42, exam.CreateSubmissionCommand{
		QuestionID: 999999,
		Code:       "package main\nfunc main() {}",
		Language:   "GO",
	})
	require.ErrorIs(t, err, exam.ErrForbidden)

	submission, err := fx.exams.CreateSubmission(ctx, created.ID, 42, exam.CreateSubmissionCommand{
		QuestionID: snaps[1].QuestionID,
		Code:       "package main\nfunc main() {}",
		Language:   "GO",
	})
	require.NoError(t, err)
	require.Equal(t, snaps[1].ID, submission.Submission.QuestionID)
	require.Len(t, fx.judge.tasks, 1)
	require.Equal(t, snaps[1].ID, fx.judge.tasks[0].QuestionID)

	require.NoError(t, fx.exams.SubmitExam(ctx, created.ID, 42))
	_, err = fx.exams.CreateSubmission(ctx, created.ID, 42, exam.CreateSubmissionCommand{
		QuestionID: snaps[1].ID,
		Code:       "package main\nfunc main() {}",
		Language:   "GO",
	})
	require.ErrorIs(t, err, exam.ErrForbidden)
}
