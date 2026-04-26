package library

import "context"

type Store interface {
	QuestionStore
	PaperStore
	TestCaseReader
}

type QuestionStore interface {
	ListQuestions(ctx context.Context, pageNum, pageSize int) ([]Question, int64, error)
	GetQuestion(ctx context.Context, id uint64) (*Question, error)
	CreateQuestion(ctx context.Context, q *Question) error
	UpdateQuestion(ctx context.Context, q *Question) error
	DeleteQuestion(ctx context.Context, id uint64) error
	QuestionExists(ctx context.Context, id uint64) (bool, error)
	AddTestCase(ctx context.Context, tc *TestCase) error
	ListTestCases(ctx context.Context, questionID uint64, includeHidden bool) ([]TestCase, error)
}

type PaperStore interface {
	PaperReader
	ListPapers(ctx context.Context, pageNum, pageSize int) ([]Paper, int64, error)
	GetPaper(ctx context.Context, id uint64) (*Paper, error)
	CreatePaper(ctx context.Context, p *Paper) error
	UpdatePaper(ctx context.Context, p *Paper) error
	DeletePaper(ctx context.Context, id uint64) error
	AddPaperQuestion(ctx context.Context, item *PaperQuestion) error
	RemovePaperQuestion(ctx context.Context, paperID, questionID uint64) error
}

type PaperReader interface {
	PaperExists(ctx context.Context, id uint64) (bool, error)
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
