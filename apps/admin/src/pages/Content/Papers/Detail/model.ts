import type { AdminQuestion, QuestionType } from '@examora/types';

export interface PaperQuestion {
  id?: number;
  paper_id?: number;
  section_id?: number;
  question_id: number;
  score: number;
  sort_order: number;
  created_at?: string;
  question?: AdminQuestion;
  title?: string;
  type?: QuestionType;
  difficulty?: string;
}

export interface PaperSectionState {
  client_id: string;
  id?: number;
  paper_id?: number;
  title: string;
  description?: string;
  sort_order: number;
  questions: PaperQuestion[];
}

export const normalizeQuestions = (items: PaperQuestion[]) =>
  [...items]
    .map((item, index) => ({
      ...item,
      score: Number(item.score || 0),
      sort_order: Number.isFinite(item.sort_order)
        ? item.sort_order
        : index + 1,
    }))
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((item, index) => ({ ...item, sort_order: index + 1 }));

export const normalizeSections = (items: PaperSectionState[]) =>
  [...items]
    .map((section, index) => ({
      ...section,
      sort_order: Number.isFinite(section.sort_order)
        ? section.sort_order
        : index + 1,
      questions: normalizeQuestions(section.questions),
    }))
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((section, index) => ({ ...section, sort_order: index + 1 }));

export const moveQuestionWithinSection = (
  sections: PaperSectionState[],
  options: {
    sectionKey: string;
    questionID: number;
    toIndex: number;
  },
) =>
  normalizeSections(
    sections.map((section) => {
      if (section.client_id !== options.sectionKey) return section;
      const oldIndex = section.questions.findIndex(
        (question) => question.question_id === options.questionID,
      );
      if (oldIndex < 0) return section;
      const nextQuestions = [...section.questions];
      const [target] = nextQuestions.splice(oldIndex, 1);
      const insertIndex = Math.max(
        0,
        Math.min(options.toIndex, nextQuestions.length),
      );
      nextQuestions.splice(insertIndex, 0, target);
      return {
        ...section,
        questions: nextQuestions.map((question, index) => ({
          ...question,
          sort_order: index + 1,
        })),
      };
    }),
  );
