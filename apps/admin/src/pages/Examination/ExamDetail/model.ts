import type {
  AdminExamSession,
  ExamSessionStatus,
  ExamStatus,
} from '@examora/types';

export const examDetailPath = (examID: number | string) =>
  `/api/v1/exams/${examID}`;

export const examSessionsPath = (examID: number | string) =>
  `/api/v1/exams/${examID}/sessions`;

export const examCandidatesPath = (examID: number | string) =>
  `/api/v1/exams/${examID}/candidates`;

export const examCandidatePath = (
  examID: number | string,
  userID: number | string,
) => `/api/v1/exams/${examID}/candidates/${userID}`;

export const examAssignmentsPath = (examID: number | string) =>
  `/api/v1/exams/${examID}/assignments`;

export const examEventsPath = (examID: number | string) =>
  `/api/v1/exams/${examID}/events`;

export const examResultsPath = (examID: number | string) =>
  `/api/v1/exams/${examID}/results`;

export const examResultPath = (resultID: number | string) =>
  `/api/v1/exam-results/${resultID}`;

export const sessionStatusTone = (
  status: ExamSessionStatus,
): 'default' | 'processing' | 'success' | 'warning' => {
  if (status === 'IN_PROGRESS') return 'processing';
  if (status === 'SUBMITTED') return 'success';
  if (status === 'EXPIRED') return 'warning';
  return 'default';
};

export const examStatusTone = (
  status: ExamStatus,
): 'default' | 'processing' | 'success' | 'warning' => {
  if (status === 'PUBLISHED') return 'processing';
  if (status === 'RUNNING') return 'success';
  if (status === 'CLOSED' || status === 'ARCHIVED') return 'warning';
  return 'default';
};

export const canRemoveCandidate = (session: Pick<AdminExamSession, 'status'>) =>
  session.status === 'NOT_STARTED';
