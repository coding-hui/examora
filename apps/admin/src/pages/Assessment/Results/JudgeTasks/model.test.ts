import {
  judgeTaskDurationLabel,
  judgeTaskStatusTone,
  summarizeJudgeTask,
} from './model';

describe('judge task model', () => {
  test('summarizes failed tasks with error messages first', () => {
    const task = {
      error_message: 'sandbox unavailable',
      result_summary: { passed: 2, total: 5 },
    };

    expect(summarizeJudgeTask(task)).toBe('sandbox unavailable');
  });

  test('summarizes result summary when no error exists', () => {
    const task = {
      result_summary: { passed: 2, total: 5, score: 40 },
    };

    expect(summarizeJudgeTask(task)).toBe('passed: 2, total: 5, score: 40');
  });

  test('calculates task duration labels', () => {
    const task = {
      started_at: '2026-01-01T00:00:00Z',
      finished_at: '2026-01-01T00:00:03Z',
    };

    expect(judgeTaskDurationLabel(task)).toBe('3s');
  });

  test('maps judge statuses to table tones', () => {
    expect(judgeTaskStatusTone('ACCEPTED')).toBe('success');
    expect(judgeTaskStatusTone('RUNNING')).toBe('processing');
    expect(judgeTaskStatusTone('SYSTEM_ERROR')).toBe('error');
  });
});
