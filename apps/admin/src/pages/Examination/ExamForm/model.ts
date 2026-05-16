import type { AdminExam, AdminPaper, SaveExamPayload } from '@examora/types';

export interface ExamFormValues {
  title: string;
  description?: string;
  paper_id: number;
  duration_minutes: number;
}

export const buildExamPayload = (values: ExamFormValues): SaveExamPayload => ({
  title: values.title.trim(),
  description: (values.description || '').trim(),
  paper_id: values.paper_id,
  status: 'DRAFT',
  duration_minutes: values.duration_minutes,
});

export const paperOptionLabel = (paper: AdminPaper) => {
  const questionCount = paper.question_count ?? 0;
  const totalScore = paper.total_score ?? 0;
  return `${paper.title} - ${questionCount} questions / ${totalScore} pts`;
};

export const canEditExam = (exam?: Pick<AdminExam, 'status'> | null) =>
  !exam || exam.status === 'DRAFT';
