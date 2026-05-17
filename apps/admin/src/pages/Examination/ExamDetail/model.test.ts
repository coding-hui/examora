import type { AdminExamSession } from '@examora/types';
import {
  buildPagedQuery,
  canRemoveCandidate,
  examOperationStats,
  examStatusTone,
  normalizeExamDetailTab,
  sessionStatusTone,
} from './model';

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

  it('normalizes detail tab query values', () => {
    expect(normalizeExamDetailTab('results')).toBe('results');
    expect(normalizeExamDetailTab('bad')).toBe('overview');
    expect(normalizeExamDetailTab(null)).toBe('overview');
  });

  it('builds paged table query strings', () => {
    expect(buildPagedQuery(2, 50)).toBe('page=2&page_size=50');
    expect(buildPagedQuery(undefined, undefined)).toBe('page=1&page_size=20');
  });

  it('defaults missing operation stats to zero', () => {
    expect(examOperationStats(null)).toEqual({
      snapshotQuestionCount: 0,
      snapshotTotalScore: 0,
      candidateCount: 0,
      submittedCount: 0,
      resultCount: 0,
      auditEventCount: 0,
    });
  });
});
