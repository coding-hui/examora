import type {
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
