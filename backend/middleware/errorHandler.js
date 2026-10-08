const logger = require("../utils/logger");
const { sendErrorEmail } = require("../utils/notifier");

// Custom error classes
class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors = {}) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

class ExternalAPIError extends AppError {
  constructor(message, service, originalError = null) {
    super(message, 502, 'EXTERNAL_API_ERROR');
    this.service = service;
    this.originalError = originalError;
  }
}

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error details
  const errorContext = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    timestamp: new Date().toISOString(),
    stack: err.stack
  };

  // Handle different types of errors
  if (err.name === 'CastError') {
    const message = 'Invalid resource ID';
    error = new ValidationError(message);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate value for ${field}`;
    error = new ConflictError(message);
  }

  if (err.name === 'ValidationError') {
    const errors = {};
    Object.values(err.errors).forEach(val => {
      errors[val.path] = val.message;
    });
    error = new ValidationError('Validation failed', errors);
  }

  if (err.name === 'JsonWebTokenError') {
    error = new AuthenticationError('Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    error = new AuthenticationError('Token expired');
  }

  // Log based on severity
  if (error.statusCode >= 500) {
    logger.error(`Server Error: ${error.message}`, errorContext);
    
    // Send email notification for critical errors
    if (process.env.NODE_ENV === 'production') {
      sendErrorEmail(error.message, errorContext).catch(emailErr => {
        logger.error(`Failed to send error notification email: ${emailErr.message}`);
      });
    }
  } else if (error.statusCode >= 400) {
    logger.warn(`Client Error: ${error.message}`, {
      method: req.method,
      url: req.originalUrl,
      userId: req.user?.id,
      statusCode: error.statusCode
    });
  }

  // Prepare error response
  const errorResponse = {
    success: false,
    error: {
      message: error.message || 'Internal server error',
      code: error.code || 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    }
  };

  // Add validation errors if present
  if (error.errors) {
    errorResponse.error.errors = error.errors;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
  }

  // Send error response
  res.status(error.statusCode || 500).json(errorResponse);
};

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 404 handler
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ExternalAPIError,
  errorHandler,
  asyncHandler,
  notFoundHandler
};