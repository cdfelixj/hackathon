const axios = require('axios');

class GooglePlacesService {
  constructor() {
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY;
    this.baseUrl = 'https://maps.googleapis.com/maps/api/place';
    this.defaultRadius = parseInt(process.env.PLACES_SEARCH_RADIUS) || 3000;
    this.maxResults = parseInt(process.env.MAX_PLACES_RESULTS) || 20;
    
    if (!this.apiKey) {
      throw new Error('Google Places API key is required');
    }
  }

  /**
   * Search for nearby places based on coordinates
   * @param {Object} coords - Latitude and longitude
   * @param {string} type - Place type (restaurant, tourist_attraction, etc.)
   * @param {number} radius - Search radius in meters
   * @returns {Promise<Array>} Array of places
   */
  async searchNearbyPlaces(coords, type = null, radius = this.defaultRadius) {
    try {
      const params = {
        location: `${coords.lat},${coords.lng}`,
        radius: radius,
        key: this.apiKey,
        fields: 'place_id,name,geometry,rating,user_ratings_total,price_level,types,vicinity,photos,business_status,opening_hours'
      };

      if (type) {
        params.type = type;
      }

      const response = await axios.get(`${this.baseUrl}/nearbysearch/json`, {
        params,
        timeout: 10000
      });

      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        throw new Error(`Google Places API error: ${response.data.status} - ${response.data.error_message || 'Unknown error'}`);
      }

      return response.data.results || [];
    } catch (error) {
      console.error('Error searching nearby places:', error.message);
      throw new Error(`Failed to search nearby places: ${error.message}`);
    }
  }

  /**
   * Get detailed information about a specific place
   * @param {string} placeId - Google Place ID
   * @returns {Promise<Object>} Detailed place information
   */
  async getPlaceDetails(placeId) {
    try {
      const params = {
        place_id: placeId,
        key: this.apiKey,
        fields: 'place_id,name,formatted_address,geometry,rating,user_ratings_total,price_level,types,opening_hours,website,formatted_phone_number,photos,reviews,url,utc_offset'
      };

      const response = await axios.get(`${this.baseUrl}/details/json`, {
        params,
        timeout: 10000
      });

      if (response.data.status !== 'OK') {
        throw new Error(`Google Places API error: ${response.data.status} - ${response.data.error_message || 'Unknown error'}`);
      }

      return response.data.result;
    } catch (error) {
      console.error('Error getting place details:', error.message);
      throw new Error(`Failed to get place details: ${error.message}`);
    }
  }

  /**
   * Get comprehensive area insights including landmarks, restaurants, and attractions
   * @param {Object} coords - Latitude and longitude
   * @returns {Promise<Object>} Comprehensive area data
   */
  async getAreaInsights(coords) {
    try {
      const [
        landmarks,
        restaurants,
        attractions,
        entertainment,
        shopping
      ] = await Promise.allSettled([
        this.searchNearbyPlaces(coords, 'establishment'),
        this.searchNearbyPlaces(coords, 'restaurant'),
        this.searchNearbyPlaces(coords, 'tourist_attraction'),
        this.searchNearbyPlaces(coords, 'night_club'),
        this.searchNearbyPlaces(coords, 'shopping_mall')
      ]);

      // Process results and handle errors gracefully
      const processResult = (result, type) => {
        if (result.status === 'fulfilled') {
          return result.value.slice(0, 10); // Limit to top 10 results
        } else {
          console.warn(`Failed to fetch ${type}:`, result.reason.message);
          return [];
        }
      };

      return {
        landmarks: processResult(landmarks, 'landmarks'),
        restaurants: processResult(restaurants, 'restaurants'),
        attractions: processResult(attractions, 'attractions'),
        entertainment: processResult(entertainment, 'entertainment'),
        shopping: processResult(shopping, 'shopping'),
        coordinates: coords,
        searchRadius: this.defaultRadius,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting area insights:', error.message);
      throw new Error(`Failed to get area insights: ${error.message}`);
    }
  }

  /**
   * Get places with specific characteristics (highly rated, popular, etc.)
   * @param {Object} coords - Latitude and longitude
   * @param {Object} filters - Filtering criteria
   * @returns {Promise<Array>} Filtered places
   */
  async getFilteredPlaces(coords, filters = {}) {
    try {
      const places = await this.searchNearbyPlaces(coords);
      
      return places.filter(place => {
        // Filter by minimum rating
        if (filters.minRating && place.rating < filters.minRating) {
          return false;
        }

        // Filter by minimum review count
        if (filters.minReviews && place.user_ratings_total < filters.minReviews) {
          return false;
        }

        // Filter by business status
        if (filters.openOnly && place.business_status !== 'OPERATIONAL') {
          return false;
        }

        // Filter by place types
        if (filters.types && filters.types.length > 0) {
          const hasMatchingType = filters.types.some(type => 
            place.types.includes(type)
          );
          if (!hasMatchingType) {
            return false;
          }
        }

        // Filter by price level
        if (filters.maxPriceLevel && place.price_level > filters.maxPriceLevel) {
          return false;
        }

        return true;
      }).sort((a, b) => {
        // Sort by rating and review count
        const scoreA = (a.rating || 0) * Math.log(a.user_ratings_total || 1);
        const scoreB = (b.rating || 0) * Math.log(b.user_ratings_total || 1);
        return scoreB - scoreA;
      });
    } catch (error) {
      console.error('Error getting filtered places:', error.message);
      throw new Error(`Failed to get filtered places: ${error.message}`);
    }
  }

  /**
   * Get photo URL for a place
   * @param {Object} photo - Photo reference from Google Places
   * @param {number} maxWidth - Maximum width of the photo
   * @returns {string} Photo URL
   */
  getPhotoUrl(photo, maxWidth = 400) {
    if (!photo || !photo.photo_reference) {
      return null;
    }

    return `${this.baseUrl}/photo?maxwidth=${maxWidth}&photoreference=${photo.photo_reference}&key=${this.apiKey}`;
  }

  /**
   * Check if the service is properly configured
   * @returns {boolean} True if service is ready
   */
  isConfigured() {
    return !!this.apiKey;
  }

  /**
   * Get service status and configuration
   * @returns {Object} Service status
   */
  getStatus() {
    return {
      configured: this.isConfigured(),
      apiKey: this.apiKey ? `${this.apiKey.substring(0, 8)}...` : 'Not set',
      defaultRadius: this.defaultRadius,
      maxResults: this.maxResults
    };
  }
}

module.exports = GooglePlacesService;
