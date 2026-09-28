export function getMypageFilterSelectionKey(
  controlIds: readonly string[],
  values: Readonly<Record<string, string>>,
): string {
  return controlIds
    .map(id => `${encodeURIComponent(id)}=${encodeURIComponent(values[id] ?? '')}`)
    .join('&');
}
