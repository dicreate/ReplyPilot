const logger = require('../utils/logger');

class CacheService {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes
    this.maxSize = 1000; // Maximum number of cached items
    
    // Cleanup expired items every minute
    setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  /**
   * Set a value in cache with TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds
   */
  set(key, value, ttl = this.defaultTTL) {
    // Remove oldest items if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    const expiresAt = Date.now() + ttl;
    this.cache.set(key, {
      value,
      expiresAt,
      createdAt: Date.now()
    });

    logger.info(`Cache set: ${key} (TTL: ${ttl}ms)`);
  }

  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {any|null} - Cached value or null if not found/expired
   */
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      logger.info(`Cache expired: ${key}`);
      return null;
    }

    logger.info(`Cache hit: ${key}`);
    return item.value;
  }

  /**
   * Delete a value from cache
   * @param {string} key - Cache key
   */
  delete(key) {
    const deleted = this.cache.delete(key);
    if (deleted) {
      logger.info(`Cache deleted: ${key}`);
    }
    return deleted;
  }

  /**
   * Clear all cache
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    logger.info(`Cache cleared: ${size} items removed`);
  }

  /**
   * Get cache statistics
   * @returns {object} - Cache statistics
   */
  getStats() {
    const now = Date.now();
    let expiredCount = 0;
    let totalSize = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        expiredCount++;
      }
      totalSize += JSON.stringify(item.value).length;
    }

    return {
      totalItems: this.cache.size,
      expiredItems: expiredCount,
      activeItems: this.cache.size - expiredCount,
      totalSizeBytes: totalSize,
      maxSize: this.maxSize
    };
  }

  /**
   * Clean up expired items
   */
  cleanup() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info(`Cache cleanup: ${cleanedCount} expired items removed`);
    }
  }

  /**
   * Generate cache key for user-specific data
   * @param {string} userId - User ID
   * @param {string} type - Data type
   * @param {string} identifier - Additional identifier
   * @returns {string} - Cache key
   */
  generateUserKey(userId, type, identifier = '') {
    return `user:${userId}:${type}${identifier ? `:${identifier}` : ''}`;
  }

  /**
   * Generate cache key for analytics data
   * @param {string} userId - User ID
   * @param {string} type - Analytics type
   * @param {string} period - Time period
   * @returns {string} - Cache key
   */
  generateAnalyticsKey(userId, type, period) {
    return `analytics:${userId}:${type}:${period}`;
  }

  /**
   * Cache middleware for Express routes
   * @param {number} ttl - Time to live in milliseconds
   * @returns {Function} - Express middleware
   */
  middleware(ttl = this.defaultTTL) {
    return (req, res, next) => {
      // Generate cache key based on route and user
      const userId = req.user?.id || 'anonymous';
      const cacheKey = `route:${userId}:${req.method}:${req.originalUrl}`;
      
      // Try to get cached response
      const cachedResponse = this.get(cacheKey);
      if (cachedResponse) {
        logger.info(`Cache middleware hit: ${cacheKey}`);
        return res.json(cachedResponse);
      }

      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = (data) => {
        // Only cache successful responses
        if (res.statusCode === 200 && data.success !== false) {
          this.set(cacheKey, data, ttl);
          logger.info(`Cache middleware set: ${cacheKey}`);
        }
        return originalJson.call(res, data);
      };

      next();
    };
  }

  /**
   * Invalidate cache by pattern
   * @param {string} pattern - Pattern to match keys
   */
  invalidatePattern(pattern) {
    let invalidatedCount = 0;
    const regex = new RegExp(pattern);

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        invalidatedCount++;
      }
    }

    if (invalidatedCount > 0) {
      logger.info(`Cache invalidated by pattern "${pattern}": ${invalidatedCount} items`);
    }

    return invalidatedCount;
  }

  /**
   * Invalidate user-specific cache
   * @param {string} userId - User ID
   */
  invalidateUser(userId) {
    return this.invalidatePattern(`user:${userId}:`);
  }

  /**
   * Invalidate analytics cache
   * @param {string} userId - User ID
   */
  invalidateAnalytics(userId) {
    return this.invalidatePattern(`analytics:${userId}:`);
  }
}

module.exports = new CacheService();