import { errorResponse, STATUS_CODES } from '../utils/responseUtils.js';

/**
 * Global Error Handling Middleware
 * Provides consistent error responses across the application
 */

// ✅ Async Error Handler Wrapper
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// ✅ Global Error Handler
export const globalErrorHandler = (err, req, res, next) => {
  console.error('❌ Global Error:', err);

  // Default error values
  let statusCode = STATUS_CODES.INTERNAL_SERVER_ERROR;
  let message = 'Internal server error';
  let error = err.message || err;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = STATUS_CODES.BAD_REQUEST;
    message = 'Validation failed';
    error = Object.values(err.errors).map(e => e.message).join(', ');
  } else if (err.name === 'CastError') {
    statusCode = STATUS_CODES.BAD_REQUEST;
    message = 'Invalid ID format';
    error = 'The provided ID is not valid';
  } else if (err.code === 11000) {
    statusCode = STATUS_CODES.CONFLICT;
    message = 'Duplicate entry';
    error = 'A record with this information already exists';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = STATUS_CODES.UNAUTHORIZED;
    message = 'Invalid token';
    error = 'Authentication token is invalid';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = STATUS_CODES.UNAUTHORIZED;
    message = 'Token expired';
    error = 'Authentication token has expired';
  } else if (err.name === 'MulterError') {
    statusCode = STATUS_CODES.BAD_REQUEST;
    message = 'File upload error';
    error = err.message;
  }

  // Send standardized error response
  return errorResponse(res, message, error, statusCode);
};

// ✅ 404 Handler for undefined routes
export const notFoundHandler = (req, res) => {
  return res.status(STATUS_CODES.NOT_FOUND).json({
    success: false,
    message: 'Route not found',
    error: `Cannot ${req.method} ${req.originalUrl}`,
    timestamp: new Date()
  });
};

// ✅ Request Validation Middleware
export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Request validation failed',
        error: error.details.map(detail => detail.message).join(', '),
        timestamp: new Date()
      });
    }
    next();
  };
};

// ✅ Rate Limiting Error Handler
export const rateLimitErrorHandler = (req, res) => {
  return res.status(STATUS_CODES.SERVICE_UNAVAILABLE).json({
    success: false,
    message: 'Too many requests',
    error: 'Rate limit exceeded. Please try again later.',
    timestamp: new Date()
  });
};

// ✅ Database Connection Error Handler
export const dbErrorHandler = (err, req, res, next) => {
  if (err.name === 'MongoError' || err.name === 'MongooseError') {
    console.error('❌ Database Error:', err);
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Database operation failed',
      error: 'A database error occurred. Please try again later.',
      timestamp: new Date()
    });
  }
  next(err);
};

// ✅ File Upload Error Handler
export const fileUploadErrorHandler = (err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(STATUS_CODES.BAD_REQUEST).json({
      success: false,
      message: 'File too large',
      error: 'The uploaded file exceeds the maximum allowed size.',
      timestamp: new Date()
    });
  }
  
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(STATUS_CODES.BAD_REQUEST).json({
      success: false,
      message: 'Too many files',
      error: 'Only one file can be uploaded at a time.',
      timestamp: new Date()
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(STATUS_CODES.BAD_REQUEST).json({
      success: false,
      message: 'Unexpected file field',
      error: 'The file upload field name is incorrect.',
      timestamp: new Date()
    });
  }

  next(err);
};
