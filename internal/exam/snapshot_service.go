package exam

import (
	"context"
	"encoding/json"
	"strconv"
	"time"

	"gorm.io/datatypes"
	"gorm.io/gorm"

	"github.com/coding-hui/examora/internal/infra/database"
	"github.com/coding-hui/examora/internal/library"
)

// PublishExam creates a frozen snapshot of the exam for candidate delivery
func (s *Service) PublishExamWithSnapshot(ctx context.Context, examID uint64, startTime, endTime time.Time, durationMinutes int) (*ExamSnapshot, error) {
	if !endTime.After(startTime) || durationMinutes < 1 {
		return nil, ErrInvalidExamWindow
	}

	// Get exam and verify it's in DRAFT status
	e, err := s.store.GetExam(ctx, examID)
	if err != nil {
		return nil, err
	}
	if e.Status != StatusDraft {
		return nil, ErrInvalidExamStatusTransition
	}

	// Verify paper exists
	if e.PaperID == nil {
		return nil, ErrInvalidExamStatusTransition
	}

	// Gather all question data before creating snapshots
	paperQuestions, err := s.papers.ListPaperQuestions(ctx, *e.PaperID)
	if err != nil {
		return nil, err
	}
	if len(paperQuestions) == 0 {
		return nil, ErrInvalidExamStatusTransition
	}

	type questionSnapshotData struct {
		question  *library.Question
		score     float64
		sortOrder int
		testCases []TestCase
	}

	var questionData []questionSnapshotData
	for _, pq := range paperQuestions {
		q, err := s.papers.GetQuestion(ctx, pq.QuestionID)
		if err != nil {
			return nil, err
		}
		if q.Status != library.QuestionStatusPublished || pq.Score <= 0 {
			return nil, ErrInvalidExamStatusTransition
		}

		var testCases []TestCase
		if q.Type == QuestionTypeProgramming {
			tcList, err := s.papers.ListTestCases(ctx, q.ID, true) // include hidden
			if err != nil {
				return nil, err
			}
			if len(tcList) == 0 {
				return nil, ErrInvalidExamStatusTransition
			}
			if err := library.ValidateQuestionForPublish(q, tcList); err != nil {
				return nil, err
			}
			for _, tc := range tcList {
				testCases = append(testCases, TestCase{
					ID:             tc.ID,
					Input:          tc.Input,
					ExpectedOutput: tc.ExpectedOutput,
					TimeLimitMS:    tc.TimeLimitMS,
					MemoryLimitMB:  tc.MemoryLimitMB,
					IsSample:       tc.IsSample,
					IsHidden:       tc.IsHidden,
				})
			}
		} else if err := library.ValidateQuestionForPublish(q, nil); err != nil {
			return nil, err
		}
		questionData = append(questionData, questionSnapshotData{
			question:  q,
			score:     pq.Score,
			sortOrder: pq.SortOrder,
			testCases: testCases,
		})
	}

	var snapshot *ExamSnapshot
	err = s.db.Transaction(func(tx *gorm.DB) error {
		// Create exam snapshot
		snapshot = &ExamSnapshot{
			ExamID:          examID,
			PaperSnapshotID: *e.PaperID,
			StartTime:       startTime,
			EndTime:         endTime,
			DurationMinutes: durationMinutes,
			PublishedAt:     time.Now(),
		}
		// Create the model and insert
		row := &database.ExamSnapshotModel{
			ExamID:          snapshot.ExamID,
			PaperSnapshotID: snapshot.PaperSnapshotID,
			StartTime:       snapshot.StartTime,
			EndTime:         snapshot.EndTime,
			DurationMinutes: snapshot.DurationMinutes,
			PublishedAt:     snapshot.PublishedAt,
		}
		if err := tx.Create(row).Error; err != nil {
			return err
		}
		snapshot.ID = row.ID

		// Freeze all questions from the paper into question_snapshots
		for _, qd := range questionData {
			qSnap := &QuestionSnapshot{
				ExamSnapshotID: snapshot.ID,
				QuestionID:     qd.question.ID,
				Type:           qd.question.Type,
				Title:          qd.question.Title,
				Content:        qd.question.Content,
				Score:          qd.score,
				SortOrder:      qd.sortOrder,
				Answer:         qd.question.Answer,
				TestCases:      qd.testCases,
				StarterCode:    qd.question.StarterCode,
				TimeLimitMs:    qd.question.TimeLimitMS,
				MemoryLimitMb:  qd.question.MemoryLimitMB,
			}
			qRow := &database.QuestionSnapshotModel{
				ExamSnapshotID: qSnap.ExamSnapshotID,
				QuestionID:     qSnap.QuestionID,
				Type:           qSnap.Type,
				Title:          qSnap.Title,
				Content:        datatypes.JSON(mapToJSON(qSnap.Content)),
				Score:          qSnap.Score,
				SortOrder:      qSnap.SortOrder,
				Answer:         datatypes.JSON(mapToJSON(qSnap.Answer)),
				TestCases:      datatypes.JSON(testCasesToJSON(qSnap.TestCases)),
				StarterCode:    qSnap.StarterCode,
				TimeLimitMS:    qSnap.TimeLimitMs,
				MemoryLimitMB:  qSnap.MemoryLimitMb,
			}
			if err := tx.Create(qRow).Error; err != nil {
				return err
			}
		}

		// Update exam status to PUBLISHED
		e.Status = StatusPublished
		e.StartTime = &startTime
		e.EndTime = &endTime
		e.DurationMinutes = durationMinutes
		return tx.Model(&database.ExamModel{}).
			Where("id = ?", e.ID).
			Updates(database.ExamModel{
				Status:          e.Status,
				StartTime:       e.StartTime,
				EndTime:         e.EndTime,
				DurationMinutes: e.DurationMinutes,
			}).Error
	})
	if err != nil {
		return nil, err
	}

	return snapshot, nil
}

// GetCandidatePaper returns a candidate-safe view of the exam paper (no answers, no hidden test cases)
func (s *Service) GetCandidatePaper(ctx context.Context, examID, userID uint64) (*CandidatePaper, error) {
	e, err := s.store.GetExam(ctx, examID)
	if err != nil {
		return nil, err
	}

	snapshot, err := s.store.GetExamSnapshotByExamID(ctx, examID)
	if err != nil {
		return nil, err
	}

	// Verify user has a session for this exam
	session, err := s.store.GetExamSession(ctx, snapshot.ID, userID)
	if err != nil {
		return nil, err
	}

	// Verify exam is within time window
	now := time.Now()
	if now.Before(snapshot.StartTime) {
		return nil, ErrExamNotStarted
	}
	if now.After(snapshot.EndTime) {
		return nil, ErrExamEnded
	}

	// Get all question snapshots
	questionSnapshots, err := s.store.ListQuestionSnapshots(ctx, snapshot.ID)
	if err != nil {
		return nil, err
	}

	// Build candidate-safe response
	cp := &CandidatePaper{
		ExamSnapshotID:   snapshot.ID,
		Title:            e.Title,
		StartTime:        snapshot.StartTime,
		EndTime:          snapshot.EndTime,
		DurationMinutes:  snapshot.DurationMinutes,
		RemainingSeconds: calculateRemaining(session, snapshot),
		Questions:        make([]CandidateQuestion, 0, len(questionSnapshots)),
	}

	for _, qs := range questionSnapshots {
		cq := CandidateQuestion{
			SnapshotID:  qs.ID,
			Type:        qs.Type,
			Title:       qs.Title,
			Content:     qs.Content,
			Score:       qs.Score,
			SortOrder:   qs.SortOrder,
			StarterCode: qs.StarterCode,
			TimeLimitMs: qs.TimeLimitMs,
		}

		// Only include sample test cases for programming questions
		if qs.Type == QuestionTypeProgramming {
			for _, tc := range qs.TestCases {
				if tc.IsSample {
					cq.SampleTestCases = append(cq.SampleTestCases, SampleTestCase{
						Input:          tc.Input,
						ExpectedOutput: tc.ExpectedOutput,
					})
				}
			}
		}

		cp.Questions = append(cp.Questions, cq)
	}

	return cp, nil
}

// StartExamSession creates or resumes an exam session for a candidate
func (s *Service) StartExamSession(ctx context.Context, examID, userID uint64, ipAddress, deviceID string) (*ExamSession, error) {
	snapshot, err := s.store.GetExamSnapshotByExamID(ctx, examID)
	if err != nil {
		return nil, err
	}

	// Verify exam is within time window for new sessions
	now := time.Now()
	if now.After(snapshot.EndTime) {
		return nil, ErrExamEnded
	}

	// Check if session already exists
	existing, err := s.store.GetExamSession(ctx, snapshot.ID, userID)
	if err == nil && existing != nil {
		// Resume existing session (even if outside window but session exists)
		if existing.Status == SessionStatusSubmitted {
			return nil, ErrInvalidExamStatusTransition
		}
		existing.Status = SessionStatusInProgress
		remaining := calculateRemainingSeconds(existing, snapshot)
		existing.RemainingSeconds = &remaining
		if err := s.store.UpdateExamSession(ctx, existing); err != nil {
			return nil, err
		}
		return existing, nil
	}

	// For new sessions, must be within start window
	if now.Before(snapshot.StartTime) {
		return nil, ErrExamNotStarted
	}

	// Create new session
	remaining := snapshot.DurationMinutes * 60
	session := &ExamSession{
		ExamSnapshotID:   snapshot.ID,
		UserID:           userID,
		Status:           SessionStatusInProgress,
		StartedAt:        timePtr(time.Now()),
		RemainingSeconds: &remaining,
		IPAddress:        &ipAddress,
		DeviceID:         &deviceID,
	}
	if err := s.store.CreateExamSession(ctx, session); err != nil {
		return nil, err
	}
	return session, nil
}

// SubmitExam finalizes the exam session and triggers grading
func (s *Service) SubmitExam(ctx context.Context, examID, userID uint64) error {
	snapshot, err := s.store.GetExamSnapshotByExamID(ctx, examID)
	if err != nil {
		return err
	}

	session, err := s.store.GetExamSession(ctx, snapshot.ID, userID)
	if err != nil {
		return err
	}

	if session.Status == SessionStatusSubmitted {
		return nil // Already submitted, idempotent
	}

	session.Status = SessionStatusSubmitted
	session.SubmittedAt = timePtr(time.Now())
	remaining := 0
	session.RemainingSeconds = &remaining

	return s.store.UpdateExamSession(ctx, session)
}

// GetCurrentSession returns the current exam session for a user
func (s *Service) GetCurrentSession(ctx context.Context, examID, userID uint64) (*ExamSession, error) {
	snapshot, err := s.store.GetExamSnapshotByExamID(ctx, examID)
	if err != nil {
		return nil, err
	}
	session, err := s.store.GetExamSession(ctx, snapshot.ID, userID)
	if err != nil {
		return nil, err
	}
	// Update remaining time
	remaining := calculateRemainingSeconds(session, snapshot)
	session.RemainingSeconds = &remaining
	return session, nil
}

// SaveAnswers saves candidate answer drafts
func (s *Service) SaveAnswers(ctx context.Context, examID, userID uint64, answers map[string]map[string]any) error {
	snapshot, err := s.store.GetExamSnapshotByExamID(ctx, examID)
	if err != nil {
		return err
	}
	session, err := s.store.GetExamSession(ctx, snapshot.ID, userID)
	if err != nil {
		return err
	}
	if session.Status != SessionStatusInProgress {
		return ErrForbidden
	}

	// Reject answer changes after the exam deadline
	now := time.Now()
	if now.After(snapshot.EndTime) {
		return ErrExamEnded
	}
	// Also check if candidate's personal duration has expired
	if session.StartedAt != nil {
		elapsed := time.Since(*session.StartedAt).Seconds()
		if elapsed > float64(snapshot.DurationMinutes*60) {
			return ErrExamEnded
		}
	}

	questionSnapshots, err := s.store.ListQuestionSnapshots(ctx, snapshot.ID)
	if err != nil {
		return err
	}
	validSnapshotIDs := make(map[uint64]struct{}, len(questionSnapshots))
	for _, qs := range questionSnapshots {
		validSnapshotIDs[qs.ID] = struct{}{}
	}

	// Save each answer draft
	for questionIDStr, answer := range answers {
		questionID, err := strconv.ParseUint(questionIDStr, 10, 64)
		if err != nil {
			continue
		}
		if _, ok := validSnapshotIDs[questionID]; !ok {
			return ErrForbidden
		}
		if err := s.store.SaveAnswerDraft(ctx, session.ID, questionID, answer); err != nil {
			return err
		}
	}
	return nil
}

// =====================================================================
// Helper types and constants for candidate exam flow
// =====================================================================

type CandidatePaper struct {
	ExamSnapshotID   uint64              `json:"exam_snapshot_id"`
	Title            string              `json:"title"`
	StartTime        time.Time           `json:"start_time"`
	EndTime          time.Time           `json:"end_time"`
	DurationMinutes  int                 `json:"duration_minutes"`
	RemainingSeconds int                 `json:"remaining_seconds"`
	Questions        []CandidateQuestion `json:"questions"`
}

type CandidateQuestion struct {
	SnapshotID      uint64           `json:"snapshot_id"`
	Type            string           `json:"type"`
	Title           string           `json:"title"`
	Content         map[string]any   `json:"content"`
	Score           float64          `json:"score"`
	SortOrder       int              `json:"sort_order"`
	SampleTestCases []SampleTestCase `json:"sample_test_cases,omitempty"`
	StarterCode     *string          `json:"starter_code,omitempty"`
	TimeLimitMs     int              `json:"time_limit_ms"`
}

type SampleTestCase struct {
	Input          string `json:"input"`
	ExpectedOutput string `json:"expected_output"`
}

type ExamSession struct {
	ID               uint64     `json:"id"`
	ExamSnapshotID   uint64     `json:"exam_snapshot_id"`
	UserID           uint64     `json:"user_id"`
	Status           string     `json:"status"`
	StartedAt        *time.Time `json:"started_at,omitempty"`
	SubmittedAt      *time.Time `json:"submitted_at,omitempty"`
	RemainingSeconds *int       `json:"remaining_seconds,omitempty"`
	IPAddress        *string    `json:"ip_address,omitempty"`
	DeviceID         *string    `json:"device_id,omitempty"`
}

const (
	SessionStatusNotStarted = "NOT_STARTED"
	SessionStatusInProgress = "IN_PROGRESS"
	SessionStatusSubmitted  = "SUBMITTED"
	SessionStatusExpired    = "EXPIRED"
)

func mapToJSON(data map[string]any) []byte {
	if data == nil {
		return []byte("{}")
	}
	raw, _ := json.Marshal(data)
	return raw
}

func testCasesToJSON(tc []TestCase) []byte {
	if tc == nil {
		return []byte("[]")
	}
	raw, _ := json.Marshal(tc)
	return raw
}

func calculateRemaining(session *ExamSession, snapshot *ExamSnapshot) int {
	if session.Status == SessionStatusSubmitted {
		return 0
	}
	if session.StartedAt == nil {
		return snapshot.DurationMinutes * 60
	}
	elapsed := time.Since(*session.StartedAt).Seconds()
	total := float64(snapshot.DurationMinutes * 60)
	remaining := total - elapsed
	if remaining < 0 {
		return 0
	}
	return int(remaining)
}

func calculateRemainingSeconds(session *ExamSession, snapshot *ExamSnapshot) int {
	if session.Status == SessionStatusSubmitted {
		return 0
	}
	if session.StartedAt == nil {
		return snapshot.DurationMinutes * 60
	}
	elapsed := time.Since(*session.StartedAt).Seconds()
	total := float64(snapshot.DurationMinutes * 60)
	remaining := total - elapsed
	if remaining < 0 {
		return 0
	}
	return int(remaining)
}

func timePtr(t time.Time) *time.Time {
	return &t
}
