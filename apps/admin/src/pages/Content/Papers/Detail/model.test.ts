import {
  buildPaperPreviewSummary,
  moveQuestionWithinSection,
  normalizeSections,
  type PaperSectionState,
} from './model';

const sections: PaperSectionState[] = [
  {
    client_id: 'section-a',
    title: 'Section A',
    sort_order: 1,
    questions: [
      { question_id: 1, score: 5, sort_order: 1 },
      { question_id: 2, score: 5, sort_order: 2 },
    ],
  },
  {
    client_id: 'section-b',
    title: 'Section B',
    sort_order: 2,
    questions: [{ question_id: 3, score: 5, sort_order: 1 }],
  },
];

describe('paper detail model', () => {
  test('moves questions within a section by target index', () => {
    const next = moveQuestionWithinSection(sections, {
      sectionKey: 'section-a',
      questionID: 1,
      toIndex: 1,
    });

    expect(next[0].questions.map((item) => item.question_id)).toEqual([2, 1]);
    expect(next[0].questions.map((item) => item.sort_order)).toEqual([1, 2]);
  });

  test('normalizes section and question order from persisted data', () => {
    const next = normalizeSections([
      { ...sections[1], sort_order: 20 },
      { ...sections[0], sort_order: 10 },
    ]);

    expect(next.map((section) => section.client_id)).toEqual([
      'section-a',
      'section-b',
    ]);
    expect(next[0].questions.map((item) => item.sort_order)).toEqual([1, 2]);
  });

  test('blocks publish preview when paper has no questions', () => {
    const summary = buildPaperPreviewSummary([
      { client_id: 'section-empty', title: 'Empty', sort_order: 1, questions: [] },
    ]);

    expect(summary.canPublish).toBe(false);
    expect(summary.hasNoQuestions).toBe(true);
    expect(summary.questionCount).toBe(0);
    expect(summary.emptySections).toHaveLength(1);
  });

  test('blocks publish preview when questions are unpublished or zero score', () => {
    const summary = buildPaperPreviewSummary([
      {
        client_id: 'section-a',
        title: 'Section A',
        sort_order: 1,
        questions: [
          {
            question_id: 1,
            score: 5,
            sort_order: 1,
            status: 'DRAFT',
          },
          {
            question_id: 2,
            score: 0,
            sort_order: 2,
            status: 'PUBLISHED',
          },
        ],
      },
    ]);

    expect(summary.canPublish).toBe(false);
    expect(summary.unpublishedQuestions.map((item) => item.question_id)).toEqual([1]);
    expect(summary.zeroScoreQuestions.map((item) => item.question_id)).toEqual([2]);
  });

  test('allows publish preview for published questions with positive score', () => {
    const summary = buildPaperPreviewSummary([
      {
        client_id: 'section-a',
        title: 'Section A',
        sort_order: 1,
        questions: [
          {
            question_id: 1,
            score: 5,
            sort_order: 1,
            status: 'PUBLISHED',
          },
        ],
      },
    ]);

    expect(summary.canPublish).toBe(true);
    expect(summary.hasNoQuestions).toBe(false);
    expect(summary.sectionCount).toBe(1);
    expect(summary.questionCount).toBe(1);
    expect(summary.totalScore).toBe(5);
  });
});
