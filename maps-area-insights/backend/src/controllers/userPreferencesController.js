const PersonalizationService = require('../services/personalizationService');
const FirebaseService = require('../services/firebaseService');
const { v4: uuidv4 } = require('uuid');

class UserPreferencesController {
  constructor() {
    this.personalizationService = new PersonalizationService();
    this.firebaseService = new FirebaseService();
  }

  /**
   * Get user preferences
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getUserPreferences(req, res) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          error: 'User ID is required',
          code: 'MISSING_USER_ID'
        });
      }

      const preferences = await this.personalizationService.getUserPreferences(userId);

      // Add available options for frontend
      const response = {
        success: true,
        data: {
          preferences,
          availableOptions: {
            interests: this.personalizationService.getAvailableInterests(),
            ageGroups: this.personalizationService.getAvailableAgeGroups(),
            environments: ['quiet', 'busy', 'trending', 'family-friendly', 'mixed'],
            priceRanges: ['budget', 'low', 'medium', 'comfortable', 'luxury'],
            timePreferences: ['morning', 'afternoon', 'evening', 'night', 'flexible'],
            activityTypes: [
              'sightseeing', 'dining', 'shopping', 'nightlife', 'culture',
              'history', 'nature', 'entertainment', 'fitness', 'relaxation'
            ]
          }
        },
        metadata: {
          timestamp: new Date().toISOString(),
          isDefault: !preferences.userId
        }
      };

      // Log analytics event
      this.firebaseService.logAnalyticsEvent('preferences_retrieved', {
        userId,
        hasCustomPreferences: !!preferences.userId
      }, userId).catch(error => console.error('Error logging analytics:', error));

      res.json(response);

    } catch (error) {
      console.error('Error getting user preferences:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to get user preferences',
        message: error.message,
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Save new user preferences
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async saveUserPreferences(req, res) {
    try {
      const validation = this.validatePreferences(req.body);
      
      if (!validation.isValid) {
        return res.status(400).json({
          error: 'Invalid preferences data',
          message: validation.message,
          code: 'VALIDATION_ERROR'
        });
      }

      const { preferences, userId = uuidv4() } = req.body;

      // Save preferences
      const savedPreferences = await this.personalizationService.saveUserPreferences(userId, preferences);

      const response = {
        success: true,
        data: {
          userId,
          preferences: savedPreferences,
          message: 'Preferences saved successfully'
        },
        metadata: {
          timestamp: new Date().toISOString(),
          operation: 'create'
        }
      };

      // Log analytics event
      this.firebaseService.logAnalyticsEvent('preferences_created', {
        userId,
        interests: preferences.interests,
        ageGroup: preferences.ageGroup,
        preferredEnvironment: preferences.preferredEnvironment
      }, userId).catch(error => console.error('Error logging analytics:', error));

      res.status(201).json(response);

    } catch (error) {
      console.error('Error saving user preferences:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to save user preferences',
        message: error.message,
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Update existing user preferences
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateUserPreferences(req, res) {
    try {
      const { userId } = req.params;
      const { preferences } = req.body;

      if (!userId) {
        return res.status(400).json({
          error: 'User ID is required',
          code: 'MISSING_USER_ID'
        });
      }

      const validation = this.validatePreferences({ preferences });
      
      if (!validation.isValid) {
        return res.status(400).json({
          error: 'Invalid preferences data',
          message: validation.message,
          code: 'VALIDATION_ERROR'
        });
      }

      // Get existing preferences to merge
      const existingPreferences = await this.personalizationService.getUserPreferences(userId);
      
      // Merge with existing preferences
      const mergedPreferences = {
        ...existingPreferences,
        ...preferences,
        updatedAt: new Date()
      };

      // Save updated preferences
      const savedPreferences = await this.personalizationService.saveUserPreferences(userId, mergedPreferences);

      const response = {
        success: true,
        data: {
          userId,
          preferences: savedPreferences,
          message: 'Preferences updated successfully'
        },
        metadata: {
          timestamp: new Date().toISOString(),
          operation: 'update'
        }
      };

      // Log analytics event
      this.firebaseService.logAnalyticsEvent('preferences_updated', {
        userId,
        updatedFields: Object.keys(preferences),
        interests: savedPreferences.interests,
        ageGroup: savedPreferences.ageGroup
      }, userId).catch(error => console.error('Error logging analytics:', error));

      res.json(response);

    } catch (error) {
      console.error('Error updating user preferences:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to update user preferences',
        message: error.message,
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Delete user preferences
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteUserPreferences(req, res) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          error: 'User ID is required',
          code: 'MISSING_USER_ID'
        });
      }

      const { getDb, Collections } = require('../config/firebase');
      const db = getDb();
      
      await db.collection(Collections.USER_PREFERENCES).doc(userId).delete();

      const response = {
        success: true,
        data: {
          message: 'Preferences deleted successfully'
        },
        metadata: {
          timestamp: new Date().toISOString(),
          operation: 'delete'
        }
      };

      // Log analytics event
      this.firebaseService.logAnalyticsEvent('preferences_deleted', {
        userId
      }, userId).catch(error => console.error('Error logging analytics:', error));

      res.json(response);

    } catch (error) {
      console.error('Error deleting user preferences:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to delete user preferences',
        message: error.message,
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Get preferences analytics and insights
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getPreferencesAnalytics(req, res) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          error: 'User ID is required',
          code: 'MISSING_USER_ID'
        });
      }

      const preferences = await this.personalizationService.getUserPreferences(userId);
      
      // Generate insights based on preferences
      const insights = {
        recommendedCategories: this.generateRecommendedCategories(preferences),
        personalityProfile: this.generatePersonalityProfile(preferences),
        optimalTimes: this.generateOptimalTimes(preferences),
        compatibleUsers: await this.findCompatibleUsers(preferences),
        improvementSuggestions: this.generateImprovementSuggestions(preferences)
      };

      const response = {
        success: true,
        data: {
          preferences,
          insights,
          analyticsGenerated: new Date().toISOString()
        }
      };

      res.json(response);

    } catch (error) {
      console.error('Error getting preferences analytics:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to get preferences analytics',
        message: error.message,
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Validate preferences data
   * @param {Object} body - Request body
   * @returns {Object} Validation result
   */
  validatePreferences(body) {
    if (!body || !body.preferences) {
      return { isValid: false, message: 'Preferences data is required' };
    }

    const { preferences } = body;

    // Validate interests
    if (preferences.interests && Array.isArray(preferences.interests)) {
      const availableInterests = this.personalizationService.getAvailableInterests();
      const invalidInterests = preferences.interests.filter(interest => 
        !availableInterests.includes(interest)
      );
      
      if (invalidInterests.length > 0) {
        return { 
          isValid: false, 
          message: `Invalid interests: ${invalidInterests.join(', ')}. Available: ${availableInterests.join(', ')}`
        };
      }
    }

    // Validate age group
    if (preferences.ageGroup) {
      const availableAgeGroups = this.personalizationService.getAvailableAgeGroups();
      if (!availableAgeGroups.includes(preferences.ageGroup)) {
        return { 
          isValid: false, 
          message: `Invalid age group: ${preferences.ageGroup}. Available: ${availableAgeGroups.join(', ')}`
        };
      }
    }

    // Validate preferred environment
    if (preferences.preferredEnvironment) {
      const validEnvironments = ['quiet', 'busy', 'trending', 'family-friendly', 'mixed'];
      if (!validEnvironments.includes(preferences.preferredEnvironment)) {
        return { 
          isValid: false, 
          message: `Invalid preferred environment: ${preferences.preferredEnvironment}. Available: ${validEnvironments.join(', ')}`
        };
      }
    }

    // Validate price range
    if (preferences.priceRange) {
      const validPriceRanges = ['budget', 'low', 'medium', 'comfortable', 'luxury'];
      if (!validPriceRanges.includes(preferences.priceRange)) {
        return { 
          isValid: false, 
          message: `Invalid price range: ${preferences.priceRange}. Available: ${validPriceRanges.join(', ')}`
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Generate recommended categories based on preferences
   * @param {Object} preferences - User preferences
   * @returns {Array} Recommended categories
   */
  generateRecommendedCategories(preferences) {
    const recommendations = [];
    
    // Based on interests
    if (preferences.interests.includes('food')) {
      recommendations.push({ category: 'Fine Dining', reason: 'Based on your food interest' });
      recommendations.push({ category: 'Local Cafes', reason: 'Discover hidden culinary gems' });
    }
    
    if (preferences.interests.includes('culture')) {
      recommendations.push({ category: 'Art Galleries', reason: 'Perfect for culture enthusiasts' });
      recommendations.push({ category: 'Museums', reason: 'Rich cultural experiences' });
    }

    // Based on age group
    if (preferences.ageGroup === 'young') {
      recommendations.push({ category: 'Nightlife', reason: 'Popular with your age group' });
      recommendations.push({ category: 'Trendy Spots', reason: 'Hip and happening places' });
    }

    return recommendations.slice(0, 5);
  }

  /**
   * Generate personality profile based on preferences
   * @param {Object} preferences - User preferences
   * @returns {Object} Personality profile
   */
  generatePersonalityProfile(preferences) {
    const profile = {
      explorerType: 'Balanced Explorer',
      socialStyle: 'Mixed',
      adventureLevel: 'Moderate'
    };

    // Determine explorer type
    if (preferences.interests.includes('culture') && preferences.interests.includes('history')) {
      profile.explorerType = 'Cultural Explorer';
    } else if (preferences.interests.includes('food') && preferences.interests.includes('nightlife')) {
      profile.explorerType = 'Social Explorer';
    } else if (preferences.interests.includes('nature') && preferences.preferredEnvironment === 'quiet') {
      profile.explorerType = 'Nature Seeker';
    }

    // Determine social style
    if (preferences.preferredEnvironment === 'busy' || preferences.preferredEnvironment === 'trending') {
      profile.socialStyle = 'Social Butterfly';
    } else if (preferences.preferredEnvironment === 'quiet') {
      profile.socialStyle = 'Peaceful Wanderer';
    }

    // Determine adventure level
    const adventureInterests = ['nightlife', 'entertainment', 'fitness'];
    const adventureCount = preferences.interests.filter(i => adventureInterests.includes(i)).length;
    
    if (adventureCount >= 2) {
      profile.adventureLevel = 'High Adventure';
    } else if (adventureCount === 0) {
      profile.adventureLevel = 'Relaxed Pace';
    }

    return profile;
  }

  /**
   * Generate optimal times based on preferences
   * @param {Object} preferences - User preferences
   * @returns {Object} Optimal times
   */
  generateOptimalTimes(preferences) {
    const ageGroupPrefs = this.personalizationService.ageGroupPreferences[preferences.ageGroup];
    
    return {
      preferredTime: ageGroupPrefs?.timePreference || 'flexible',
      bestDays: preferences.preferredEnvironment === 'quiet' ? ['Tuesday', 'Wednesday', 'Thursday'] : ['Friday', 'Saturday', 'Sunday'],
      avoidTimes: preferences.ageGroup === 'senior' ? ['Late evening', 'Early morning'] : [],
      seasonalPreferences: this.getSeasonalPreferences(preferences)
    };
  }

  /**
   * Find compatible users (simplified version)
   * @param {Object} preferences - User preferences
   * @returns {Promise<Array>} Compatible users
   */
  async findCompatibleUsers(preferences) {
    // This is a simplified implementation
    // In a real app, you'd query the database for users with similar preferences
    return [
      { compatibility: 85, commonInterests: ['food', 'culture'] },
      { compatibility: 78, commonInterests: ['food', 'shopping'] },
      { compatibility: 72, commonInterests: ['culture', 'history'] }
    ];
  }

  /**
   * Generate improvement suggestions
   * @param {Object} preferences - User preferences
   * @returns {Array} Improvement suggestions
   */
  generateImprovementSuggestions(preferences) {
    const suggestions = [];
    
    if (preferences.interests.length < 3) {
      suggestions.push({
        type: 'diversify',
        message: 'Consider adding more interests to get more diverse recommendations'
      });
    }
    
    if (!preferences.timePreference || preferences.timePreference === 'flexible') {
      suggestions.push({
        type: 'timing',
        message: 'Set specific time preferences to get better crowd-level recommendations'
      });
    }

    return suggestions;
  }

  /**
   * Get seasonal preferences
   * @param {Object} preferences - User preferences
   * @returns {Object} Seasonal preferences
   */
  getSeasonalPreferences(preferences) {
    const hasOutdoorInterests = preferences.interests.some(i => ['nature', 'fitness'].includes(i));
    
    return {
      spring: hasOutdoorInterests ? 'Outdoor activities and parks' : 'Indoor cultural events',
      summer: hasOutdoorInterests ? 'Outdoor dining and festivals' : 'Air-conditioned venues',
      fall: 'Museums and cozy cafes',
      winter: 'Indoor entertainment and warm restaurants'
    };
  }
}

// Create and export controller instance
const userPreferencesController = new UserPreferencesController();

module.exports = {
  getUserPreferences: userPreferencesController.getUserPreferences.bind(userPreferencesController),
  saveUserPreferences: userPreferencesController.saveUserPreferences.bind(userPreferencesController),
  updateUserPreferences: userPreferencesController.updateUserPreferences.bind(userPreferencesController),
  deleteUserPreferences: userPreferencesController.deleteUserPreferences.bind(userPreferencesController),
  getPreferencesAnalytics: userPreferencesController.getPreferencesAnalytics.bind(userPreferencesController)
};
