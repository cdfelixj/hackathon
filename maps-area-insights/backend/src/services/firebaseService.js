const { getDb, Collections } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

class FirebaseService {
  constructor() {
    this.cacheTTL = parseInt(process.env.CACHE_TTL_HOURS) || 24; // 24 hours
    this.popularAreasCacheTTL = parseInt(process.env.POPULAR_AREAS_CACHE_TTL_HOURS) || 168; // 1 week
  }

  /**
   * Generate a cache key based on coordinates and radius
   * @param {Object} coords - Latitude and longitude
   * @param {number} radius - Search radius
   * @returns {string} Cache key
   */
  generateCacheKey(coords, radius = 3000) {
    // Round coordinates to reduce cache key variations
    const lat = Math.round(coords.lat * 1000) / 1000;
    const lng = Math.round(coords.lng * 1000) / 1000;
    return `${lat}_${lng}_${radius}`;
  }

  /**
   * Get cached area data
   * @param {string} cacheKey - Cache key
   * @returns {Promise<Object|null>} Cached data or null
   */
  async getCachedAreaData(cacheKey) {
    try {
      const db = getDb();
      const doc = await db.collection(Collections.AREA_CACHE).doc(cacheKey).get();
      
      if (!doc.exists) {
        return null;
      }

      const data = doc.data();
      const now = new Date();
      const cacheAge = now - data.cachedAt.toDate();
      const maxAge = this.cacheTTL * 60 * 60 * 1000; // Convert hours to milliseconds

      // Check if cache is expired
      if (cacheAge > maxAge) {
        // Delete expired cache entry
        await doc.ref.delete();
        return null;
      }

      console.log(`📦 Cache hit for key: ${cacheKey}`);
      return data.areaData;
    } catch (error) {
      console.error('Error getting cached area data:', error.message);
      return null;
    }
  }

  /**
   * Cache area data
   * @param {string} cacheKey - Cache key
   * @param {Object} areaData - Area data to cache
   * @returns {Promise<void>}
   */
  async cacheAreaData(cacheKey, areaData) {
    try {
      const db = getDb();
      const cacheEntry = {
        areaData,
        cachedAt: new Date(),
        accessCount: 1,
        lastAccessed: new Date()
      };

      await db.collection(Collections.AREA_CACHE).doc(cacheKey).set(cacheEntry);
      console.log(`💾 Cached area data for key: ${cacheKey}`);
    } catch (error) {
      console.error('Error caching area data:', error.message);
      // Don't throw error - caching failure shouldn't break the API
    }
  }

  /**
   * Update cache access statistics
   * @param {string} cacheKey - Cache key
   * @returns {Promise<void>}
   */
  async updateCacheAccess(cacheKey) {
    try {
      const db = getDb();
      const docRef = db.collection(Collections.AREA_CACHE).doc(cacheKey);
      
      await docRef.update({
        accessCount: admin.firestore.FieldValue.increment(1),
        lastAccessed: new Date()
      });
    } catch (error) {
      console.error('Error updating cache access:', error.message);
      // Don't throw error - statistics update failure shouldn't break the API
    }
  }

  /**
   * Track popular areas based on search frequency
   * @param {Object} coords - Latitude and longitude
   * @param {Object} searchData - Search metadata
   * @returns {Promise<void>}
   */
  async trackPopularArea(coords, searchData = {}) {
    try {
      const db = getDb();
      
      // Create area identifier based on rounded coordinates
      const areaId = this.generateCacheKey(coords, 1000); // 1km radius for popularity tracking
      
      const popularAreaData = {
        coordinates: coords,
        searchCount: 1,
        lastSearched: new Date(),
        averageUserInterests: searchData.userInterests || [],
        createdAt: new Date()
      };

      const docRef = db.collection(Collections.POPULAR_AREAS).doc(areaId);
      const doc = await docRef.get();

      if (doc.exists) {
        // Update existing popular area
        const existingData = doc.data();
        await docRef.update({
          searchCount: admin.firestore.FieldValue.increment(1),
          lastSearched: new Date(),
          averageUserInterests: this.mergeInterests(existingData.averageUserInterests, searchData.userInterests)
        });
      } else {
        // Create new popular area entry
        await docRef.set(popularAreaData);
      }

      console.log(`📊 Tracked popular area: ${areaId}`);
    } catch (error) {
      console.error('Error tracking popular area:', error.message);
      // Don't throw error - analytics failure shouldn't break the API
    }
  }

  /**
   * Get popular areas for analytics
   * @param {number} limit - Number of popular areas to return
   * @returns {Promise<Array>} Popular areas
   */
  async getPopularAreas(limit = 10) {
    try {
      const db = getDb();
      const snapshot = await db.collection(Collections.POPULAR_AREAS)
        .orderBy('searchCount', 'desc')
        .limit(limit)
        .get();

      const popularAreas = [];
      snapshot.forEach(doc => {
        popularAreas.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return popularAreas;
    } catch (error) {
      console.error('Error getting popular areas:', error.message);
      return [];
    }
  }

  /**
   * Log analytics event
   * @param {string} eventType - Type of event
   * @param {Object} eventData - Event data
   * @param {string} userId - User ID (optional)
   * @returns {Promise<void>}
   */
  async logAnalyticsEvent(eventType, eventData, userId = null) {
    try {
      const db = getDb();
      const analyticsEntry = {
        eventId: uuidv4(),
        eventType,
        eventData,
        userId,
        timestamp: new Date(),
        userAgent: eventData.userAgent || null,
        ip: eventData.ip || null
      };

      await db.collection(Collections.ANALYTICS).add(analyticsEntry);
    } catch (error) {
      console.error('Error logging analytics event:', error.message);
      // Don't throw error - analytics failure shouldn't break the API
    }
  }

  /**
   * Clean up expired cache entries
   * @returns {Promise<number>} Number of cleaned entries
   */
  async cleanupExpiredCache() {
    try {
      const db = getDb();
      const now = new Date();
      const maxAge = this.cacheTTL * 60 * 60 * 1000;
      const cutoffTime = new Date(now.getTime() - maxAge);

      const snapshot = await db.collection(Collections.AREA_CACHE)
        .where('cachedAt', '<', cutoffTime)
        .get();

      const batch = db.batch();
      let deleteCount = 0;

      snapshot.forEach(doc => {
        batch.delete(doc.ref);
        deleteCount++;
      });

      if (deleteCount > 0) {
        await batch.commit();
        console.log(`🧹 Cleaned up ${deleteCount} expired cache entries`);
      }

      return deleteCount;
    } catch (error) {
      console.error('Error cleaning up expired cache:', error.message);
      return 0;
    }
  }

  /**
   * Get cache statistics
   * @returns {Promise<Object>} Cache statistics
   */
  async getCacheStatistics() {
    try {
      const db = getDb();
      
      const [cacheSnapshot, popularSnapshot] = await Promise.all([
        db.collection(Collections.AREA_CACHE).get(),
        db.collection(Collections.POPULAR_AREAS).get()
      ]);

      let totalAccess = 0;
      let oldestCache = null;
      let newestCache = null;

      cacheSnapshot.forEach(doc => {
        const data = doc.data();
        totalAccess += data.accessCount || 0;
        
        const cacheDate = data.cachedAt.toDate();
        if (!oldestCache || cacheDate < oldestCache) {
          oldestCache = cacheDate;
        }
        if (!newestCache || cacheDate > newestCache) {
          newestCache = cacheDate;
        }
      });

      return {
        totalCacheEntries: cacheSnapshot.size,
        totalCacheAccess: totalAccess,
        popularAreasTracked: popularSnapshot.size,
        oldestCacheEntry: oldestCache,
        newestCacheEntry: newestCache,
        cacheTTLHours: this.cacheTTL
      };
    } catch (error) {
      console.error('Error getting cache statistics:', error.message);
      return {
        totalCacheEntries: 0,
        totalCacheAccess: 0,
        popularAreasTracked: 0,
        error: error.message
      };
    }
  }

  /**
   * Merge user interests for popular area tracking
   * @param {Array} existingInterests - Existing interests
   * @param {Array} newInterests - New interests to merge
   * @returns {Array} Merged interests
   */
  mergeInterests(existingInterests = [], newInterests = []) {
    const interestMap = {};
    
    // Count existing interests
    existingInterests.forEach(interest => {
      interestMap[interest] = (interestMap[interest] || 0) + 1;
    });
    
    // Add new interests
    newInterests.forEach(interest => {
      interestMap[interest] = (interestMap[interest] || 0) + 1;
    });
    
    // Return sorted interests by frequency
    return Object.entries(interestMap)
      .sort((a, b) => b[1] - a[1])
      .map(([interest]) => interest)
      .slice(0, 10); // Keep top 10 interests
  }

  /**
   * Batch operation helper
   * @param {Array} operations - Array of operations
   * @param {number} batchSize - Batch size
   * @returns {Promise<void>}
   */
  async batchOperation(operations, batchSize = 500) {
    const db = getDb();
    
    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = db.batch();
      const batchOperations = operations.slice(i, i + batchSize);
      
      batchOperations.forEach(operation => {
        operation(batch);
      });
      
      await batch.commit();
    }
  }
}

module.exports = FirebaseService;
