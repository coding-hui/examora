export type RoleCode = "SUPER_ADMIN" | "TEACHER" | "PROCTOR" | "STUDENT";

export interface ApiEnvelope<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export interface PageResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface AuthConfig {
  auth_mode: string;
  logto_enabled: boolean;
  has_local_users: boolean;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expires_at: number;
  user?: AuthMeData;
}

export interface AuthMeData {
  id: number;
  username: string;
  display_name?: string;
  roles?: string[];
  permissions?: Record<string, string[]>;
  external_subject?: string;
}

export const API_PATHS = {
  auth: {
    config: "/api/v1/auth/config",
    login: "/api/v1/auth/login",
    logout: "/api/v1/auth/logout",
    me: "/api/v1/auth/me",
    logtoLogin: "/api/v1/auth/logto/login",
  },
  candidate: {
    availableExams: "/api/v1/exams/available",
    paper: (examID: number | string) => `/api/v1/exams/${examID}/paper`,
    startSession: (examID: number | string) =>
      `/api/v1/exams/${examID}/sessions/start`,
    currentSession: (examID: number | string) =>
      `/api/v1/exams/${examID}/sessions/current`,
    answers: (examID: number | string) => `/api/v1/exams/${examID}/answers`,
    submit: (examID: number | string) => `/api/v1/exams/${examID}/submit`,
    result: (examID: number | string) => `/api/v1/exams/${examID}/result`,
    submissions: "/api/v1/submissions",
    submission: (submissionID: number | string) =>
      `/api/v1/submissions/${submissionID}`,
    heartbeat: "/api/v1/heartbeat",
    deviceBind: "/api/v1/device-bind",
    securityReport: "/api/v1/security-report",
    examEvents: "/api/v1/exam-events",
  },
  admin: {
    users: "/api/v1/users",
    user: (userID: number | string) => `/api/v1/users/${userID}`,
    userGroupTree: "/api/v1/user-groups/tree",
    userGroups: "/api/v1/user-groups",
    userGroup: (groupID: number | string) => `/api/v1/user-groups/${groupID}`,
    userGroupStudents: (groupID: number | string) =>
      `/api/v1/user-groups/${groupID}/students`,
    userGroupChildren: (groupID: number | string) =>
      `/api/v1/user-groups/${groupID}/children`,
    userGroupExamAssignments: (groupID: number | string) =>
      `/api/v1/user-groups/${groupID}/exam-assignments`,
    userGroupMembers: (groupID: number | string) =>
      `/api/v1/user-groups/${groupID}/members`,
    userGroupMember: (groupID: number | string, userID: number | string) =>
      `/api/v1/user-groups/${groupID}/members/${userID}`,
    questions: "/api/v1/questions",
    question: (questionID: number | string) => `/api/v1/questions/${questionID}`,
    questionBatchStatus: "/api/v1/questions/batch/status",
    questionBatch: "/api/v1/questions/batch",
    papers: "/api/v1/papers",
    paper: (paperID: number | string) => `/api/v1/papers/${paperID}`,
    paperOutline: (paperID: number | string) =>
      `/api/v1/papers/${paperID}/outline`,
    paperQuestions: (paperID: number | string) =>
      `/api/v1/papers/${paperID}/questions`,
    paperQuestion: (paperID: number | string, questionID: number | string) =>
      `/api/v1/papers/${paperID}/questions/${questionID}`,
    paperBatch: "/api/v1/papers/batch",
    exams: "/api/v1/exams",
    exam: (examID: number | string) => `/api/v1/exams/${examID}`,
    examPublish: (examID: number | string) =>
      `/api/v1/exams/${examID}/publish`,
    examBatchClose: "/api/v1/exams/batch/close",
    examSessions: (examID: number | string) =>
      `/api/v1/exams/${examID}/sessions`,
    examCandidates: (examID: number | string) =>
      `/api/v1/exams/${examID}/candidates`,
    examCandidate: (examID: number | string, userID: number | string) =>
      `/api/v1/exams/${examID}/candidates/${userID}`,
    examAssignments: (examID: number | string) =>
      `/api/v1/exams/${examID}/assignments`,
    examAssignment: (examID: number | string, assignmentID: number | string) =>
      `/api/v1/exams/${examID}/assignments/${assignmentID}`,
    examEvents: (examID: number | string) => `/api/v1/exams/${examID}/events`,
    examResults: (examID: number | string) =>
      `/api/v1/exams/${examID}/results`,
    examResult: (resultID: number | string) =>
      `/api/v1/exam-results/${resultID}`,
    judgeTasks: "/api/v1/judge/tasks",
    judgeTask: (taskID: number | string) => `/api/v1/judge/tasks/${taskID}`,
  },
} as const;

export type QuestionType =
  | "SINGLE_CHOICE"
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE"
  | "FILL_BLANK"
  | "SHORT_ANSWER"
  | "PROGRAMMING";

// ---- Question type labels / options ----
export const QUESTION_TYPE_OPTIONS: { label: string; value: QuestionType }[] = [
  { label: "单选题", value: "SINGLE_CHOICE" },
  { label: "多选题", value: "MULTIPLE_CHOICE" },
  { label: "判断题", value: "TRUE_FALSE" },
  { label: "填空题", value: "FILL_BLANK" },
  { label: "简答题", value: "SHORT_ANSWER" },
  { label: "编程题", value: "PROGRAMMING" },
];

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  SINGLE_CHOICE: "单选题",
  MULTIPLE_CHOICE: "多选题",
  TRUE_FALSE: "判断题",
  FILL_BLANK: "填空题",
  SHORT_ANSWER: "简答题",
  PROGRAMMING: "编程题",
};

export const DIFFICULTY_OPTIONS = [
  { label: "简单", value: "EASY" },
  { label: "中等", value: "MEDIUM" },
  { label: "困难", value: "HARD" },
];

export const DIFFICULTY_LABELS: Record<string, string> = {
  EASY: "简单",
  MEDIUM: "中等",
  HARD: "困难",
};

export const QUESTION_STATUS_OPTIONS = [
  { label: "草稿", value: "DRAFT" },
  { label: "已发布", value: "PUBLISHED" },
];

export const QUESTION_STATUS_LABELS: Record<string, string> = {
  DRAFT: "草稿",
  PUBLISHED: "已发布",
};

export const QUESTION_STATUS_BADGE: Record<string, "default" | "success"> = {
  DRAFT: "default",
  PUBLISHED: "success",
};

export type ExamStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "RUNNING"
  | "CLOSED"
  | "ARCHIVED";

export type PaperStatus = "DRAFT" | "PUBLISHED";

export type ExamSessionStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "EXPIRED";

export type SubmissionStatus =
  | "PENDING"
  | "QUEUED"
  | "JUDGING"
  | "COMPILING"
  | "RUNNING"
  | "ACCEPTED"
  | "PARTIAL_ACCEPTED"
  | "WRONG_ANSWER"
  | "COMPILATION_ERROR"
  | "RUNTIME_ERROR"
  | "TIME_LIMIT_EXCEEDED"
  | "MEMORY_LIMIT_EXCEEDED"
  | "OUTPUT_LIMIT_EXCEEDED"
  | "SYSTEM_ERROR";

export type JudgeStatus =
  | "PENDING"
  | "QUEUED"
  | "RUNNING"
  | "ACCEPTED"
  | "WRONG_ANSWER"
  | "COMPILE_ERROR"
  | "RUNTIME_ERROR"
  | "TIME_LIMIT_EXCEEDED"
  | "MEMORY_LIMIT_EXCEEDED"
  | "SYSTEM_ERROR"
  | "CANCELED";

// =====================================================================
// M1: Admin-facing types (includes sensitive data)
// =====================================================================

/** Admin-facing question — includes scoring answer (never send to candidate) */
export interface AdminQuestion {
  id: number;
  type: QuestionType;
  title: string;
  content: Record<string, unknown>;
  answer: Record<string, unknown> | null;
  difficulty?: string;
  language?: string;
  starter_code?: string;
  time_limit_ms: number;
  memory_limit_mb: number;
  status: string;
  test_cases?: AdminTestCase[];
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface AdminTestCase {
  id: number;
  question_id: number;
  input: string;
  expected_output: string;
  time_limit_ms: number;
  memory_limit_mb: number;
  is_sample: boolean;
  is_hidden: boolean;
  sort_order: number;
}

export interface QuestionFilter {
  keyword?: string;
  type?: QuestionType;
  difficulty?: string;
  status?: "DRAFT" | "PUBLISHED";
  sort_field?: "updated_at";
  sort_order?: "asc" | "desc";
  page?: number;
  page_size?: number;
}

export interface QuestionPageResponse {
  items: AdminQuestion[];
  total: number;
  page: number;
  page_size: number;
}

export type AdminQuestionPageResponse = PageResponse<AdminQuestion>;

export interface SaveQuestionPayload {
  type: QuestionType;
  title: string;
  content: Record<string, unknown>;
  answer: Record<string, unknown> | null;
  difficulty?: string;
  language?: string;
  starter_code?: string;
  time_limit_ms: number;
  memory_limit_mb: number;
  status: string;
  test_cases?: Omit<AdminTestCase, "id" | "question_id">[];
}

export interface AdminPaper {
  id: number;
  title: string;
  description: string;
  status: PaperStatus;
  created_by: number;
  created_at: string;
  updated_at: string;
  question_count?: number;
  total_score?: number;
}

export interface SavePaperPayload {
  title: string;
  description: string;
  status: PaperStatus;
}

export interface AdminPaperQuestion {
  id: number;
  paper_id: number;
  section_id: number;
  question_id: number;
  score: number;
  sort_order: number;
  created_at: string;
  title?: string;
  type?: QuestionType;
  difficulty?: string;
  status?: string;
}

export interface AddPaperQuestionPayload {
  question_id: number;
  score: number;
  sort_order: number;
}

export interface AdminPaperSection {
  id: number;
  paper_id: number;
  title: string;
  description: string;
  sort_order: number;
  question_count: number;
  total_score: number;
  created_at: string;
  updated_at: string;
  questions: AdminPaperQuestion[];
}

export interface AdminPaperOutline {
  paper: AdminPaper;
  sections: AdminPaperSection[];
  question_count: number;
  total_score: number;
}

export interface SavePaperOutlinePayload {
  sections: Array<{
    id?: number;
    title: string;
    description?: string;
    sort_order: number;
    questions: Array<{
      question_id: number;
      score: number;
      sort_order: number;
    }>;
  }>;
}

export type AdminPaperPageResponse = PageResponse<AdminPaper>;

export interface AdminExam {
  id: number;
  title: string;
  description: string;
  paper_id: number | null;
  status: ExamStatus;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number;
  exam_snapshot_id?: number | null;
  published_at?: string | null;
  snapshot_question_count?: number;
  snapshot_total_score?: number;
  candidate_count?: number;
  submitted_count?: number;
  result_count?: number;
  audit_event_count?: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: number;
  username: string;
  display_name?: string;
  email?: string;
  role: string;
  status: string;
  source: string;
  created_at: string;
}

export type AdminUserPageResponse = PageResponse<AdminUser>;

export interface AdminUserGroup {
  id: number;
  parent_id?: number;
  name: string;
  description: string;
  status: "ACTIVE" | "ARCHIVED";
  source: "LOCAL" | "LOGTO" | "OIDC" | "SCIM";
  external_provider?: string;
  external_id?: string;
  external_parent_id?: string;
  sync_mode: "LOCAL" | "SYNCED" | "MAPPED";
  last_synced_at?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  member_count?: number;
  child_count?: number;
  children?: AdminUserGroup[];
}

export interface AdminUserGroupTreeResponse {
  items: AdminUserGroup[];
}

export interface AdminUserGroupStudentsResponse {
  ids: number[];
}

export interface AdminUserGroupMember {
  user: AdminUser;
  user_group_id: number;
  direct: boolean;
  source: "LOCAL" | "LOGTO" | "OIDC" | "SCIM";
  created_at: string;
}

export type AdminUserGroupMemberPageResponse =
  PageResponse<AdminUserGroupMember>;

export interface AdminUserGroupListResponse {
  items: AdminUserGroup[];
}

export interface AdminExamAssignment {
  id: number;
  exam_id: number;
  exam_snapshot_id: number;
  target_type: "USER" | "USER_GROUP";
  target_id: number;
  created_by: number;
  created_at: string;
}

export interface AdminExamAssignmentListResponse {
  items: AdminExamAssignment[];
}

export interface AdminExamSession {
  id: number;
  exam_snapshot_id: number;
  user_id: number;
  status: ExamSessionStatus;
  started_at?: string;
  submitted_at?: string;
  remaining_seconds?: number;
}

export type AdminExamSessionListResponse = PageResponse<AdminExamSession>;

export interface BatchFailure {
  id: number;
  reason: string;
}

export interface BatchResult {
  success_count: number;
  failed_count: number;
  failures: BatchFailure[];
}

export interface AdminClientEvent {
  id: number;
  exam_id: number;
  user_id: number;
  device_id?: string;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export type AdminClientEventPageResponse = PageResponse<AdminClientEvent>;

export interface SaveExamPayload {
  title: string;
  description: string;
  paper_id?: number | null;
  status: ExamStatus;
  duration_minutes: number;
}

export interface PublishExamPayload {
  start_time: string;
  end_time: string;
  duration_minutes: number;
}

export type AdminExamPageResponse = PageResponse<AdminExam>;

export type AdminExamResultStatus = "GRADED" | "JUDGING" | "MANUAL_REQUIRED";

export interface AdminQuestionResult {
  id: number;
  section_snapshot_id: number;
  question_snapshot_id: number;
  question_id: number;
  type: QuestionType;
  sort_order: number;
  question_sort_order: number;
  answer?: Record<string, unknown>;
  status: QuestionResultStatus;
  score: number;
  max_score: number;
  result?: Record<string, unknown>;
  submission_id?: number;
  judged_at?: string;
}

export interface AdminExamResultSection {
  section_snapshot_id: number;
  title: string;
  description?: string;
  sort_order: number;
  score: number;
  max_score: number;
  question_count: number;
  questions?: AdminQuestionResult[];
}

export interface AdminExamResult {
  id: number;
  exam_id: number;
  exam_snapshot_id: number;
  exam_session_id: number;
  user_id: number;
  status: AdminExamResultStatus;
  score: number;
  max_score: number;
  submitted_at: string;
  graded_at?: string;
  sections?: AdminExamResultSection[];
  questions?: AdminQuestionResult[];
}

export type AdminExamResultPageResponse = PageResponse<AdminExamResult>;

export interface AdminJudgeTask {
  id: number;
  submission_id: number;
  question_id: number;
  user_id: number;
  language: string;
  status: JudgeStatus;
  retry_count: number;
  max_retry_count: number;
  error_message?: string;
  result_summary?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  started_at?: string;
  finished_at?: string;
}

export type AdminJudgeTaskPageResponse = PageResponse<AdminJudgeTask>;

// =====================================================================
// M1: Candidate-facing types (excludes answer and hidden test cases)
// =====================================================================

/** Candidate exam snapshot metadata */
export interface ExamSnapshot {
  id: number;
  exam_id: number;
  paper_snapshot_id: number;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  published_at: string;
}

export interface CandidateExamItem {
  id: number;
  title: string;
  status: ExamSessionStatus;
}

export interface CandidateExamList {
  items: CandidateExamItem[];
}

/** Candidate exam session */
export interface ExamSession {
  id: number;
  exam_snapshot_id: number;
  user_id: number;
  status: ExamSessionStatus;
  started_at?: string;
  submitted_at?: string;
  remaining_seconds?: number;
}

/** Candidate-facing exam paper (API response) */
export interface CandidatePaper {
  exam_snapshot_id: number;
  title: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  remaining_seconds: number;
  sections?: CandidatePaperSection[];
  questions: CandidateQuestion[];
}

export interface CandidatePaperSection {
  snapshot_id: number;
  title: string;
  description: string;
  sort_order: number;
  question_count: number;
  total_score: number;
  questions: CandidateQuestion[];
}

/** Candidate-facing question snapshot */
export interface CandidateQuestion {
  snapshot_id: number;
  question_id?: number;
  type: QuestionType;
  title: string;
  content: Record<string, unknown>;
  score: number;
  sort_order: number;
  sample_test_cases?: SampleTestCase[];
  starter_code?: string;
  time_limit_ms: number;
}

/** Sample test case for programming questions only */
export interface SampleTestCase {
  input: string;
  expected_output: string;
}

/** Candidate submission for objective questions */
export interface CandidateSubmission {
  exam_id: number;
  question_id: number;
  answer: Record<string, unknown>;
}

/** Programming submission */
export interface ProgrammingSubmission {
  exam_id: number;
  question_id: number;
  code: string;
  language: string;
}

export interface SaveAnswersPayload {
  answers: Record<string, Record<string, unknown>>;
}

export interface CreateSubmissionPayload {
  exam_id: number;
  question_id: number;
  answer?: Record<string, unknown>;
  code?: string;
  language?: string;
}

export interface SubmissionRecord {
  id: number;
  exam_id: number;
  user_id: number;
  question_id: number;
  answer?: Record<string, unknown>;
  code?: string;
  language?: string;
  status: SubmissionStatus;
  score: number;
  result?: Record<string, unknown>;
  submitted_at: string;
  judged_at?: string;
}

export interface CreatedSubmission {
  submission: SubmissionRecord;
}

export type ExamResultStatus = "GRADED" | "JUDGING" | "MANUAL_REQUIRED";

export type QuestionResultStatus =
  | "CORRECT"
  | "INCORRECT"
  | "UNANSWERED"
  | "JUDGING"
  | "MANUAL_REQUIRED"
  | JudgeStatus;

export interface ExamResult {
  id: number;
  exam_id: number;
  exam_snapshot_id: number;
  exam_session_id: number;
  user_id: number;
  status: ExamResultStatus;
  score: number;
  max_score: number;
  submitted_at: string;
  graded_at?: string;
  sections?: ExamResultSection[];
  questions?: QuestionResult[];
}

export interface ExamResultSection {
  section_snapshot_id: number;
  title: string;
  description?: string;
  sort_order: number;
  score: number;
  max_score: number;
  question_count: number;
  questions?: QuestionResult[];
}

export interface QuestionResult {
  id: number;
  section_snapshot_id: number;
  question_snapshot_id: number;
  question_id: number;
  type: QuestionType;
  sort_order: number;
  question_sort_order: number;
  answer?: Record<string, unknown>;
  status: QuestionResultStatus;
  score: number;
  max_score: number;
  result?: Record<string, unknown>;
  submission_id?: number;
  judged_at?: string;
}
