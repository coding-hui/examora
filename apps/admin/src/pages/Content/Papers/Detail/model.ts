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
  status?: string;
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

const questionStatus = (question: PaperQuestion) =>
  question.question?.status ?? question.status;

export const buildPaperPreviewSummary = (sections: PaperSectionState[]) => {
  const sectionCount = sections.length;
  const questionCount = sections.reduce(
    (total, section) => total + section.questions.length,
    0,
  );
  const totalScore = sections.reduce(
    (total, section) =>
      total +
      section.questions.reduce(
        (score, question) => score + Number(question.score || 0),
        0,
      ),
    0,
  );
  const unpublishedQuestions = sections.flatMap((section) =>
    section.questions.filter((question) => {
      const status = questionStatus(question);
      return status !== 'PUBLISHED';
    }),
  );
  const zeroScoreQuestions = sections.flatMap((section) =>
    section.questions.filter((question) => Number(question.score || 0) <= 0),
  );
  const emptySections = sections.filter(
    (section) => section.questions.length === 0,
  );
  const hasNoQuestions = questionCount === 0;

  return {
    sectionCount,
    questionCount,
    totalScore,
    hasNoQuestions,
    unpublishedQuestions,
    zeroScoreQuestions,
    emptySections,
    canPublish:
      !hasNoQuestions &&
      totalScore > 0 &&
      unpublishedQuestions.length === 0 &&
      zeroScoreQuestions.length === 0,
  };
};
