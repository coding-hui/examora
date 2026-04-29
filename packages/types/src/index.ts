export type RoleCode = "SUPER_ADMIN" | "TEACHER" | "PROCTOR" | "STUDENT";

export type QuestionType =
  | "SINGLE_CHOICE"
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE"
  | "FILL_BLANK"
  | "SHORT_ANSWER"
  | "PROGRAMMING";

export type ExamStatus = "DRAFT" | "PUBLISHED" | "RUNNING" | "CLOSED" | "ARCHIVED";

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
  id: string;
  type: QuestionType;
  title: string;
  content: string;
  answer: Record<string, unknown> | null;
  difficulty?: string;
  language?: string;
  starterCode?: string;
  timeLimitMs: number;
  memoryLimitMb: number;
  status: string;
  testCases?: AdminTestCase[];
}

export interface AdminTestCase {
  id: string;
  input: string;
  expectedOutput: string;
  timeLimitMs: number;
  memoryLimitMb: number;
  isSample: boolean;
  isHidden: boolean;
  sortOrder: number;
}

// =====================================================================
// M1: Candidate-facing types (excludes answer and hidden test cases)
// =====================================================================

/** Candidate exam snapshot metadata */
export interface ExamSnapshot {
  id: string;
  examId: string;
  paperSnapshotId: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  publishedAt: string;
}

/** Candidate exam session */
export interface ExamSession {
  id: string;
  examSnapshotId: string;
  userId: string;
  status: ExamSessionStatus;
  startedAt?: string;
  submittedAt?: string;
  remainingSeconds?: number;
}

/** Candidate-facing exam paper (API response) */
export interface CandidatePaper {
  examSnapshotId: string;
  title: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  remainingSeconds: number;
  questions: CandidateQuestion[];
}

/** Candidate-facing question snapshot */
export interface CandidateQuestion {
  snapshotId: string;
  type: QuestionType;
  title: string;
  content: Record<string, unknown>;
  score: number;
  sortOrder: number;
  sampleTestCases?: SampleTestCase[];
  starterCode?: string;
  timeLimitMs: number;
}

/** Sample test case for programming questions only */
export interface SampleTestCase {
  input: string;
  expectedOutput: string;
}

/** Candidate submission for objective questions */
export interface CandidateSubmission {
  questionId: string;
  answer: Record<string, unknown>;
}

/** Programming submission */
export interface ProgrammingSubmission {
  questionId: string;
  code: string;
  language: string;
}
