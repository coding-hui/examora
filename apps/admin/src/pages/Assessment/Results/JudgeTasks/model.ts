import type { AdminJudgeTask, JudgeStatus } from '@examora/types';

export const summarizeJudgeTask = (
  task: Pick<AdminJudgeTask, 'error_message' | 'result_summary'>,
) => {
  if (task.error_message) return task.error_message;
  if (!task.result_summary) return '-';
  const parts = Object.entries(task.result_summary).map(
    ([key, value]) => `${key}: ${String(value)}`,
  );
  return parts.length > 0 ? parts.join(', ') : '-';
};

export const judgeTaskDurationLabel = (
  task: Pick<AdminJudgeTask, 'started_at' | 'finished_at'>,
) => {
  if (!task.started_at || !task.finished_at) return '-';
  const durationMS =
    new Date(task.finished_at).getTime() - new Date(task.started_at).getTime();
  if (!Number.isFinite(durationMS) || durationMS < 0) return '-';
  return `${Math.round(durationMS / 1000)}s`;
};

export const judgeTaskStatusTone = (
  status: JudgeStatus,
): 'success' | 'processing' | 'warning' | 'error' | 'default' => {
  if (status === 'ACCEPTED') return 'success';
  if (status === 'RUNNING' || status === 'QUEUED' || status === 'PENDING') {
    return 'processing';
  }
  if (status === 'CANCELED') return 'warning';
  if (
    status === 'WRONG_ANSWER' ||
    status === 'COMPILE_ERROR' ||
    status === 'RUNTIME_ERROR' ||
    status === 'TIME_LIMIT_EXCEEDED' ||
    status === 'MEMORY_LIMIT_EXCEEDED' ||
    status === 'SYSTEM_ERROR'
  ) {
    return 'error';
  }
  return 'default';
};
