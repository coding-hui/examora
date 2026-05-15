package exam

import (
	"context"
	"sort"
	"strings"
	"time"
)

func (s *Service) gradeSubmittedSession(ctx context.Context, examID uint64, snapshot *ExamSnapshot, session *ExamSession) error {
	if existing, err := s.store.GetExamResultForSession(ctx, session.ID); err == nil && existing != nil {
		return nil
	}

	questionSnapshots, err := s.store.ListQuestionSnapshots(ctx, snapshot.ID)
	if err != nil {
		return err
	}
	drafts, err := s.store.ListAnswerDrafts(ctx, session.ID)
	if err != nil {
		return err
	}
	answerBySnapshotID := make(map[uint64]map[string]any, len(drafts))
	for _, draft := range drafts {
		answerBySnapshotID[draft.QuestionID] = draft.Answer
	}

	submittedAt := time.Now()
	if session.SubmittedAt != nil {
		submittedAt = *session.SubmittedAt
	}

	result := &ExamResult{
		ExamID:         examID,
		ExamSnapshotID: snapshot.ID,
		ExamSessionID:  session.ID,
		UserID:         session.UserID,
		Status:         ResultStatusGraded,
		SubmittedAt:    submittedAt,
	}
	for _, qs := range questionSnapshots {
		result.MaxScore += qs.Score
	}

	if err := s.store.CreateExamResult(ctx, result); err != nil {
		if existing, getErr := s.store.GetExamResultForSession(ctx, session.ID); getErr == nil && existing != nil {
			return nil
		}
		return err
	}

	hasJudging := false
	hasManual := false
	for _, qs := range questionSnapshots {
		answer := answerBySnapshotID[qs.ID]
		qr := QuestionResult{
			ExamResultID:       result.ID,
			ExamSessionID:      session.ID,
			QuestionSnapshotID: qs.ID,
			QuestionID:         qs.QuestionID,
			Type:               qs.Type,
			Answer:             answer,
			MaxScore:           qs.Score,
			Result:             map[string]any{},
		}

		switch qs.Type {
		case QuestionTypeProgramming:
			if s.createProgrammingQuestionResult(ctx, examID, session, qs, answer, &qr) {
				hasJudging = true
			}
		case "SHORT_ANSWER":
			qr.Status = QuestionResultStatusManualRequired
			qr.Score = 0
			hasManual = true
		default:
			score, status := gradeObjectiveQuestion(qs, answer)
			qr.Score = score
			qr.Status = status
			result.Score += score
		}

		if err := s.store.CreateQuestionResult(ctx, &qr); err != nil {
			return err
		}
	}

	now := time.Now()
	switch {
	case hasJudging:
		result.Status = ResultStatusJudging
	case hasManual:
		result.Status = ResultStatusManualRequired
	default:
		result.Status = ResultStatusGraded
		result.GradedAt = &now
	}
	return s.store.UpdateExamResultSummary(ctx, result)
}

func (s *Service) createProgrammingQuestionResult(ctx context.Context, examID uint64, session *ExamSession, qs QuestionSnapshot, answer map[string]any, qr *QuestionResult) bool {
	code := strings.TrimSpace(stringFromAny(answer["code"]))
	language := strings.TrimSpace(stringFromAny(answer["language"]))
	if code == "" || language == "" || s.judge == nil {
		qr.Status = QuestionResultStatusUnanswered
		qr.Score = 0
		return false
	}

	sub := &Submission{
		ExamID:      examID,
		UserID:      session.UserID,
		QuestionID:  qs.ID,
		Answer:      answer,
		Code:        code,
		Language:    language,
		Status:      SubmissionStatusPending,
		SubmittedAt: time.Now(),
	}
	if err := s.store.CreateSubmission(ctx, sub); err != nil {
		qr.Status = QuestionResultStatusUnanswered
		qr.Result = map[string]any{"error": err.Error()}
		return false
	}
	qr.SubmissionID = &sub.ID
	if err := s.judge.CreateAndEnqueue(ctx, sub.ID, qs.ID, session.UserID, language); err != nil {
		qr.Status = QuestionResultStatusUnanswered
		qr.Result = map[string]any{"error": err.Error()}
		return false
	}
	_ = s.store.UpdateSubmissionStatus(ctx, sub.ID, SubmissionStatusQueued)
	qr.Status = QuestionResultStatusJudging
	return true
}

func gradeObjectiveQuestion(qs QuestionSnapshot, answer map[string]any) (float64, string) {
	if len(answer) == 0 {
		return 0, QuestionResultStatusUnanswered
	}
	matched := false
	switch qs.Type {
	case "SINGLE_CHOICE":
		matched = stringFromAny(answer["choice"]) == stringFromAny(qs.Answer["choice"])
	case "MULTIPLE_CHOICE":
		matched = sameStringSet(sliceFromAny(answer["choices"]), sliceFromAny(qs.Answer["choices"]))
	case "TRUE_FALSE":
		answerValue, answerOK := boolFromAny(answer["correct"])
		expectedValue, expectedOK := boolFromAny(qs.Answer["correct"])
		matched = answerOK && expectedOK && answerValue == expectedValue
	case "FILL_BLANK":
		matched = sameStringSlice(sliceFromAny(answer["blanks"]), sliceFromAny(qs.Answer["blanks"]))
	}
	if matched {
		return qs.Score, QuestionResultStatusCorrect
	}
	return 0, QuestionResultStatusIncorrect
}

func stringFromAny(value any) string {
	switch v := value.(type) {
	case string:
		return v
	default:
		return ""
	}
}

func boolFromAny(value any) (bool, bool) {
	v, ok := value.(bool)
	return v, ok
}

func sliceFromAny(value any) []string {
	raw, ok := value.([]any)
	if !ok {
		if strings, ok := value.([]string); ok {
			return strings
		}
		return nil
	}
	items := make([]string, 0, len(raw))
	for _, item := range raw {
		items = append(items, stringFromAny(item))
	}
	return items
}

func sameStringSet(left, right []string) bool {
	if len(left) != len(right) {
		return false
	}
	sort.Strings(left)
	sort.Strings(right)
	return sameStringSlice(left, right)
}

func sameStringSlice(left, right []string) bool {
	if len(left) != len(right) {
		return false
	}
	for i := range left {
		if left[i] != right[i] {
			return false
		}
	}
	return true
}

func (s *Service) GetExamResultForUser(ctx context.Context, examID, userID uint64) (*ExamResult, error) {
	return s.store.GetExamResultForExamUser(ctx, examID, userID)
}

func (s *Service) GetExamResult(ctx context.Context, id uint64) (*ExamResult, error) {
	return s.store.GetExamResult(ctx, id)
}

func (s *Service) ListExamResults(ctx context.Context, examID uint64, pageNum, pageSize int) ([]ExamResult, int64, error) {
	if pageNum < 1 {
		pageNum = 1
	}
	if pageSize < 1 {
		pageSize = 20
	}
	if pageSize > 100 {
		pageSize = 100
	}
	return s.store.ListExamResults(ctx, examID, pageNum, pageSize)
}
