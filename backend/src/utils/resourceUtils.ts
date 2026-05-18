export function getHideUpdate(hiddenBy?: string): Record<string, unknown> {
  return {
    isHidden: true,
    hiddenAt: new Date(),
    hiddenBy,
  };
}

export function getRestoreUpdate(): Record<string, unknown> {
  return {
    isHidden: false,
    $unset: { hiddenAt: "", hiddenBy: "" },
  };
}

export function normalizeSlug(value: string): string {
  // Danish characters are normalized to route-safe ASCII slugs so old URLs and
  // frontend-generated slugs resolve consistently.
  return value
    .toLowerCase()
    .replace(/æ/g, "a")
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
