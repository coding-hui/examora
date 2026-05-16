import type { AdminExamResult, AdminExamResultStatus } from '@examora/types';

export const formatScore = (score: number, maxScore: number) =>
  `${Number(score.toFixed(2))} / ${Number(maxScore.toFixed(2))}`;

export const resultProgressPercent = (
  result: Pick<AdminExamResult, 'score' | 'max_score'>,
) => {
  if (result.max_score <= 0) return 0;
  return Math.max(
    0,
    Math.min(100, Math.round((result.score / result.max_score) * 100)),
  );
};

export const isResultPending = (result: Pick<AdminExamResult, 'status'>) =>
  result.status === 'JUDGING' || result.status === 'MANUAL_REQUIRED';

export const resultStatusTone = (
  status: AdminExamResultStatus,
): 'success' | 'processing' | 'warning' | 'default' => {
  if (status === 'GRADED') return 'success';
  if (status === 'JUDGING') return 'processing';
  if (status === 'MANUAL_REQUIRED') return 'warning';
  return 'default';
};
