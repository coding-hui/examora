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

export interface AdminQuestionDto {
  id: number;
  subjectId: number;
  type: QuestionType;
  title: string;
  content: string;
  score: number;
  configJson: Record<string, unknown>;
  answerJson: Record<string, unknown> | null;
  status: string;
}

export interface CandidateQuestionSnapshotDto {
  questionSnapshotId: number;
  questionId: number;
  type: QuestionType;
  title: string;
  content: string;
  score: number;
  config: Record<string, unknown>;
}

export interface CandidateExamPaperDto {
  sessionId: number;
  exam: {
    id: number;
    title: string;
    remainingSeconds: number;
  };
  questions: CandidateQuestionSnapshotDto[];
}
