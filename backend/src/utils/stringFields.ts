// Extracts and trims string fields from dynamic payload objects.
export function pickTrimmedStringFields(
  payload: Record<string, unknown>,
  keys: readonly string[],
): Record<string, string> {
  const result: Record<string, string> = {};

  keys.forEach((key) => {
    const value = payload[key];

    if (typeof value === "string") {
      result[key] = value.trim();
    }
  });

  return result;
}
