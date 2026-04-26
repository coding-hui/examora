package store

import (
	"github.com/coding-hui/examora/internal/exam"
	"github.com/coding-hui/examora/internal/infra/database"
)

func toExam(m *database.ExamModel) *exam.Exam {
	return &exam.Exam{ID: m.ID, Title: m.Title, Description: m.Description, PaperID: m.PaperID, Status: m.Status, StartTime: m.StartTime, EndTime: m.EndTime, DurationMinutes: m.DurationMinutes, CreatedBy: m.CreatedBy, CreatedAt: m.CreatedAt, UpdatedAt: m.UpdatedAt}
}

func toExamModel(e *exam.Exam) *database.ExamModel {
	return &database.ExamModel{Title: e.Title, Description: e.Description, PaperID: e.PaperID, Status: e.Status, StartTime: e.StartTime, EndTime: e.EndTime, DurationMinutes: e.DurationMinutes, CreatedBy: e.CreatedBy}
}

func toSubmission(m *database.SubmissionModel) *exam.Submission {
	return &exam.Submission{ID: m.ID, ExamID: m.ExamID, UserID: m.UserID, QuestionID: m.QuestionID, Answer: jsonToMap(m.Answer), Code: m.Code, Language: m.Language, Status: m.Status, Score: m.Score, Result: jsonToMap(m.Result), SubmittedAt: m.SubmittedAt, JudgedAt: m.JudgedAt}
}

func toSubmissionModel(s *exam.Submission) *database.SubmissionModel {
	return &database.SubmissionModel{ExamID: s.ExamID, UserID: s.UserID, QuestionID: s.QuestionID, Answer: mapToJSON(s.Answer), Code: s.Code, Language: s.Language, Status: s.Status, Score: s.Score, Result: mapToJSON(s.Result), SubmittedAt: s.SubmittedAt, JudgedAt: s.JudgedAt}
}
