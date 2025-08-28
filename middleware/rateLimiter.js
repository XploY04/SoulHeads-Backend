const logger = require("../utils/logger");

// In-memory store for rate limiting (since Redis is removed)
const requestStore = new Map();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  const cutoff = now - 60 * 60 * 1000; // 1 hour ago

  for (const [key, entry] of requestStore.entries()) {
    if (entry.firstRequest < cutoff) {
      requestStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean every 5 minutes

/**
 * Creates a rate limiter middleware using in-memory storage
 * @param {number} maxRequests - Max number of requests allowed in the window
 * @param {number} windowMs - Time window in milliseconds
 * @param {Object} options - Additional options
 * @returns {Function} Express middleware function
 */
const createRateLimiter = (maxRequests, windowMs, options = {}) => {
  const {
    skipSuccessfulRequests = false,
    keyPrefix = "ratelimit:",
    handler = null,
    skipMethods = ["OPTIONS"],
    keyGenerator = null,
  } = options;

  return async (req, res, next) => {
    try {
      // Skip rate limiting based on method
      if (skipMethods.includes(req.method)) {
        return next();
      }

      // Generate key based on IP and route or custom generator
      const ip = req.ip || req.connection.remoteAddress || "0.0.0.0";
      const route = req.path || req.originalUrl || req.url;
      const key = keyGenerator
        ? keyGenerator(req)
        : `${keyPrefix}${ip}:${route}`;

      const now = Date.now();
      const windowStart = now - windowMs;

      // Get or create entry for this key
      let entry = requestStore.get(key);
      if (!entry) {
        entry = { requests: [], firstRequest: now };
        requestStore.set(key, entry);
      }

      // Remove old requests outside the window
      entry.requests = entry.requests.filter(
        (timestamp) => timestamp > windowStart
      );

      // Add rate limit headers
      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader(
        "X-RateLimit-Remaining",
        Math.max(0, maxRequests - entry.requests.length)
      );

      // Calculate reset time
      const oldestRequest = entry.requests[0];
      if (oldestRequest) {
        const resetTime = Math.ceil((oldestRequest + windowMs) / 1000);
        res.setHeader("X-RateLimit-Reset", resetTime);
      }

      // Check if limit exceeded
      if (entry.requests.length >= maxRequests) {
        const retryAfter = Math.ceil(windowMs / 1000);
        res.setHeader("Retry-After", retryAfter);

        if (handler) {
          return handler(req, res, next);
        }

        return res.status(429).json({
          message: `Too many requests, please try again after ${Math.ceil(
            retryAfter / 60
          )} minutes`,
          retryAfter,
        });
      }

      // Add current request to the list
      entry.requests.push(now);

      // Only count successful responses if configured
      if (skipSuccessfulRequests) {
        // Remove current request for successful responses
        res.on("finish", () => {
          if (res.statusCode < 400) {
            const index = entry.requests.indexOf(now);
            if (index > -1) {
              entry.requests.splice(index, 1);
            }
          }
        });
      }

      next();
    } catch (err) {
      logger.error("Rate limiter error:", { error: err.message });
      // Continue without rate limiting if there's an error
      next();
    }
  };
};

/**
 * Middleware factory for different rate limiters
 */
const rateLimiter = {
  // General API rate limiter
  standard: (maxRequests = 60, windowMs = 60000) =>
    createRateLimiter(maxRequests, windowMs),

  // Auth endpoints - more strict
  auth: () =>
    createRateLimiter(20, 60000, {
      keyPrefix: "ratelimit:auth:",
      keyGenerator: (req) => `ratelimit:auth:${req.ip}:${req.path}`,
    }),

  // Search endpoints - less strict
  search: () =>
    createRateLimiter(120, 60000, {
      keyPrefix: "ratelimit:search:",
      skipSuccessfulRequests: true,
    }),
};

module.exports = rateLimiter;
