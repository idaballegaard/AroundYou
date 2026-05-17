import { NextFunction, Request, Response } from "express";

type RateLimitOptions = {
  windowMs: number;
  maxRequests: number;
  message?: string;
  keyPrefix?: string;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

function getClientKey(req: Request): string {
  return req.user?.userID ?? req.ip ?? req.socket.remoteAddress ?? "unknown";
}

export function createRateLimiter(options: RateLimitOptions) {
  // This limiter is process-local. Use a shared store before running multiple
  // backend instances behind a load balancer.
  const entries = new Map<string, RateLimitEntry>();
  const message = options.message ?? "Too many requests. Please try again later.";
  const keyPrefix = options.keyPrefix ?? "default";

  const cleanup = setInterval(() => {
    const now = Date.now();

    for (const [key, entry] of entries.entries()) {
      if (entry.resetAt <= now) {
        entries.delete(key);
      }
    }
  }, options.windowMs);

  // Do not keep the Node process alive only for the cleanup timer.
  cleanup.unref();

  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const key = `${keyPrefix}:${getClientKey(req)}`;
    const current = entries.get(key);

    if (!current || current.resetAt <= now) {
      entries.set(key, {
        count: 1,
        resetAt: now + options.windowMs,
      });
      next();
      return;
    }

    current.count += 1;

    res.setHeader("RateLimit-Limit", String(options.maxRequests));
    res.setHeader("RateLimit-Remaining", String(Math.max(options.maxRequests - current.count, 0)));
    res.setHeader("RateLimit-Reset", String(Math.ceil(current.resetAt / 1000)));

    if (current.count > options.maxRequests) {
      res.setHeader("Retry-After", String(Math.ceil((current.resetAt - now) / 1000)));
      res.status(429).json({ message });
      return;
    }

    next();
  };
}

export const authRateLimiter = createRateLimiter({
  keyPrefix: "auth",
  windowMs: 15 * 60 * 1000,
  maxRequests: 30,
  message: "For mange login- eller registreringsforsøg. Prøv igen senere.",
});

export const uploadRateLimiter = createRateLimiter({
  keyPrefix: "upload",
  windowMs: 10 * 60 * 1000,
  maxRequests: 40,
  message: "For mange billeduploads. Prøv igen senere.",
});

export const contentWriteRateLimiter = createRateLimiter({
  keyPrefix: "content-write",
  windowMs: 10 * 60 * 1000,
  maxRequests: 80,
});

export const contactRateLimiter = createRateLimiter({
  keyPrefix: "contact",
  windowMs: 10 * 60 * 1000,
  maxRequests: 30,
  message: "For mange henvendelser. Prøv igen senere.",
});

export const reviewRateLimiter = createRateLimiter({
  keyPrefix: "review",
  windowMs: 5 * 60 * 1000,
  maxRequests: 80,
});

export const adminMutationRateLimiter = createRateLimiter({
  keyPrefix: "admin-mutation",
  windowMs: 10 * 60 * 1000,
  maxRequests: 300,
});
