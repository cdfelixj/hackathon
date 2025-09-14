/**
 * Global error handling middleware for Maps Area Insights Backend
 */

/**
 * Error handler middleware
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function errorMiddleware(error, req, res, next) {
  // Log error details
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
    userAgent: req.headers['user-agent'],
    ip: req.ip
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Default error response
  let statusCode = error.statusCode || 500;
  let errorResponse = {
    success: false,
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    code: 'INTERNAL_SERVER_ERROR',
    timestamp: new Date().toISOString(),
    requestId: req.id || generateRequestId()
  };

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    errorResponse = {
      ...errorResponse,
      error: 'Validation Error',
      message: error.message,
      code: 'VALIDATION_ERROR'
    };
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    errorResponse = {
      ...errorResponse,
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'UNAUTHORIZED'
    };
  } else if (error.name === 'ForbiddenError') {
    statusCode = 403;
    errorResponse = {
      ...errorResponse,
      error: 'Forbidden',
      message: 'Access denied',
      code: 'FORBIDDEN'
    };
  } else if (error.name === 'NotFoundError') {
    statusCode = 404;
    errorResponse = {
      ...errorResponse,
      error: 'Not Found',
      message: error.message || 'Resource not found',
      code: 'NOT_FOUND'
    };
  } else if (error.name === 'MongoError' || error.name === 'FirebaseError') {
    statusCode = 503;
    errorResponse = {
      ...errorResponse,
      error: 'Service Unavailable',
      message: 'Database service temporarily unavailable',
      code: 'SERVICE_UNAVAILABLE'
    };
  } else if (error.message && error.message.includes('Google Places API')) {
    statusCode = 503;
    errorResponse = {
      ...errorResponse,
      error: 'External Service Error',
      message: 'Places service temporarily unavailable',
      code: 'EXTERNAL_SERVICE_ERROR'
    };
  } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    statusCode = 503;
    errorResponse = {
      ...errorResponse,
      error: 'Service Unavailable',
      message: 'External service connection failed',
      code: 'CONNECTION_ERROR'
    };
  } else if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
    statusCode = 400;
    errorResponse = {
      ...errorResponse,
      error: 'Bad Request',
      message: 'Invalid JSON in request body',
      code: 'INVALID_JSON'
    };
  } else if (error.type === 'entity.too.large') {
    statusCode = 413;
    errorResponse = {
      ...errorResponse,
      error: 'Payload Too Large',
      message: 'Request body too large',
      code: 'PAYLOAD_TOO_LARGE'
    };
  }

  // Add development-only error details
  if (isDevelopment) {
    errorResponse.debug = {
      stack: error.stack,
      originalError: error.message,
      errorName: error.name
    };
  }

  // Add suggestion for common errors
  errorResponse.suggestion = getErrorSuggestion(statusCode, error);

  // Send error response
  res.status(statusCode).json(errorResponse);
}

/**
 * Handle 404 errors for undefined routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function notFoundHandler(req, res) {
  const errorResponse = {
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    code: 'ROUTE_NOT_FOUND',
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'GET /health',
      'POST /api/area-insights',
      'GET /api/user/preferences/:userId',
      'POST /api/user/preferences',
      'PUT /api/user/preferences/:userId'
    ]
  };

  res.status(404).json(errorResponse);
}

/**
 * Handle uncaught exceptions
 * @param {Error} error - Uncaught exception
 */
function handleUncaughtException(error) {
  console.error('Uncaught Exception:', {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });

  // Graceful shutdown
  process.exit(1);
}

/**
 * Handle unhandled promise rejections
 * @param {Error} reason - Rejection reason
 * @param {Promise} promise - Rejected promise
 */
function handleUnhandledRejection(reason, promise) {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  
  // Close server gracefully
  process.exit(1);
}

/**
 * Generate request ID for error tracking
 * @returns {string} Request ID
 */
function generateRequestId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Get error suggestion based on status code and error
 * @param {number} statusCode - HTTP status code
 * @param {Error} error - Error object
 * @returns {string} Error suggestion
 */
function getErrorSuggestion(statusCode, error) {
  switch (statusCode) {
    case 400:
      return 'Check your request data format and ensure all required fields are provided.';
    case 401:
      return 'Include valid authentication credentials in your request.';
    case 403:
      return 'Ensure you have the necessary permissions to access this resource.';
    case 404:
      return 'Verify the URL path and check available endpoints.';
    case 413:
      return 'Reduce the size of your request body.';
    case 429:
      return 'Wait before making another request. You have exceeded the rate limit.';
    case 500:
      if (error.message && error.message.includes('Firebase')) {
        return 'Check Firebase configuration and network connectivity.';
      } else if (error.message && error.message.includes('Google')) {
        return 'Verify Google API keys and quotas.';
      }
      return 'Try again later. If the problem persists, contact support.';
    case 503:
      return 'The service is temporarily unavailable. Please try again in a few moments.';
    default:
      return 'Please try again or contact support if the issue persists.';
  }
}

/**
 * Create a custom error with status code
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {string} code - Error code
 * @returns {Error} Custom error
 */
function createError(message, statusCode = 500, code = 'INTERNAL_ERROR') {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

/**
 * Async error wrapper for route handlers
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
function asyncErrorHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Setup global error handlers
process.on('uncaughtException', handleUncaughtException);
process.on('unhandledRejection', handleUnhandledRejection);

module.exports = {
  errorMiddleware,
  notFoundHandler,
  createError,
  asyncErrorHandler,
  handleUncaughtException,
  handleUnhandledRejection
};
