export const requestErrorMessage = (error: unknown) =>
  (error as { info?: { errorMessage?: string } })?.info?.errorMessage;

export const proTableSortParams = (
  sort: Record<string, 'ascend' | 'descend' | null | undefined>,
  defaultField = 'updated_at',
) => {
  const sortField = Object.keys(sort)[0] || defaultField;
  return {
    sort_field: sortField,
    sort_order: sort[sortField] === 'ascend' ? 'asc' : 'desc',
  };
};
