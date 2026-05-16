import type { AdminExamResult } from '@examora/types';
import {
  formatScore,
  isResultPending,
  resultProgressPercent,
  resultStatusTone,
} from './model';

describe('submission results model', () => {
  test('formats score against max score', () => {
    expect(formatScore(82.5, 100)).toBe('82.5 / 100');
  });

  test('calculates bounded result progress', () => {
    expect(
      resultProgressPercent({ score: 50, max_score: 100 } as AdminExamResult),
    ).toBe(50);
    expect(
      resultProgressPercent({ score: 150, max_score: 100 } as AdminExamResult),
    ).toBe(100);
    expect(
      resultProgressPercent({ score: 10, max_score: 0 } as AdminExamResult),
    ).toBe(0);
  });

  test('marks judging and manual-required results as pending', () => {
    expect(isResultPending({ status: 'JUDGING' } as AdminExamResult)).toBe(
      true,
    );
    expect(
      isResultPending({ status: 'MANUAL_REQUIRED' } as AdminExamResult),
    ).toBe(true);
    expect(isResultPending({ status: 'GRADED' } as AdminExamResult)).toBe(
      false,
    );
  });

  test('maps result statuses to table tones', () => {
    expect(resultStatusTone('GRADED')).toBe('success');
    expect(resultStatusTone('JUDGING')).toBe('processing');
    expect(resultStatusTone('MANUAL_REQUIRED')).toBe('warning');
  });
});
