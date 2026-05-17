package library

import "context"

type Store interface {
	QuestionStore
	PaperStore
	TestCaseReader
}

type QuestionStore interface {
	ListQuestions(ctx context.Context, filter QuestionFilter) ([]Question, int64, error)
	GetQuestion(ctx context.Context, id uint64) (*Question, error)
	CreateQuestion(ctx context.Context, q *Question) error
	UpdateQuestion(ctx context.Context, q *Question) error
	DeleteQuestion(ctx context.Context, id uint64) error
	QuestionExists(ctx context.Context, id uint64) (bool, error)
	CountPaperQuestions(ctx context.Context, questionID uint64) (int64, error)
	CountPublishedPaperQuestions(ctx context.Context, questionID uint64) (int64, error)
	AddTestCase(ctx context.Context, tc *TestCase) error
	ListTestCases(ctx context.Context, questionID uint64, includeHidden bool) ([]TestCase, error)
	DeleteTestCasesByQuestionID(ctx context.Context, questionID uint64) error
	UpsertTestCases(ctx context.Context, questionID uint64, tcs []TestCase) error
}

type PaperStore interface {
	PaperReader
	ListPapers(ctx context.Context, filter PaperFilter) ([]Paper, int64, error)
	GetPaper(ctx context.Context, id uint64) (*Paper, error)
	CreatePaper(ctx context.Context, p *Paper) error
	UpdatePaper(ctx context.Context, p *Paper) error
	DeletePaper(ctx context.Context, id uint64) error
	CreatePaperSection(ctx context.Context, section *PaperSection) error
	DeletePaperSectionsByPaper(ctx context.Context, paperID uint64) error
	EnsureDefaultPaperSection(ctx context.Context, paperID uint64) (uint64, error)
	AddPaperQuestion(ctx context.Context, item *PaperQuestion) error
	UpdatePaperQuestion(ctx context.Context, item *PaperQuestion) error
	RemovePaperQuestion(ctx context.Context, paperID, questionID uint64) error
	DeletePaperQuestionsByPaper(ctx context.Context, paperID uint64) error
	ListPaperQuestionsWithQuestion(ctx context.Context, paperID uint64) ([]PaperQuestionWithQuestion, error)
	GetPaperQuestionWithQuestion(ctx context.Context, paperID, questionID uint64) (*PaperQuestionWithQuestion, error)
	ListPaperSectionsWithQuestions(ctx context.Context, paperID uint64) ([]PaperSection, error)
	GetPaperOutline(ctx context.Context, paperID uint64) (*PaperOutline, error)
}

type PaperReader interface {
	PaperExists(ctx context.Context, id uint64) (bool, error)
	GetPaperOutline(ctx context.Context, paperID uint64) (*PaperOutline, error)
	ListPaperQuestions(ctx context.Context, paperID uint64) ([]PaperQuestion, error)
	GetQuestion(ctx context.Context, id uint64) (*Question, error)
	ListTestCases(ctx context.Context, questionID uint64, includeHidden bool) ([]TestCase, error)
}

type JudgeTestCase struct {
	ID             uint64
	Input          string
	ExpectedOutput string
	TimeLimitMS    int
	MemoryLimitMB  int
}

type TestCaseReader interface {
	ListJudgeTestCases(ctx context.Context, questionID uint64) ([]JudgeTestCase, error)
}
