import type { AdminExamSession } from '@examora/types';
import { canRemoveCandidate, examStatusTone, sessionStatusTone } from './model';

describe('ExamDetail model', () => {
  it('maps session statuses to tag tones', () => {
    expect(sessionStatusTone('NOT_STARTED')).toBe('default');
    expect(sessionStatusTone('IN_PROGRESS')).toBe('processing');
    expect(sessionStatusTone('SUBMITTED')).toBe('success');
    expect(sessionStatusTone('EXPIRED')).toBe('warning');
  });

  it('maps exam statuses to tag tones', () => {
    expect(examStatusTone('DRAFT')).toBe('default');
    expect(examStatusTone('PUBLISHED')).toBe('processing');
    expect(examStatusTone('RUNNING')).toBe('success');
    expect(examStatusTone('CLOSED')).toBe('warning');
  });

  it('only allows removing candidates before they start', () => {
    expect(
      canRemoveCandidate({ status: 'NOT_STARTED' } as AdminExamSession),
    ).toBe(true);
    expect(
      canRemoveCandidate({ status: 'IN_PROGRESS' } as AdminExamSession),
    ).toBe(false);
  });
});
