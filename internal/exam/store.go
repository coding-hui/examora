package exam

import "context"

type JudgeDispatcher interface {
	CreateAndEnqueue(ctx context.Context, submissionID, questionID, userID uint64, language string) error
}

type Store interface {
	ExamStore
	SnapshotStore
	ExamSessionStore
	AnswerDraftStore
	SubmissionStore
	ClientEventStore
	UserGroupStore
	ExamAssignmentStore
	SubmissionReader
}

type ExamSessionStore interface {
	CreateExamSession(ctx context.Context, session *ExamSession) error
	GetExamSession(ctx context.Context, examSnapshotID, userID uint64) (*ExamSession, error)
	ListExamSessionsBySnapshot(ctx context.Context, examSnapshotID uint64) ([]ExamSession, error)
	ListExamSessionsByUser(ctx context.Context, userID uint64) ([]ExamSession, error)
	UpdateExamSession(ctx context.Context, session *ExamSession) error
	DeleteExamSession(ctx context.Context, id uint64) error
}

type AnswerDraftStore interface {
	SaveAnswerDraft(ctx context.Context, sessionID, questionID uint64, answer map[string]any) error
	GetAnswerDraft(ctx context.Context, sessionID, questionID uint64) (*AnswerDraft, error)
	ListAnswerDrafts(ctx context.Context, sessionID uint64) ([]AnswerDraft, error)
}

type SnapshotStore interface {
	CreateExamSnapshot(ctx context.Context, snap *ExamSnapshot) error
	GetExamSnapshot(ctx context.Context, id uint64) (*ExamSnapshot, error)
	GetExamSnapshotByExamID(ctx context.Context, examID uint64) (*ExamSnapshot, error)
	ListExamSnapshots(ctx context.Context) ([]ExamSnapshot, error)
	ListPaperSectionSnapshots(ctx context.Context, examSnapshotID uint64) ([]PaperSectionSnapshot, error)
	CreatePaperSectionSnapshot(ctx context.Context, snap *PaperSectionSnapshot) error
	ListQuestionSnapshots(ctx context.Context, examSnapshotID uint64) ([]QuestionSnapshot, error)
	CreateQuestionSnapshot(ctx context.Context, snap *QuestionSnapshot) error
}

type ExamStore interface {
	ListExams(ctx context.Context, pageNum, pageSize int) ([]Exam, int64, error)
	GetExam(ctx context.Context, id uint64) (*Exam, error)
	CreateExam(ctx context.Context, e *Exam) error
	UpdateExam(ctx context.Context, e *Exam) error
}

type SubmissionStore interface {
	CreateSubmission(ctx context.Context, s *Submission) error
	GetSubmission(ctx context.Context, id uint64) (*Submission, error)
	UpdateSubmissionStatus(ctx context.Context, id uint64, status string) error
	GetExamResultForSession(ctx context.Context, examSessionID uint64) (*ExamResult, error)
	GetExamResultForExamUser(ctx context.Context, examID, userID uint64) (*ExamResult, error)
	GetExamResult(ctx context.Context, id uint64) (*ExamResult, error)
	ListExamResults(ctx context.Context, examID uint64, pageNum, pageSize int) ([]ExamResult, int64, error)
	CreateExamResult(ctx context.Context, result *ExamResult) error
	CreateQuestionResult(ctx context.Context, result *QuestionResult) error
	UpdateExamResultSummary(ctx context.Context, result *ExamResult) error
}

type ClientEventStore interface {
	CreateClientEvent(ctx context.Context, ev *ClientEvent) error
	ListClientEvents(ctx context.Context, examID uint64, pageNum, pageSize int) ([]ClientEvent, int64, error)
}

type UserGroupStore interface {
	CreateUserGroup(ctx context.Context, group *UserGroup) error
	UpdateUserGroup(ctx context.Context, group *UserGroup) error
	DeleteUserGroup(ctx context.Context, id uint64) error
	GetUserGroup(ctx context.Context, id uint64) (*UserGroup, error)
	ListUserGroups(ctx context.Context) ([]UserGroup, error)
	ListDescendantUserGroupIDs(ctx context.Context, id uint64) ([]uint64, error)
	AddUserGroupMembers(ctx context.Context, groupID uint64, userIDs []uint64) error
	RemoveUserGroupMember(ctx context.Context, groupID, userID uint64) error
	ListAllUserGroupMemberUserIDs(ctx context.Context) ([]uint64, error)
	ListUserGroupMemberUserIDs(ctx context.Context, groupIDs []uint64) ([]uint64, error)
	ListUserGroupMemberships(ctx context.Context, groupIDs []uint64) ([]UserGroupMembership, error)
	ListUserGroupExamAssignments(ctx context.Context, groupID uint64) ([]ExamAssignment, error)
}

type ExamAssignmentStore interface {
	CreateExamAssignment(ctx context.Context, assignment *ExamAssignment) error
	GetExamAssignment(ctx context.Context, examID, assignmentID uint64) (*ExamAssignment, error)
	ListExamAssignments(ctx context.Context, examID uint64) ([]ExamAssignment, error)
	DeleteExamAssignment(ctx context.Context, id uint64) error
}

type JudgeSubmission struct {
	ID         uint64
	QuestionID uint64
	UserID     uint64
	Code       string
	Language   string
}

type SubmissionReader interface {
	FindForJudge(ctx context.Context, id uint64) (*JudgeSubmission, error)
	UpdateJudgeResult(ctx context.Context, submissionID uint64, status string, score float64, result map[string]any) error
}
