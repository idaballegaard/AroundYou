"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMutationRateLimiter = exports.reviewRateLimiter = exports.contactRateLimiter = exports.contentWriteRateLimiter = exports.uploadRateLimiter = exports.authRateLimiter = void 0;
exports.createRateLimiter = createRateLimiter;
function getClientKey(req) {
    var _a, _b, _c, _d;
    // Authenticated requests are limited per user; anonymous requests fall back to
    // network identity.
    return (_d = (_c = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userID) !== null && _b !== void 0 ? _b : req.ip) !== null && _c !== void 0 ? _c : req.socket.remoteAddress) !== null && _d !== void 0 ? _d : "unknown";
}
function createRateLimiter(options) {
    var _a, _b;
    // This limiter is process-local. Use a shared store before running multiple
    // backend instances behind a load balancer.
    const entries = new Map();
    const message = (_a = options.message) !== null && _a !== void 0 ? _a : "Too many requests. Please try again later.";
    const keyPrefix = (_b = options.keyPrefix) !== null && _b !== void 0 ? _b : "default";
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
    return (req, res, next) => {
        const now = Date.now();
        const key = `${keyPrefix}:${getClientKey(req)}`;
        const current = entries.get(key);
        if (!current || current.resetAt <= now) {
            // Start a fresh fixed window for new keys and expired entries.
            entries.set(key, {
                count: 1,
                resetAt: now + options.windowMs,
            });
            next();
            return;
        }
        current.count += 1;
        // Expose standard-ish rate limit headers so clients can surface better
        // retry messages if needed.
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
exports.authRateLimiter = createRateLimiter({
    keyPrefix: "auth",
    windowMs: 15 * 60 * 1000,
    maxRequests: 30,
    message: "For mange login- eller registreringsforsøg. Prøv igen senere.",
});
exports.uploadRateLimiter = createRateLimiter({
    keyPrefix: "upload",
    windowMs: 10 * 60 * 1000,
    maxRequests: 40,
    message: "For mange billeduploads. Prøv igen senere.",
});
exports.contentWriteRateLimiter = createRateLimiter({
    keyPrefix: "content-write",
    windowMs: 10 * 60 * 1000,
    maxRequests: 80,
});
exports.contactRateLimiter = createRateLimiter({
    keyPrefix: "contact",
    windowMs: 10 * 60 * 1000,
    maxRequests: 30,
    message: "For mange henvendelser. Prøv igen senere.",
});
exports.reviewRateLimiter = createRateLimiter({
    keyPrefix: "review",
    windowMs: 5 * 60 * 1000,
    maxRequests: 80,
});
exports.adminMutationRateLimiter = createRateLimiter({
    keyPrefix: "admin-mutation",
    windowMs: 10 * 60 * 1000,
    maxRequests: 300,
});
//# sourceMappingURL=rateLimit.js.map