import type { AdminExam, AdminPaper } from '@examora/types';
import { buildExamPayload, canEditExam, paperOptionLabel } from './model';

const paper: AdminPaper = {
  id: 7,
  title: 'Backend Basics',
  description: 'Backend exam paper',
  status: 'PUBLISHED',
  created_by: 1,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  question_count: 12,
  total_score: 100,
};

describe('exam form model', () => {
  test('builds a draft exam payload with the selected paper', () => {
    expect(
      buildExamPayload({
        title: '  Midterm Exam  ',
        description: '  Chapter 1-3  ',
        paper_id: 7,
        duration_minutes: 90,
      }),
    ).toEqual({
      title: 'Midterm Exam',
      description: 'Chapter 1-3',
      paper_id: 7,
      status: 'DRAFT',
      duration_minutes: 90,
    });
  });

  test('formats paper option labels with count and score', () => {
    expect(paperOptionLabel(paper)).toBe('Backend Basics - 12 questions / 100 pts');
  });

  test('allows editing only draft exams', () => {
    const draft = { status: 'DRAFT' } as AdminExam;
    const published = { status: 'PUBLISHED' } as AdminExam;

    expect(canEditExam(draft)).toBe(true);
    expect(canEditExam(published)).toBe(false);
  });
});
