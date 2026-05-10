export type RoleCode = "SUPER_ADMIN" | "TEACHER" | "PROCTOR" | "STUDENT";

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

export type ExamSessionStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "EXPIRED";

export type SubmissionStatus =
  | "PENDING"
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
  questions: CandidateQuestion[];
}

/** Candidate-facing question snapshot */
export interface CandidateQuestion {
  snapshot_id: number;
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
  question_id: number;
  answer: Record<string, unknown>;
}

/** Programming submission */
export interface ProgrammingSubmission {
  question_id: number;
  code: string;
  language: string;
}
