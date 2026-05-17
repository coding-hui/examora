import routes from './routes';

const flattenPaths = (items: any[]): string[] =>
  items.flatMap((item) => [
    item.path,
    ...(item.routes ? flattenPaths(item.routes) : []),
  ]);

describe('admin routes', () => {
  test('does not keep legacy redirect routes after full migration', () => {
    const paths = flattenPaths(routes).filter(Boolean);

    expect(paths).not.toContain('/admin/exams');
    expect(paths).not.toContain('/admin/exam/:id/publish');
    expect(paths).not.toContain('/admin/exam/create');
    expect(paths).not.toContain('/monitoring');
    expect(paths).not.toContain('/monitoring/proctoring');
    expect(paths).not.toContain('/monitoring/proctoring/events');
    expect(paths).not.toContain('/assessment');
    expect(paths).not.toContain('/assessment/results');
    expect(paths).not.toContain('/assessment/results/submissions');
    expect(paths).not.toContain('/assessment/results/judge-tasks');
    expect(paths).not.toContain('/examination/candidates');
  });

  test('keeps an explicit not found fallback route', () => {
    const paths = flattenPaths(routes).filter(Boolean);

    expect(paths).toContain('*');
    expect(paths).not.toContain('./*');
  });
});
