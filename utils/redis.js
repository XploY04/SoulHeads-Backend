const Redis = require('ioredis');

// Initialize Redis client with Upstash configuration using the connection URL directly
const initRedisClient = () => {
  try {
    // Get Redis URL from environment variables
    const redisUrl = process.env.REDIS_URL;
    const redis = new Redis(redisUrl);
    
    redis.on('connect', () => {
      console.log('Connected to Upstash Redis');
    });
    
    redis.on('error', (error) => {
      console.error('Redis Error:', error);
    });
    
    return redis;
  } catch (error) {
    console.error('Redis initialization error:', error);
    throw error;
  }
};

// Cache helper functions
const redisClient = initRedisClient();

// Set data in Redis cache with expiration time
const setCache = async (key, data, expiryInSeconds = 3600) => {
  try {
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
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error(`Error deleting Redis cache for key ${key}:`, error);
    return false;
  }
};

// Common cache keys
const cacheKeys = {
  topRatedSneakers: 'topRatedSneakers',
  userFollowerCount: (userId) => `user:${userId}:followerCount`,
  userFollowingCount: (userId) => `user:${userId}:followingCount`,
  postLikeCount: (postId) => `post:${postId}:likeCount`,
  sneakerRatingAvg: (sneakerId) => `sneaker:${sneakerId}:ratingAvg`
};

module.exports = {
  redisClient,
  setCache,
  getCache,
  deleteCache,
  cacheKeys
};