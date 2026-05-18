import { Request, Response } from "express";
export { getHideUpdate, getRestoreUpdate, normalizeSlug } from "../utils/resourceUtils";

export function getRouteParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export function visibleFilter(req: Request): Record<string, unknown> {
  // Public endpoints never expose soft-deleted records. Admin endpoints can
  // explicitly request hidden/all records for moderation screens.
  if (!req.originalUrl.startsWith("/api/admin/")) {
    return { isHidden: { $ne: true } };
  }

  if (req.query.visibility === "hidden") {
    return { isHidden: true };
  }

  if (req.query.visibility === "all") {
    return {};
  }

  return { isHidden: { $ne: true } };
}

export function isValidationError(error: unknown): error is Error {
  return error instanceof Error && error.name === "ValidationError";
}

export function sendCreateError(
  res: Response,
  error: unknown,
  fallbackMessage: string,
): void {
  if (isValidationError(error)) {
    res.status(400).json({ message: error.message });
    return;
  }

  res.status(500).json({ message: fallbackMessage });
}
