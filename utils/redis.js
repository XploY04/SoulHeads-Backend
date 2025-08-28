// Cache utility without Redis implementation
// All cache operations are no-ops to maintain API compatibility

console.log("Cache: Using no-op implementation (Redis removed)");

// No-op cache functions that maintain the same API but don't actually cache
const setCache = async (key, data, expiryInSeconds = 3600) => {
  // No-op: Just return true to indicate "success"
  return true;
};

// Always return null (cache miss)
const getCache = async (key) => {
  // No-op: Always return null to simulate cache miss
  return null;
};

// No-op delete
const deleteCache = async (key) => {
  // No-op: Just return true to indicate "success"
  return true;
};

// No-op clear cache by pattern
const clearCacheByPattern = async (pattern) => {
  // No-op: Just return true to indicate "success"
  return true;
};

// Common cache keys (kept for API compatibility)
const cacheKeys = {
  topRatedSneakers: "topRatedSneakers",
  userFollowerCount: (userId) => `user:${userId}:followerCount`,
  userFollowingCount: (userId) => `user:${userId}:followingCount`,
  postLikeCount: (postId) => `post:${postId}:likeCount`,
  sneakerRatingAvg: (sneakerId) => `sneaker:${sneakerId}:ratingAvg`,
};

module.exports = {
  redisClient: null, // No Redis client
  setCache,
  getCache,
  deleteCache,
  clearCacheByPattern,
  cacheKeys,
};
