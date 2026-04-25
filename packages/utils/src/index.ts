export function formatIsoDate(value: string): string {
  return new Date(value).toLocaleString();
}
