import {
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
});
