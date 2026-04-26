package store

import (
	"github.com/coding-hui/examora/internal/infra/database"
	"github.com/coding-hui/examora/internal/library"
)

func toQuestion(m *database.QuestionModel) *library.Question {
	return &library.Question{ID: m.ID, Type: m.Type, Title: m.Title, Content: jsonToMap(m.Content), Answer: jsonToMap(m.Answer), Difficulty: m.Difficulty, Language: m.Language, StarterCode: m.StarterCode, TimeLimitMS: m.TimeLimitMS, MemoryLimitMB: m.MemoryLimitMB, Status: m.Status, CreatedBy: m.CreatedBy, CreatedAt: m.CreatedAt, UpdatedAt: m.UpdatedAt}
}

func toQuestionModel(q *library.Question) *database.QuestionModel {
	return &database.QuestionModel{Type: q.Type, Title: q.Title, Content: mapToJSON(q.Content), Answer: mapToJSON(q.Answer), Difficulty: q.Difficulty, Language: q.Language, StarterCode: q.StarterCode, TimeLimitMS: q.TimeLimitMS, MemoryLimitMB: q.MemoryLimitMB, Status: q.Status, CreatedBy: q.CreatedBy}
}

func toTestCase(m *database.TestCaseModel) *library.TestCase {
	return &library.TestCase{ID: m.ID, QuestionID: m.QuestionID, Input: m.Input, ExpectedOutput: m.ExpectedOutput, TimeLimitMS: m.TimeLimitMS, MemoryLimitMB: m.MemoryLimitMB, IsSample: m.IsSample, IsHidden: m.IsHidden, SortOrder: m.SortOrder, CreatedAt: m.CreatedAt}
}

func toPaper(m *database.PaperModel) *library.Paper {
	return &library.Paper{ID: m.ID, Title: m.Title, Description: m.Description, Status: m.Status, CreatedBy: m.CreatedBy, CreatedAt: m.CreatedAt, UpdatedAt: m.UpdatedAt}
}

func toPaperModel(p *library.Paper) *database.PaperModel {
	return &database.PaperModel{Title: p.Title, Description: p.Description, Status: p.Status, CreatedBy: p.CreatedBy}
}
