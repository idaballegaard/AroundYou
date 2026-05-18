const GAP = "[^a-z0-9]*";

export const DISALLOWED_LANGUAGE_MESSAGE =
  "Teksten indeholder stødende eller diskriminerende sprog.";

const LEET_REPLACEMENTS: Record<string, string> = {
  "0": "o",
  "1": "i",
  "!": "i",
  "|": "i",
  "3": "e",
  "4": "a",
  "@": "a",
  "5": "s",
  "$": "s",
  "7": "t",
};

const DISALLOWED_LANGUAGE_PATTERNS = [
  new RegExp(`\\bn+${GAP}i+${GAP}g+${GAP}(?:e+${GAP}r+|a+)s?\\b`, "i"),
  new RegExp(`\\bn+${GAP}e+${GAP}g+${GAP}e+${GAP}r+e?\\b`, "i"),
  new RegExp(`\\bp+${GAP}e+${GAP}r+${GAP}k+${GAP}e+${GAP}r+e?\\b`, "i"),
  new RegExp(`\\bf+${GAP}a+${GAP}g+(?:${GAP}o+${GAP}t+)?s?\\b`, "i"),
  new RegExp(`\\br+${GAP}e+${GAP}t+${GAP}a+${GAP}r+${GAP}d+(?:${GAP}e+${GAP}d+)?s?\\b`, "i"),
  new RegExp(`\\bt+${GAP}r+${GAP}a+${GAP}n+${GAP}n+${GAP}y+s?\\b`, "i"),
];

export function normalizeForModeration(value: string): string {
  return Array.from(
    value
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/æ/g, "ae")
      .replace(/ø/g, "o")
      .replace(/å/g, "a")
      .toLowerCase(),
  )
    .map((character) => LEET_REPLACEMENTS[character] ?? character)
    .join("");
}

export function containsDisallowedLanguage(value: string): boolean {
  const normalized = normalizeForModeration(value);
  return DISALLOWED_LANGUAGE_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function assertAllowedLanguage(value: string): void {
  if (!containsDisallowedLanguage(value)) {
    return;
  }

  const error = new Error(DISALLOWED_LANGUAGE_MESSAGE);
  error.name = "ValidationError";
  throw error;
}
