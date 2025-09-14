/**
 * Utility functions for Maps Area Insights Backend
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {Object} coord1 - First coordinate {lat, lng}
 * @param {Object} coord2 - Second coordinate {lat, lng}
 * @returns {number} Distance in kilometers
 */
function calculateDistance(coord1, coord2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(coord2.lat - coord1.lat);
  const dLng = toRadians(coord2.lng - coord1.lng);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(coord1.lat)) * Math.cos(toRadians(coord2.lat)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

/**
 * Convert degrees to radians
 * @param {number} degrees - Degrees
 * @returns {number} Radians
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Format coordinates for display
 * @param {Object} coords - Coordinates {lat, lng}
 * @returns {string} Formatted coordinates
 */
function formatCoordinates(coords) {
  const lat = parseFloat(coords.lat).toFixed(6);
  const lng = parseFloat(coords.lng).toFixed(6);
  return `${lat}, ${lng}`;
}

/**
 * Validate coordinates
 * @param {Object} coords - Coordinates {lat, lng}
 * @returns {boolean} True if valid
 */
function validateCoordinates(coords) {
  if (!coords || typeof coords !== 'object') return false;
  
  const lat = parseFloat(coords.lat);
  const lng = parseFloat(coords.lng);
  
  return !isNaN(lat) && !isNaN(lng) && 
         lat >= -90 && lat <= 90 && 
         lng >= -180 && lng <= 180;
}

/**
 * Generate a unique cache key based on multiple parameters
 * @param {Object} params - Parameters object
 * @returns {string} Cache key
 */
function generateCacheKey(params) {
  const sortedKeys = Object.keys(params).sort();
  const keyParts = sortedKeys.map(key => `${key}:${params[key]}`);
  return keyParts.join('|');
}

/**
 * Normalize place types for consistency
 * @param {Array} types - Array of place types
 * @returns {Array} Normalized types
 */
function normalizePlaceTypes(types) {
  const typeMapping = {
    'meal_delivery': 'restaurant',
    'meal_takeaway': 'restaurant',
    'food': 'restaurant',
    'point_of_interest': 'attraction',
    'establishment': 'general'
  };

  return types.map(type => typeMapping[type] || type);
}

/**
 * Calculate popularity score based on rating and review count
 * @param {number} rating - Place rating (0-5)
 * @param {number} reviewCount - Number of reviews
 * @returns {number} Popularity score
 */
function calculatePopularityScore(rating = 0, reviewCount = 0) {
  if (reviewCount === 0) return rating * 10;
  
  // Logarithmic scaling for review count to prevent bias toward very popular places
  const reviewScore = Math.log(reviewCount + 1) * 5;
  const ratingScore = rating * 20;
  
  // Weighted combination (70% rating, 30% reviews)
  return Math.round((ratingScore * 0.7 + reviewScore * 0.3) * 10) / 10;
}

/**
 * Format time for display
 * @param {Date} date - Date object
 * @returns {string} Formatted time
 */
function formatTime(date) {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
}

/**
 * Format date for display
 * @param {Date} date - Date object
 * @returns {string} Formatted date
 */
function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Get time period from hour
 * @param {number} hour - Hour (0-23)
 * @returns {string} Time period
 */
function getTimePeriod(hour) {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * Check if current time is within business hours
 * @param {Object} openingHours - Opening hours object
 * @param {Date} currentTime - Current time
 * @returns {boolean} True if open
 */
function isCurrentlyOpen(openingHours, currentTime = new Date()) {
  if (!openingHours || !openingHours.periods) return null;
  
  const currentDay = currentTime.getDay();
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const currentTimeMinutes = currentHour * 60 + currentMinute;
  
  const todayPeriods = openingHours.periods.filter(period => 
    period.open && period.open.day === currentDay
  );
  
  for (const period of todayPeriods) {
    const openTime = period.open.time;
    const closeTime = period.close ? period.close.time : '2359';
    
    const openMinutes = parseInt(openTime.substring(0, 2)) * 60 + parseInt(openTime.substring(2));
    const closeMinutes = parseInt(closeTime.substring(0, 2)) * 60 + parseInt(closeTime.substring(2));
    
    if (closeMinutes < openMinutes) {
      // Spans midnight
      if (currentTimeMinutes >= openMinutes || currentTimeMinutes <= closeMinutes) {
        return true;
      }
    } else {
      // Same day
      if (currentTimeMinutes >= openMinutes && currentTimeMinutes <= closeMinutes) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Sanitize string input
 * @param {string} input - Input string
 * @returns {string} Sanitized string
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
}

/**
 * Deep clone object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  
  const clonedObj = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }
  return clonedObj;
}

/**
 * Shuffle array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Remove duplicates from array based on property
 * @param {Array} array - Array with potential duplicates
 * @param {string} property - Property to check for duplicates
 * @returns {Array} Array without duplicates
 */
function removeDuplicates(array, property = 'place_id') {
  const seen = new Set();
  return array.filter(item => {
    const key = item[property];
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * Paginate array
 * @param {Array} array - Array to paginate
 * @param {number} page - Page number (1-based)
 * @param {number} limit - Items per page
 * @returns {Object} Paginated result
 */
function paginate(array, page = 1, limit = 10) {
  const offset = (page - 1) * limit;
  const totalItems = array.length;
  const totalPages = Math.ceil(totalItems / limit);
  const items = array.slice(offset, offset + limit);
  
  return {
    items,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    }
  };
}

/**
 * Retry function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise} Result of the function
 */
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
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
 * Rate limiter using token bucket algorithm
 * @param {number} capacity - Maximum tokens
 * @param {number} refillRate - Tokens per second
 * @returns {Function} Rate limiting function
 */
function createRateLimiter(capacity, refillRate) {
  let tokens = capacity;
  let lastRefill = Date.now();
  
  return function() {
    const now = Date.now();
    const timePassed = (now - lastRefill) / 1000;
    
    tokens = Math.min(capacity, tokens + timePassed * refillRate);
    lastRefill = now;
    
    if (tokens >= 1) {
      tokens -= 1;
      return true;
    }
    
    return false;
  };
}

module.exports = {
  calculateDistance,
  toRadians,
  formatCoordinates,
  validateCoordinates,
  generateCacheKey,
  normalizePlaceTypes,
  calculatePopularityScore,
  formatTime,
  formatDate,
  getTimePeriod,
  isCurrentlyOpen,
  sanitizeInput,
  deepClone,
  shuffleArray,
  removeDuplicates,
  paginate,
  retryWithBackoff,
  createRateLimiter
};
