const GooglePlacesService = require('../services/googlePlacesService');
const PersonalizationService = require('../services/personalizationService');
const FirebaseService = require('../services/firebaseService');

class AreaInsightsController {
  constructor() {
    this.placesService = new GooglePlacesService();
    this.personalizationService = new PersonalizationService();
    this.firebaseService = new FirebaseService();
  }

  /**
   * Get comprehensive area insights for given coordinates
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAreaInsights(req, res) {
    try {
      const startTime = Date.now();
      
      // Validate request data
      const validation = this.validateRequest(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          error: 'Invalid request data',
          message: validation.message,
          code: 'VALIDATION_ERROR'
        });
      }

      const { coords, userId, filters = {} } = req.body;
      const cacheKey = this.firebaseService.generateCacheKey(coords);

      // Try to get cached data first
      let areaData = await this.firebaseService.getCachedAreaData(cacheKey);
      let fromCache = true;

      if (!areaData) {
        // No cache hit, fetch fresh data
        fromCache = false;
        console.log(`🔍 Fetching fresh area insights for coordinates: ${coords.lat}, ${coords.lng}`);
        
        areaData = await this.placesService.getAreaInsights(coords);
        
        // Cache the results
        await this.firebaseService.cacheAreaData(cacheKey, areaData);
      } else {
        // Update cache access statistics
        await this.firebaseService.updateCacheAccess(cacheKey);
      }

      // Get user preferences for personalization
      const userPreferences = await this.personalizationService.getUserPreferences(userId);

      // Apply personalization to each category
      const personalizedData = {
        landmarks: this.personalizationService.personalizePlaces(
          areaData.landmarks, 
          userPreferences, 
          { currentTime: new Date(), ...filters }
        ),
        restaurants: this.personalizationService.personalizePlaces(
          areaData.restaurants, 
          userPreferences, 
          { currentTime: new Date(), ...filters }
        ),
        attractions: this.personalizationService.personalizePlaces(
          areaData.attractions, 
          userPreferences, 
          { currentTime: new Date(), ...filters }
        ),
        entertainment: this.personalizationService.personalizePlaces(
          areaData.entertainment, 
          userPreferences, 
          { currentTime: new Date(), ...filters }
        ),
        shopping: this.personalizationService.personalizePlaces(
          areaData.shopping, 
          userPreferences, 
          { currentTime: new Date(), ...filters }
        )
      };

      // Generate comprehensive recommendations
      const allPlaces = [
        ...personalizedData.landmarks,
        ...personalizedData.restaurants,
        ...personalizedData.attractions,
        ...personalizedData.entertainment,
        ...personalizedData.shopping
      ];

      const topRecommendations = this.personalizationService.personalizePlaces(
        allPlaces, 
        userPreferences, 
        { currentTime: new Date(), ...filters }
      ).slice(0, 10);

      // Generate peak times and best visit recommendations
      const peakTimesAnalysis = this.generatePeakTimesAnalysis(topRecommendations, userPreferences);

      // Create comprehensive response
      const response = {
        success: true,
        data: {
          coordinates: coords,
          searchRadius: areaData.searchRadius,
          categories: {
            landmarks: personalizedData.landmarks.slice(0, 5),
            restaurants: personalizedData.restaurants.slice(0, 5),
            attractions: personalizedData.attractions.slice(0, 5),
            entertainment: personalizedData.entertainment.slice(0, 3),
            shopping: personalizedData.shopping.slice(0, 3)
          },
          topRecommendations,
          peakTimes: peakTimesAnalysis,
          bestVisitTime: this.generateBestVisitTime(topRecommendations, userPreferences),
          personalizationSummary: this.personalizationService.generateRecommendationsSummary(
            topRecommendations, 
            userPreferences
          ),
          areaInsights: {
            totalPlacesFound: allPlaces.length,
            averageRating: this.calculateAverageRating(topRecommendations),
            priceRangeDistribution: this.calculatePriceDistribution(topRecommendations),
            popularCategories: this.getPopularCategories(topRecommendations)
          }
        },
        metadata: {
          fromCache,
          processingTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          apiVersion: '1.0',
          personalized: !!userId
        }
      };

      // Track popular area (async, don't wait)
      this.firebaseService.trackPopularArea(coords, {
        userInterests: userPreferences.interests,
        searchTimestamp: new Date(),
        resultCount: allPlaces.length
      }).catch(error => console.error('Error tracking popular area:', error));

      // Log analytics event (async, don't wait)
      this.firebaseService.logAnalyticsEvent('area_search', {
        coordinates: coords,
        userId,
        resultCount: allPlaces.length,
        fromCache,
        processingTime: response.metadata.processingTime,
        userAgent: req.headers['user-agent']
      }, userId).catch(error => console.error('Error logging analytics:', error));

      res.json(response);

    } catch (error) {
      console.error('Error in getAreaInsights:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to get area insights',
        message: error.message,
        code: 'INTERNAL_SERVER_ERROR',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Validate request data
   * @param {Object} body - Request body
   * @returns {Object} Validation result
   */
  validateRequest(body) {
    if (!body) {
      return { isValid: false, message: 'Request body is required' };
    }

    const { coords } = body;

    if (!coords) {
      return { isValid: false, message: 'Coordinates are required' };
    }

    if (typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
      return { isValid: false, message: 'Coordinates must be valid numbers' };
    }

    if (coords.lat < -90 || coords.lat > 90) {
      return { isValid: false, message: 'Latitude must be between -90 and 90' };
    }

    if (coords.lng < -180 || coords.lng > 180) {
      return { isValid: false, message: 'Longitude must be between -180 and 180' };
    }

    return { isValid: true };
  }

  /**
   * Generate peak times analysis
   * @param {Array} places - Array of places
   * @param {Object} userPreferences - User preferences
   * @returns {Object} Peak times analysis
   */
  generatePeakTimesAnalysis(places, userPreferences) {
    const currentHour = new Date().getHours();
    const ageGroupPrefs = this.personalizationService.ageGroupPreferences[userPreferences.ageGroup];

    return {
      currentConditions: this.getCurrentConditions(currentHour),
      recommendations: {
        bestTimeToVisit: ageGroupPrefs?.timePreference || 'flexible',
        avoidPeakHours: this.getAvoidPeakHours(userPreferences.ageGroup),
        optimalDayOfWeek: this.getOptimalDayOfWeek(userPreferences)
      },
      hourlyActivity: this.generateHourlyActivity(places),
      crowdLevels: {
        current: this.getCurrentCrowdLevel(currentHour),
        predicted: this.getPredictedCrowdLevels()
      }
    };
  }

  /**
   * Generate best visit time recommendation
   * @param {Array} places - Array of places
   * @param {Object} userPreferences - User preferences
   * @returns {Object} Best visit time recommendation
   */
  generateBestVisitTime(places, userPreferences) {
    const ageGroupPrefs = this.personalizationService.ageGroupPreferences[userPreferences.ageGroup];
    const currentTime = new Date();
    const currentHour = currentTime.getHours();

    let recommendation = '';
    let reasoning = '';

    if (ageGroupPrefs?.timePreference === 'morning') {
      recommendation = 'Visit between 9 AM - 11 AM for the best experience';
      reasoning = 'Morning hours typically offer less crowded locations and better parking availability.';
    } else if (ageGroupPrefs?.timePreference === 'evening') {
      recommendation = 'Visit between 6 PM - 9 PM for vibrant atmosphere';
      reasoning = 'Evening hours provide lively atmosphere with more dining and entertainment options.';
    } else if (userPreferences.preferredEnvironment === 'quiet') {
      recommendation = 'Visit during weekday mornings (10 AM - 12 PM)';
      reasoning = 'Weekday mornings offer peaceful experiences with minimal crowds.';
    } else {
      recommendation = 'Visit between 2 PM - 5 PM for optimal balance';
      reasoning = 'Afternoon hours provide good availability with moderate activity levels.';
    }

    return {
      recommendation,
      reasoning,
      currentTimeAssessment: this.assessCurrentTime(currentHour, userPreferences),
      alternativeTimes: this.generateAlternativeTimes(userPreferences)
    };
  }

  /**
   * Calculate average rating of places
   * @param {Array} places - Array of places
   * @returns {number} Average rating
   */
  calculateAverageRating(places) {
    if (!places || places.length === 0) return 0;
    
    const ratingsSum = places.reduce((sum, place) => sum + (place.rating || 0), 0);
    return Math.round((ratingsSum / places.length) * 10) / 10;
  }

  /**
   * Calculate price distribution
   * @param {Array} places - Array of places
   * @returns {Object} Price distribution
   */
  calculatePriceDistribution(places) {
    const distribution = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, unknown: 0 };
    
    places.forEach(place => {
      const priceLevel = place.price_level;
      if (priceLevel !== undefined && priceLevel >= 0 && priceLevel <= 4) {
        distribution[priceLevel]++;
      } else {
        distribution.unknown++;
      }
    });

    return distribution;
  }

  /**
   * Get popular categories from places
   * @param {Array} places - Array of places
   * @returns {Array} Popular categories
   */
  getPopularCategories(places) {
    const categoryCount = {};
    
    places.forEach(place => {
      const primaryType = this.personalizationService.getPrimaryPlaceType(place.types);
      categoryCount[primaryType] = (categoryCount[primaryType] || 0) + 1;
    });

    return Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }));
  }

  // Helper methods for peak times analysis
  getCurrentConditions(hour) {
    if (hour >= 6 && hour < 10) return 'Morning Rush';
    if (hour >= 10 && hour < 14) return 'Moderate Activity';
    if (hour >= 14 && hour < 17) return 'Afternoon Active';
    if (hour >= 17 && hour < 21) return 'Evening Rush';
    if (hour >= 21 || hour < 6) return 'Quiet Hours';
    return 'Moderate Activity';
  }

  getAvoidPeakHours(ageGroup) {
    switch (ageGroup) {
      case 'family': return ['11 AM - 1 PM', '5 PM - 7 PM'];
      case 'young': return ['9 AM - 11 AM'];
      case 'senior': return ['6 PM - 9 PM'];
      default: return ['12 PM - 2 PM'];
    }
  }

  getOptimalDayOfWeek(userPreferences) {
    if (userPreferences.preferredEnvironment === 'quiet') return 'Tuesday-Thursday';
    if (userPreferences.ageGroup === 'young') return 'Friday-Saturday';
    return 'Wednesday-Friday';
  }

  generateHourlyActivity(places) {
    // Simplified hourly activity based on place types
    return Array.from({ length: 24 }, (_, hour) => ({
      hour,
      activityLevel: this.calculateHourlyActivity(hour, places)
    }));
  }

  calculateHourlyActivity(hour, places) {
    // Basic activity level calculation based on hour and place types
    let baseActivity = 30; // Base activity percentage
    
    if (hour >= 9 && hour <= 21) baseActivity += 40;
    if (hour >= 12 && hour <= 14) baseActivity += 20; // Lunch rush
    if (hour >= 18 && hour <= 20) baseActivity += 30; // Dinner rush
    
    // Adjust based on place types
    const hasRestaurants = places.some(p => p.types.includes('restaurant'));
    const hasNightlife = places.some(p => p.types.includes('night_club') || p.types.includes('bar'));
    
    if (hasRestaurants && (hour === 12 || hour === 13 || hour >= 18 && hour <= 20)) {
      baseActivity += 15;
    }
    
    if (hasNightlife && hour >= 21) {
      baseActivity += 25;
    }
    
    return Math.min(100, Math.max(10, baseActivity));
  }

  getCurrentCrowdLevel(hour) {
    const activity = this.calculateHourlyActivity(hour, []);
    if (activity < 30) return 'Low';
    if (activity < 60) return 'Moderate';
    if (activity < 80) return 'High';
    return 'Very High';
  }

  getPredictedCrowdLevels() {
    const currentHour = new Date().getHours();
    return Array.from({ length: 6 }, (_, i) => {
      const hour = (currentHour + i + 1) % 24;
      return {
        hour,
        level: this.getCurrentCrowdLevel(hour)
      };
    });
  }

  assessCurrentTime(hour, userPreferences) {
    const optimalHours = this.getOptimalHours(userPreferences);
    if (optimalHours.includes(hour)) {
      return { status: 'optimal', message: 'Great time to visit!' };
    } else if (hour >= 12 && hour <= 14) {
      return { status: 'busy', message: 'Expect moderate crowds during lunch hours.' };
    } else if (hour >= 18 && hour <= 20) {
      return { status: 'busy', message: 'Popular dinner time - expect crowds.' };
    }
    return { status: 'good', message: 'Good time to visit with moderate activity.' };
  }

  getOptimalHours(userPreferences) {
    const ageGroupPrefs = this.personalizationService.ageGroupPreferences[userPreferences.ageGroup];
    switch (ageGroupPrefs?.timePreference) {
      case 'morning': return [9, 10, 11];
      case 'afternoon': return [14, 15, 16];
      case 'evening': return [18, 19, 20];
      default: return [10, 14, 16];
    }
  }

  generateAlternativeTimes(userPreferences) {
    const alternatives = [];
    
    if (userPreferences.preferredEnvironment === 'quiet') {
      alternatives.push({ time: '8 AM - 10 AM', reason: 'Peaceful morning hours' });
      alternatives.push({ time: 'Tuesday 2 PM - 4 PM', reason: 'Weekday afternoon calm' });
    } else {
      alternatives.push({ time: '11 AM - 1 PM', reason: 'Pre-lunch exploration' });
      alternatives.push({ time: '3 PM - 5 PM', reason: 'Afternoon discovery' });
      alternatives.push({ time: '7 PM - 9 PM', reason: 'Evening atmosphere' });
    }
    
    return alternatives;
  }
}

// Create and export controller instance
const areaInsightsController = new AreaInsightsController();

module.exports = {
  getAreaInsights: areaInsightsController.getAreaInsights.bind(areaInsightsController)
};
