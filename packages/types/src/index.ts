export type RoleCode = "SUPER_ADMIN" | "TEACHER" | "PROCTOR" | "STUDENT";

export type QuestionType =
  | "SINGLE_CHOICE"
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE"
  | "FILL_BLANK"
  | "SHORT_ANSWER"
  | "PROGRAMMING";

export type ExamStatus = "DRAFT" | "PUBLISHED" | "ONGOING" | "ENDED" | "CANCELLED";

export type ExamSessionStatus =
  | "NOT_STARTED"
  | "ONGOING"
  | "SUBMITTED"
  | "EXPIRED"
  | "CANCELLED";

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

/** Admin-facing question — includes scoring answer (never send to candidate) */
export interface AdminQuestion {
  id: number;
  subjectId: number;
  type: QuestionType;
  title: string;
  content: string;
  score: number;
  config: Record<string, unknown>;
  answer: Record<string, unknown> | null;
  status: string;
}

/** Candidate-facing question snapshot — excludes answer and hidden test cases */
export interface QuestionSnapshot {
  questionSnapshotId: number;
  questionId: number;
  type: QuestionType;
  title: string;
  content: string;
  score: number;
  config: Record<string, unknown>;
}

/** Candidate-facing exam paper */
export interface ExamPaper {
  sessionId: number;
  exam: {
    id: number;
    title: string;
    remainingSeconds: number;
  };
  questions: QuestionSnapshot[];
}
