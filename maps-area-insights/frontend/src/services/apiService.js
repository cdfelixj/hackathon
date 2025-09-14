import axios from 'axios';
import { toast } from 'react-hot-toast';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api',
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add user ID to requests
api.interceptors.request.use(
  (config) => {
    // Add user ID to headers if available
    const userId = localStorage.getItem('userId');
    if (userId) {
      config.headers['X-User-ID'] = userId;
    }

    // Add timestamp for cache busting if needed
    if (config.params && config.cacheBust) {
      config.params._t = Date.now();
    }

    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log('API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        data: config.data,
        params: config.params,
      });
    }

    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Log response in development
    if (process.env.NODE_ENV === 'development') {
      console.log('API Response:', {
        url: response.config.url,
        status: response.status,
        data: response.data,
      });
    }

    return response;
  },
  (error) => {
    console.error('API Error:', error);

    // Handle different error types
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          toast.error(data.message || 'Invalid request data');
          break;
        case 401:
          toast.error('Authentication required');
          break;
        case 403:
          toast.error('Access denied');
          break;
        case 404:
          toast.error('Resource not found');
          break;
        case 429:
          toast.error('Too many requests. Please wait a moment.');
          break;
        case 500:
          toast.error('Server error. Please try again later.');
          break;
        case 503:
          toast.error('Service temporarily unavailable');
          break;
        default:
          toast.error(data.message || 'An unexpected error occurred');
      }
    } else if (error.request) {
      // Network error
      toast.error('Network error. Please check your connection.');
    } else {
      // Other error
      toast.error('An unexpected error occurred');
    }

    return Promise.reject(error);
  }
);

// API Service Class
class ApiService {
  /**
   * Get area insights for given coordinates
   * @param {Object} coords - Latitude and longitude
   * @param {string} userId - User ID for personalization
   * @param {Object} filters - Additional filters
   * @returns {Promise<Object>} Area insights data
   */
  async getAreaInsights(coords, userId = null, filters = {}) {
    try {
      const response = await api.post('/area-insights', {
        coords,
        userId,
        filters,
        timestamp: new Date().toISOString(),
      });

      return response.data;
    } catch (error) {
      console.error('Error getting area insights:', error);
      throw this.createApiError(error);
    }
  }

  /**
   * Get user preferences
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User preferences
   */
  async getUserPreferences(userId) {
    try {
      const response = await api.get(`/user/preferences/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting user preferences:', error);
      throw this.createApiError(error);
    }
  }

  /**
   * Save user preferences
   * @param {Object} preferences - User preferences
   * @param {string} userId - User ID (optional)
   * @returns {Promise<Object>} Saved preferences
   */
  async saveUserPreferences(preferences, userId = null) {
    try {
      const response = await api.post('/user/preferences', {
        preferences,
        userId,
        timestamp: new Date().toISOString(),
      });

      return response.data;
    } catch (error) {
      console.error('Error saving user preferences:', error);
      throw this.createApiError(error);
    }
  }

  /**
   * Update user preferences
   * @param {string} userId - User ID
   * @param {Object} preferences - Updated preferences
   * @returns {Promise<Object>} Updated preferences
   */
  async updateUserPreferences(userId, preferences) {
    try {
      const response = await api.put(`/user/preferences/${userId}`, {
        preferences,
        timestamp: new Date().toISOString(),
      });

      return response.data;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw this.createApiError(error);
    }
  }

  /**
   * Get health status of the backend
   * @returns {Promise<Object>} Health status
   */
  async getHealthStatus() {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      console.error('Error getting health status:', error);
      throw this.createApiError(error);
    }
  }

  /**
   * Search for specific place types near coordinates
   * @param {Object} coords - Latitude and longitude
   * @param {string} placeType - Type of place to search for
   * @param {number} radius - Search radius in meters
   * @returns {Promise<Object>} Search results
   */
  async searchNearbyPlaces(coords, placeType, radius = 3000) {
    try {
      const response = await api.post('/area-insights', {
        coords,
        filters: {
          placeType,
          radius,
          specificSearch: true,
        },
        timestamp: new Date().toISOString(),
      });

      return response.data;
    } catch (error) {
      console.error('Error searching nearby places:', error);
      throw this.createApiError(error);
    }
  }

  /**
   * Get cached area insights if available
   * @param {Object} coords - Latitude and longitude
   * @returns {Promise<Object|null>} Cached data or null
   */
  async getCachedAreaInsights(coords) {
    try {
      // Generate cache key similar to backend
      const cacheKey = `${Math.round(coords.lat * 1000) / 1000}_${Math.round(coords.lng * 1000) / 1000}`;
      
      const cachedData = localStorage.getItem(`area_insights_${cacheKey}`);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        const age = Date.now() - parsed.timestamp;
        const maxAge = (parseInt(process.env.REACT_APP_CACHE_DURATION_MINUTES) || 60) * 60 * 1000;
        
        if (age < maxAge) {
          return parsed.data;
        } else {
          localStorage.removeItem(`area_insights_${cacheKey}`);
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  }

  /**
   * Cache area insights locally
   * @param {Object} coords - Latitude and longitude
   * @param {Object} data - Data to cache
   */
  cacheAreaInsights(coords, data) {
    try {
      const cacheKey = `${Math.round(coords.lat * 1000) / 1000}_${Math.round(coords.lng * 1000) / 1000}`;
      const cacheData = {
        data,
        timestamp: Date.now(),
      };
      
      localStorage.setItem(`area_insights_${cacheKey}`, JSON.stringify(cacheData));
      
      // Clean up old cache entries
      this.cleanupCache();
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }

  /**
   * Clean up old cache entries
   */
  cleanupCache() {
    try {
      const maxCacheEntries = parseInt(process.env.REACT_APP_MAX_CACHED_SEARCHES) || 100;
      const cacheKeys = Object.keys(localStorage).filter(key => key.startsWith('area_insights_'));
      
      if (cacheKeys.length > maxCacheEntries) {
        // Sort by timestamp and remove oldest entries
        const cacheEntries = cacheKeys.map(key => {
          try {
            const data = JSON.parse(localStorage.getItem(key));
            return { key, timestamp: data.timestamp || 0 };
          } catch {
            return { key, timestamp: 0 };
          }
        }).sort((a, b) => a.timestamp - b.timestamp);
        
        const toRemove = cacheEntries.slice(0, cacheEntries.length - maxCacheEntries);
        toRemove.forEach(entry => localStorage.removeItem(entry.key));
      }
    } catch (error) {
      console.error('Error cleaning up cache:', error);
    }
  }

  /**
   * Create standardized API error
   * @param {Error} error - Original error
   * @returns {Object} Standardized error
   */
  createApiError(error) {
    return {
      message: error.response?.data?.message || error.message || 'An unexpected error occurred',
      code: error.response?.data?.code || 'UNKNOWN_ERROR',
      status: error.response?.status || 500,
      timestamp: new Date().toISOString(),
      originalError: error,
    };
  }

  /**
   * Retry API call with exponential backoff
   * @param {Function} apiCall - API call function
   * @param {number} maxRetries - Maximum number of retries
   * @param {number} baseDelay - Base delay in milliseconds
   * @returns {Promise} Result of API call
   */
  async retryApiCall(apiCall, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Don't retry on 4xx errors (client errors)
        if (error.status >= 400 && error.status < 500) {
          throw error;
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  /**
   * Check if the backend is available
   * @returns {Promise<boolean>} True if backend is available
   */
  async isBackendAvailable() {
    try {
      await this.getHealthStatus();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get API configuration
   * @returns {Object} API configuration
   */
  getConfig() {
    return {
      baseURL: api.defaults.baseURL,
      timeout: api.defaults.timeout,
      version: '1.0.0',
    };
  }
}

// Create and export singleton instance
const apiService = new ApiService();

export default apiService;
