const { getDb, Collections } = require('../config/firebase');

class PersonalizationService {
  constructor() {
    this.defaultPreferences = {
      interests: ['restaurant', 'tourist_attraction', 'shopping_mall'],
      ageGroup: 'adult',
      activityTypes: ['sightseeing', 'dining', 'shopping'],
      preferredEnvironment: 'mixed',
      priceRange: 'medium',
      timePreference: 'flexible',
      groupSize: 'small',
      accessibilityNeeds: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Interest categories mapping
    this.interestMapping = {
      'food': ['restaurant', 'cafe', 'bakery', 'meal_takeaway', 'meal_delivery'],
      'nightlife': ['night_club', 'bar', 'liquor_store'],
      'culture': ['museum', 'art_gallery', 'library', 'university'],
      'history': ['tourist_attraction', 'museum', 'cemetery', 'place_of_worship'],
      'shopping': ['shopping_mall', 'store', 'clothing_store', 'electronics_store'],
      'entertainment': ['amusement_park', 'movie_theater', 'bowling_alley', 'casino'],
      'nature': ['park', 'zoo', 'aquarium', 'campground'],
      'fitness': ['gym', 'spa', 'stadium'],
      'business': ['bank', 'post_office', 'city_hall', 'courthouse'],
      'health': ['hospital', 'pharmacy', 'doctor', 'dentist'],
      'travel': ['lodging', 'travel_agency', 'gas_station', 'airport'],
      'services': ['car_repair', 'laundry', 'hair_care', 'beauty_salon']
    };

    // Age group preferences
    this.ageGroupPreferences = {
      'young': {
        priorityTypes: ['night_club', 'bar', 'amusement_park', 'shopping_mall'],
        timePreference: 'evening',
        priceRange: 'budget'
      },
      'adult': {
        priorityTypes: ['restaurant', 'museum', 'tourist_attraction', 'park'],
        timePreference: 'flexible',
        priceRange: 'medium'
      },
      'senior': {
        priorityTypes: ['museum', 'park', 'restaurant', 'library'],
        timePreference: 'morning',
        priceRange: 'comfortable'
      },
      'family': {
        priorityTypes: ['park', 'zoo', 'amusement_park', 'restaurant'],
        timePreference: 'daytime',
        priceRange: 'family-friendly'
      }
    };
  }

  /**
   * Get user preferences from Firebase
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User preferences
   */
  async getUserPreferences(userId) {
    try {
      if (!userId) {
        return this.defaultPreferences;
      }

      const db = getDb();
      const doc = await db.collection(Collections.USER_PREFERENCES).doc(userId).get();
      
      if (!doc.exists) {
        return this.defaultPreferences;
      }

      const preferences = doc.data();
      
      // Merge with default preferences to ensure all fields exist
      return {
        ...this.defaultPreferences,
        ...preferences,
        updatedAt: preferences.updatedAt || new Date()
      };
    } catch (error) {
      console.error('Error getting user preferences:', error.message);
      return this.defaultPreferences;
    }
  }

  /**
   * Save user preferences to Firebase
   * @param {string} userId - User ID
   * @param {Object} preferences - User preferences
   * @returns {Promise<Object>} Saved preferences
   */
  async saveUserPreferences(userId, preferences) {
    try {
      const db = getDb();
      const now = new Date();
      
      const preferencesToSave = {
        ...this.defaultPreferences,
        ...preferences,
        userId,
        updatedAt: now,
        createdAt: preferences.createdAt || now
      };

      await db.collection(Collections.USER_PREFERENCES).doc(userId).set(preferencesToSave, { merge: true });
      
      return preferencesToSave;
    } catch (error) {
      console.error('Error saving user preferences:', error.message);
      throw new Error(`Failed to save user preferences: ${error.message}`);
    }
  }

  /**
   * Personalize places based on user preferences
   * @param {Array} places - Array of places from Google Places API
   * @param {Object} userPreferences - User preferences
   * @param {Object} context - Additional context (time, weather, etc.)
   * @returns {Array} Personalized and ranked places
   */
  personalizePlaces(places, userPreferences = this.defaultPreferences, context = {}) {
    try {
      // Get relevant place types based on user interests
      const relevantTypes = this.getRelevantPlaceTypes(userPreferences.interests);
      const ageGroupPrefs = this.ageGroupPreferences[userPreferences.ageGroup] || this.ageGroupPreferences.adult;

      // Score and filter places
      const scoredPlaces = places.map(place => {
        let score = 0;
        
        // Base score from rating and review count
        const rating = place.rating || 0;
        const reviewCount = place.user_ratings_total || 0;
        score += rating * 2; // Rating weight
        score += Math.min(Math.log(reviewCount + 1), 5); // Review count weight (capped)

        // Interest matching score
        const matchingTypes = place.types.filter(type => relevantTypes.includes(type));
        score += matchingTypes.length * 3;

        // Age group preference score
        const ageGroupMatches = place.types.filter(type => ageGroupPrefs.priorityTypes.includes(type));
        score += ageGroupMatches.length * 2;

        // Price level preference score
        if (place.price_level !== undefined) {
          score += this.getPriceLevelScore(place.price_level, userPreferences.priceRange);
        }

        // Environment preference score
        score += this.getEnvironmentScore(place, userPreferences.preferredEnvironment);

        // Time-based adjustments
        if (context.currentTime) {
          score += this.getTimeScore(place, context.currentTime, userPreferences.timePreference);
        }

        // Business status boost
        if (place.business_status === 'OPERATIONAL') {
          score += 1;
        }

        return {
          ...place,
          personalizedScore: score,
          matchingInterests: matchingTypes,
          ageGroupMatch: ageGroupMatches.length > 0
        };
      });

      // Filter places with minimum score and sort
      return scoredPlaces
        .filter(place => place.personalizedScore > 2) // Minimum relevance threshold
        .sort((a, b) => b.personalizedScore - a.personalizedScore)
        .slice(0, userPreferences.maxResults || 15);

    } catch (error) {
      console.error('Error personalizing places:', error.message);
      // Return original places if personalization fails
      return places.slice(0, 15);
    }
  }

  /**
   * Get relevant place types based on user interests
   * @param {Array} interests - User interests
   * @returns {Array} Relevant Google Places types
   */
  getRelevantPlaceTypes(interests) {
    const types = new Set();
    
    interests.forEach(interest => {
      const mappedTypes = this.interestMapping[interest] || [interest];
      mappedTypes.forEach(type => types.add(type));
    });

    return Array.from(types);
  }

  /**
   * Calculate price level score based on user preference
   * @param {number} priceLevel - Google Places price level (0-4)
   * @param {string} userPriceRange - User's preferred price range
   * @returns {number} Price score
   */
  getPriceLevelScore(priceLevel, userPriceRange) {
    const priceMapping = {
      'budget': 0,
      'low': 1,
      'medium': 2,
      'comfortable': 3,
      'luxury': 4
    };

    const preferredLevel = priceMapping[userPriceRange] || 2;
    const difference = Math.abs(priceLevel - preferredLevel);
    
    return Math.max(0, 2 - difference); // Higher score for closer matches
  }

  /**
   * Calculate environment score based on user preference
   * @param {Object} place - Place object
   * @param {string} preferredEnvironment - User's preferred environment
   * @returns {number} Environment score
   */
  getEnvironmentScore(place, preferredEnvironment) {
    const reviewCount = place.user_ratings_total || 0;
    
    switch (preferredEnvironment) {
      case 'quiet':
        return reviewCount < 100 ? 2 : 0;
      case 'busy':
        return reviewCount > 500 ? 2 : 0;
      case 'trending':
        return (place.rating > 4.0 && reviewCount > 200) ? 3 : 0;
      case 'family-friendly':
        return place.types.includes('park') || place.types.includes('zoo') || 
               place.types.includes('amusement_park') ? 2 : 0;
      case 'mixed':
      default:
        return 1; // Neutral score for mixed preference
    }
  }

  /**
   * Calculate time-based score
   * @param {Object} place - Place object
   * @param {Date} currentTime - Current time
   * @param {string} timePreference - User's time preference
   * @returns {number} Time score
   */
  getTimeScore(place, currentTime, timePreference) {
    const hour = currentTime.getHours();
    
    // Basic time preference scoring
    switch (timePreference) {
      case 'morning':
        return hour >= 6 && hour < 12 ? 1 : 0;
      case 'afternoon':
        return hour >= 12 && hour < 17 ? 1 : 0;
      case 'evening':
        return hour >= 17 && hour < 22 ? 1 : 0;
      case 'night':
        return hour >= 22 || hour < 6 ? 1 : 0;
      case 'flexible':
      default:
        return 0.5; // Neutral score for flexible preference
    }
  }

  /**
   * Generate personalized recommendations summary
   * @param {Array} personalizedPlaces - Personalized places array
   * @param {Object} userPreferences - User preferences
   * @returns {Object} Recommendations summary
   */
  generateRecommendationsSummary(personalizedPlaces, userPreferences) {
    const topPlaces = personalizedPlaces.slice(0, 5);
    const categories = {};
    
    // Group places by primary category
    topPlaces.forEach(place => {
      const primaryType = this.getPrimaryPlaceType(place.types);
      if (!categories[primaryType]) {
        categories[primaryType] = [];
      }
      categories[primaryType].push(place);
    });

    return {
      totalRecommendations: personalizedPlaces.length,
      topRecommendations: topPlaces,
      categorizedRecommendations: categories,
      personalizationFactors: {
        interests: userPreferences.interests,
        ageGroup: userPreferences.ageGroup,
        preferredEnvironment: userPreferences.preferredEnvironment,
        priceRange: userPreferences.priceRange
      },
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Get primary place type for categorization
   * @param {Array} types - Array of place types
   * @returns {string} Primary type
   */
  getPrimaryPlaceType(types) {
    const primaryTypes = [
      'restaurant', 'tourist_attraction', 'shopping_mall', 'museum',
      'park', 'night_club', 'bar', 'cafe', 'amusement_park'
    ];

    for (const type of primaryTypes) {
      if (types.includes(type)) {
        return type;
      }
    }
    
    return types[0] || 'establishment';
  }

  /**
   * Get available interest options
   * @returns {Array} Available interests
   */
  getAvailableInterests() {
    return Object.keys(this.interestMapping);
  }

  /**
   * Get available age groups
   * @returns {Array} Available age groups
   */
  getAvailableAgeGroups() {
    return Object.keys(this.ageGroupPreferences);
  }
}

module.exports = PersonalizationService;
