const Redis = require("ioredis");
require("dotenv").config();

// Initialize Redis client with Upstash configuration using the connection URL directly
const initRedisClient = () => {
  try {
    // Get Redis URL from environment variables
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      console.error("Redis URL not found in environment variables");
      return null;
    }

    const redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError(err) {
        // Only reconnect on specific errors
        const targetError = "READONLY";
        if (err.message.includes(targetError)) {
          return true; // Reconnect
        }
      },
    });

    redis.on("connect", () => {
      console.log("Connected to Upstash Redis");
    });

    redis.on("error", (error) => {
      console.error("Redis Error:", error);
    });

    redis.on("ready", () => {
      console.log("Redis client ready");
    });

    redis.on("reconnecting", () => {
      console.log("Redis client reconnecting");
    });

    return redis;
  } catch (error) {
    console.error("Redis initialization error:", error);
    throw error;
  }
};

// Cache helper functions
const redisClient = initRedisClient();

// Set data in Redis cache with expiration time
const setCache = async (key, data, expiryInSeconds = 3600) => {
  try {
    if (!redisClient) {
      console.warn("Redis client not initialized. Cache operations disabled.");
      return false;
    }

    await redisClient.setex(key, expiryInSeconds, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Error setting Redis cache for key ${key}:`, error);
    return false;
  }
};

// Get data from Redis cache
const getCache = async (key) => {
  try {
    if (!redisClient) {
      console.warn("Redis client not initialized. Cache operations disabled.");
      return null;
    }

    const cachedData = await redisClient.get(key);
    return cachedData ? JSON.parse(cachedData) : null;
  } catch (error) {
    console.error(`Error getting Redis cache for key ${key}:`, error);
    return null;
  }
};

// Delete cache entry
const deleteCache = async (key) => {
  try {
    if (!redisClient) {
      console.warn("Redis client not initialized. Cache operations disabled.");
      return false;
    }

    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error(`Error deleting Redis cache for key ${key}:`, error);
    return false;
  }
};

// Clear cache by pattern
const clearCacheByPattern = async (pattern) => {
  try {
    if (!redisClient) {
      console.warn("Redis client not initialized. Cache operations disabled.");
      return false;
    }

    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    return true;
  } catch (error) {
    console.error(`Error clearing cache by pattern ${pattern}:`, error);
    return false;
  }
};

// Common cache keys
const cacheKeys = {
  topRatedSneakers: "topRatedSneakers",
  userFollowerCount: (userId) => `user:${userId}:followerCount`,
  userFollowingCount: (userId) => `user:${userId}:followingCount`,
  postLikeCount: (postId) => `post:${postId}:likeCount`,
  sneakerRatingAvg: (sneakerId) => `sneaker:${sneakerId}:ratingAvg`,
};

module.exports = {
  redisClient,
  setCache,
  getCache,
  deleteCache,
  clearCacheByPattern,
  cacheKeys,
};
