const { redisClient } = require("../utils/redis");
const { errorTypes } = require("../utils/errorHandler");
const logger = require("../utils/logger");

/**
 * Creates a rate limiter middleware
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

  // Window in seconds
  const windowS = Math.ceil(windowMs / 1000);

  return async (req, res, next) => {
    try {
      // Skip rate limiting based on method
      if (skipMethods.includes(req.method)) {
        return next();
      }

      // Skip if Redis client is unavailable
      if (!redisClient || !redisClient.isReady) {
        logger.warn("Rate limiting disabled: Redis client unavailable");
        return next();
      }

      // Generate key based on IP and route or custom generator
      const ip = req.ip || req.connection.remoteAddress || "0.0.0.0";
      const route = req.path || req.originalUrl || req.url;
      const key = keyGenerator
        ? keyGenerator(req)
        : `${keyPrefix}${ip}:${route}`;

      // Use Redis to track requests
      const requestCount = await redisClient.incr(key);

      // Set expiry on first request
      if (requestCount === 1) {
        await redisClient.expire(key, windowS);
      }

      // Add rate limit headers
      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader(
        "X-RateLimit-Remaining",
        Math.max(0, maxRequests - requestCount)
      );

      // Get TTL for the key
      const ttl = await redisClient.ttl(key);
      if (ttl > 0) {
        res.setHeader("X-RateLimit-Reset", Math.ceil(Date.now() / 1000) + ttl);
      }

      // If request count exceeds limit, return error
      if (requestCount > maxRequests) {
        const retryAfter = ttl > 0 ? ttl : windowS;
        res.setHeader("Retry-After", retryAfter);

        if (handler) {
          return handler(req, res, next);
        }

        return next(
          errorTypes.forbidden(
            `Too many requests, please try again after ${Math.ceil(
              retryAfter / 60
            )} minutes`
          )
        );
      }

      // Only count successful responses if configured
      if (skipSuccessfulRequests) {
        // Decrement counter for successful responses
        res.on("finish", async () => {
          if (res.statusCode < 400) {
            await redisClient.decr(key);
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
