export function optionalString(
  source: Record<string, unknown>,
  key: string,
): string | undefined {
  // Keep optional string parsing small and explicit for API mappers that accept
  // unknown JSON payloads.
  const value = source[key]
  return typeof value === 'string' ? value : undefined
}
