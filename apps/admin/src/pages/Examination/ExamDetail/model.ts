import type {
  AdminExam,
  AdminExamSession,
  ExamSessionStatus,
  ExamStatus,
} from '@examora/types';

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

export const examDetailTabKeys = [
  'overview',
  'candidates',
  'results',
  'events',
] as const;

export type ExamDetailTabKey = (typeof examDetailTabKeys)[number];

export const normalizeExamDetailTab = (
  value: string | null | undefined,
): ExamDetailTabKey => {
  if (examDetailTabKeys.includes(value as ExamDetailTabKey)) {
    return value as ExamDetailTabKey;
  }
  return 'overview';
};

export const buildPagedQuery = (page?: number, pageSize?: number) =>
  new URLSearchParams({
    page: String(page || 1),
    page_size: String(pageSize || 20),
  }).toString();

export const examOperationStats = (exam: AdminExam | null) => ({
  snapshotQuestionCount: exam?.snapshot_question_count || 0,
  snapshotTotalScore: exam?.snapshot_total_score || 0,
  candidateCount: exam?.candidate_count || 0,
  submittedCount: exam?.submitted_count || 0,
  resultCount: exam?.result_count || 0,
  auditEventCount: exam?.audit_event_count || 0,
});
