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

func toExamResult(m *database.ExamResultModel) *exam.ExamResult {
	return &exam.ExamResult{ID: m.ID, ExamID: m.ExamID, ExamSnapshotID: m.ExamSnapshotID, ExamSessionID: m.ExamSessionID, UserID: m.UserID, Status: m.Status, Score: m.Score, MaxScore: m.MaxScore, SubmittedAt: m.SubmittedAt, GradedAt: m.GradedAt}
}

func toExamResultModel(r *exam.ExamResult) *database.ExamResultModel {
	return &database.ExamResultModel{ExamID: r.ExamID, ExamSnapshotID: r.ExamSnapshotID, ExamSessionID: r.ExamSessionID, UserID: r.UserID, Status: r.Status, Score: r.Score, MaxScore: r.MaxScore, SubmittedAt: r.SubmittedAt, GradedAt: r.GradedAt}
}

func toQuestionResult(m *database.QuestionResultModel) exam.QuestionResult {
	return exam.QuestionResult{ID: m.ID, ExamResultID: m.ExamResultID, ExamSessionID: m.ExamSessionID, QuestionSnapshotID: m.QuestionSnapshotID, QuestionID: m.QuestionID, Type: m.Type, Answer: jsonToMap(m.Answer), Status: m.Status, Score: m.Score, MaxScore: m.MaxScore, Result: jsonToMap(m.Result), SubmissionID: m.SubmissionID, JudgedAt: m.JudgedAt}
}

func toQuestionResultModel(r *exam.QuestionResult) *database.QuestionResultModel {
	return &database.QuestionResultModel{ExamResultID: r.ExamResultID, ExamSessionID: r.ExamSessionID, QuestionSnapshotID: r.QuestionSnapshotID, QuestionID: r.QuestionID, Type: r.Type, Answer: mapToJSON(r.Answer), Status: r.Status, Score: r.Score, MaxScore: r.MaxScore, Result: mapToJSON(r.Result), SubmissionID: r.SubmissionID, JudgedAt: r.JudgedAt}
}
