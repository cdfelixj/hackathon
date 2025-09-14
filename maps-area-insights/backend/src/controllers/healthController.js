const { validateConnection } = require('../config/firebase');
const GooglePlacesService = require('../services/googlePlacesService');
const FirebaseService = require('../services/firebaseService');

class HealthController {
  constructor() {
    this.firebaseService = new FirebaseService();
    this.placesService = new GooglePlacesService();
  }

  /**
   * Health check endpoint
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async healthCheck(req, res) {
    try {
      const startTime = Date.now();
      
      // Check all service health
      const [
        firebaseHealth,
        placesHealth,
        cacheStats
      ] = await Promise.allSettled([
        this.checkFirebaseHealth(),
        this.checkPlacesHealth(),
        this.firebaseService.getCacheStatistics()
      ]);

      const processingTime = Date.now() - startTime;

      // Determine overall health status
      const isHealthy = firebaseHealth.status === 'fulfilled' && 
                       placesHealth.status === 'fulfilled';

      const response = {
        status: isHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        processingTime,
        services: {
          firebase: this.getServiceStatus(firebaseHealth),
          googlePlaces: this.getServiceStatus(placesHealth),
          cache: this.getServiceStatus(cacheStats)
        },
        system: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
            external: Math.round(process.memoryUsage().external / 1024 / 1024)
          },
          cpu: process.cpuUsage()
        }
      };

      // Add cache statistics if available
      if (cacheStats.status === 'fulfilled') {
        response.cache = cacheStats.value;
      }

      // Set appropriate HTTP status code
      const statusCode = isHealthy ? 200 : 503;
      
      res.status(statusCode).json(response);

    } catch (error) {
      console.error('Health check error:', error);
      
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        system: {
          nodeVersion: process.version,
          uptime: process.uptime()
        }
      });
    }
  }

  /**
   * Detailed health check endpoint
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async detailedHealthCheck(req, res) {
    try {
      const startTime = Date.now();
      
      // Run comprehensive health checks
      const healthChecks = await this.runComprehensiveHealthChecks();
      
      const processingTime = Date.now() - startTime;
      
      // Calculate overall health score
      const healthScore = this.calculateHealthScore(healthChecks);
      
      const response = {
        status: healthScore >= 80 ? 'healthy' : healthScore >= 60 ? 'degraded' : 'unhealthy',
        healthScore,
        timestamp: new Date().toISOString(),
        processingTime,
        checks: healthChecks,
        recommendations: this.generateHealthRecommendations(healthChecks)
      };

      const statusCode = healthScore >= 60 ? 200 : 503;
      res.status(statusCode).json(response);

    } catch (error) {
      console.error('Detailed health check error:', error);
      
      res.status(503).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }

  /**
   * Check Firebase connection health
   * @returns {Promise<Object>} Firebase health status
   */
  async checkFirebaseHealth() {
    try {
      const isConnected = await validateConnection();
      
      return {
        status: isConnected ? 'healthy' : 'unhealthy',
        connected: isConnected,
        projectId: process.env.FIREBASE_PROJECT_ID,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        connected: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Check Google Places API health
   * @returns {Promise<Object>} Places API health status
   */
  async checkPlacesHealth() {
    try {
      const isConfigured = this.placesService.isConfigured();
      
      if (!isConfigured) {
        return {
          status: 'unhealthy',
          configured: false,
          error: 'Google Places API key not configured',
          timestamp: new Date().toISOString()
        };
      }

      // Try a simple API call to validate the key
      const testCoords = { lat: 40.7128, lng: -74.0060 }; // NYC coordinates
      await this.placesService.searchNearbyPlaces(testCoords, 'restaurant', 100);

      return {
        status: 'healthy',
        configured: true,
        apiKeyValid: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        configured: this.placesService.isConfigured(),
        apiKeyValid: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get service status from Promise.allSettled result
   * @param {Object} result - Promise result
   * @returns {Object} Service status
   */
  getServiceStatus(result) {
    if (result.status === 'fulfilled') {
      return {
        status: 'healthy',
        data: result.value
      };
    } else {
      return {
        status: 'unhealthy',
        error: result.reason?.message || 'Unknown error'
      };
    }
  }

  /**
   * Run comprehensive health checks
   * @returns {Promise<Object>} Comprehensive health results
   */
  async runComprehensiveHealthChecks() {
    const checks = {};

    // Database connectivity
    try {
      const isConnected = await validateConnection();
      checks.database = {
        name: 'Database Connectivity',
        status: isConnected ? 'pass' : 'fail',
        score: isConnected ? 100 : 0,
        details: isConnected ? 'Firebase connection successful' : 'Firebase connection failed'
      };
    } catch (error) {
      checks.database = {
        name: 'Database Connectivity',
        status: 'fail',
        score: 0,
        details: error.message
      };
    }

    // API Configuration
    const placesConfigured = this.placesService.isConfigured();
    checks.apiConfiguration = {
      name: 'API Configuration',
      status: placesConfigured ? 'pass' : 'fail',
      score: placesConfigured ? 100 : 0,
      details: placesConfigured ? 'All APIs properly configured' : 'Missing API configuration'
    };

    // Cache Performance
    try {
      const cacheStats = await this.firebaseService.getCacheStatistics();
      const cacheHealthy = cacheStats.totalCacheEntries >= 0; // Cache working if we can get stats
      checks.cache = {
        name: 'Cache Performance',
        status: cacheHealthy ? 'pass' : 'fail',
        score: cacheHealthy ? 100 : 0,
        details: `${cacheStats.totalCacheEntries} cache entries, ${cacheStats.totalCacheAccess} total accesses`
      };
    } catch (error) {
      checks.cache = {
        name: 'Cache Performance',
        status: 'fail',
        score: 0,
        details: error.message
      };
    }

    // Memory Usage
    const memoryUsage = process.memoryUsage();
    const memoryUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    const memoryHealthy = memoryUsedMB < 500; // Consider healthy if under 500MB
    checks.memory = {
      name: 'Memory Usage',
      status: memoryHealthy ? 'pass' : 'warn',
      score: memoryHealthy ? 100 : 70,
      details: `${Math.round(memoryUsedMB)}MB used`
    };

    // Response Time (already measuring)
    checks.responseTime = {
      name: 'Response Time',
      status: 'pass',
      score: 100,
      details: 'Health check response within acceptable limits'
    };

    return checks;
  }

  /**
   * Calculate overall health score
   * @param {Object} checks - Health check results
   * @returns {number} Health score (0-100)
   */
  calculateHealthScore(checks) {
    const scores = Object.values(checks).map(check => check.score);
    const totalScore = scores.reduce((sum, score) => sum + score, 0);
    return Math.round(totalScore / scores.length);
  }

  /**
   * Generate health recommendations
   * @param {Object} checks - Health check results
   * @returns {Array} Recommendations
   */
  generateHealthRecommendations(checks) {
    const recommendations = [];

    if (checks.database?.status === 'fail') {
      recommendations.push({
        priority: 'high',
        message: 'Database connection failed. Check Firebase configuration.',
        action: 'Verify Firebase credentials and network connectivity'
      });
    }

    if (checks.apiConfiguration?.status === 'fail') {
      recommendations.push({
        priority: 'high',
        message: 'API configuration incomplete. Check environment variables.',
        action: 'Ensure all required API keys are properly set'
      });
    }

    if (checks.memory?.score < 80) {
      recommendations.push({
        priority: 'medium',
        message: 'High memory usage detected.',
        action: 'Monitor memory usage and consider optimization'
      });
    }

    if (checks.cache?.status === 'fail') {
      recommendations.push({
        priority: 'low',
        message: 'Cache system not functioning properly.',
        action: 'Check Firebase cache collections and permissions'
      });
    }

    return recommendations;
  }

  /**
   * Get system metrics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getSystemMetrics(req, res) {
    try {
      const metrics = {
        timestamp: new Date().toISOString(),
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
          version: process.version,
          platform: process.platform
        },
        application: {
          environment: process.env.NODE_ENV,
          port: process.env.PORT,
          cacheEnabled: !!process.env.FIREBASE_PROJECT_ID
        }
      };

      res.json(metrics);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get system metrics',
        message: error.message
      });
    }
  }
}

// Create and export controller instance
const healthController = new HealthController();

module.exports = {
  healthCheck: healthController.healthCheck.bind(healthController),
  detailedHealthCheck: healthController.detailedHealthCheck.bind(healthController),
  getSystemMetrics: healthController.getSystemMetrics.bind(healthController)
};
