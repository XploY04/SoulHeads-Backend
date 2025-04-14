const { redisClient } = require('../utils/redis');

/**
 * Rate limiter middleware using Redis
 * @param {number} maxRequests - Maximum requests allowed in the time window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Function} Express middleware
 */
const rateLimiter = (maxRequests = 100, windowMs = 60 * 1000) => {
  return async (req, res, next) => {
    try {
      // Get client IP or user ID as identifier
      const identifier = req.user ? req.user._id.toString() : req.ip;
      const key = `rateLimit:${identifier}`;
      
      // Get current count from Redis
      const currentCount = await redisClient.get(key) || 0;
      
      // Check if limit is exceeded
      if (parseInt(currentCount) >= maxRequests) {
        return res.status(429).json({ 
          message: 'Too many requests, please try again later'
        });
      }
      
      // First request: set value and expiry
      if (currentCount === 0) {
        await redisClient.set(key, 1, 'EX', Math.floor(windowMs / 1000));
      } else {
        // Increment counter
        await redisClient.incr(key);
      }
      
      // Set headers to inform client about rate limiting
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', maxRequests - parseInt(currentCount) - 1);
      
      next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      // Don't block the request if Redis fails
      next();
    }
  };
};

module.exports = rateLimiter;