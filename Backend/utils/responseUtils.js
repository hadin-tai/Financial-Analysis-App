/**
 * Standardized API Response Utilities
 * Provides consistent response format across all controllers
 */

// ✅ Success Response Helper
export const successResponse = (res, data = null, message = 'Operation completed successfully', statusCode = 200) => {
  const response = {
    success: true,
    message,
    timestamp: new Date(),
    ...(data && { data })
  };

  return res.status(statusCode).json(response);
};

// ✅ Error Response Helper
export const errorResponse = (res, message = 'Operation failed', error = null, statusCode = 500) => {
  const response = {
    success: false,
    message,
    timestamp: new Date(),
    ...(error && { error: error.message || error })
  };

  return res.status(statusCode).json(response);
};

// ✅ Validation Error Response Helper
export const validationErrorResponse = (res, message = 'Validation failed', errors = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date(),
    error: 'Validation Error',
    ...(errors && { details: errors })
  };

  return res.status(400).json(response);
};

// ✅ Not Found Response Helper
export const notFoundResponse = (res, resource = 'Resource', message = null) => {
  const response = {
    success: false,
    message: message || `${resource} not found`,
    timestamp: new Date(),
    error: 'Not Found'
  };

  return res.status(404).json(response);
};

// ✅ Unauthorized Response Helper
export const unauthorizedResponse = (res, message = 'Unauthorized access') => {
  const response = {
    success: false,
    message,
    timestamp: new Date(),
    error: 'Unauthorized'
  };

  return res.status(401).json(response);
};

// ✅ Forbidden Response Helper
export const forbiddenResponse = (res, message = 'Access forbidden') => {
  const response = {
    success: false,
    message,
    timestamp: new Date(),
    error: 'Forbidden'
  };

  return res.status(403).json(response);
};

// ✅ Pagination Response Helper
export const paginatedResponse = (res, data, pagination, message = 'Data retrieved successfully') => {
  const response = {
    success: true,
    message,
    timestamp: new Date(),
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
      hasNext: pagination.page * pagination.limit < pagination.total,
      hasPrev: pagination.page > 1
    }
  };

  return res.json(response);
};

// ✅ File Upload Success Response Helper
export const fileUploadResponse = (res, count, totalAmount = null, message = 'File uploaded successfully') => {
  const response = {
    success: true,
    message,
    timestamp: new Date(),
    data: {
      uploaded: count,
      ...(totalAmount && { totalAmount })
    }
  };

  return res.json(response);
};

// ✅ CRUD Operation Response Helpers
export const createResponse = (res, data, message = 'Resource created successfully') => {
  return successResponse(res, data, message, 201);
};

export const updateResponse = (res, data, message = 'Resource updated successfully') => {
  return successResponse(res, data, message, 200);
};

export const deleteResponse = (res, id, message = 'Resource deleted successfully') => {
  return successResponse(res, { deletedId: id }, message, 200);
};

// ✅ Data Retrieval Response Helper
export const dataResponse = (res, data, message = 'Data retrieved successfully') => {
  return successResponse(res, data, message, 200);
};

// ✅ Standard Error Status Codes
export const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// ✅ Standard Error Messages
export const ERROR_MESSAGES = {
  VALIDATION_FAILED: 'Validation failed',
  NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  INTERNAL_ERROR: 'Internal server error',
  FILE_UPLOAD_ERROR: 'File upload failed',
  INVALID_FORMAT: 'Invalid data format',
  MISSING_FIELDS: 'Required fields are missing',
  DUPLICATE_ENTRY: 'Resource already exists',
  INVALID_ID: 'Invalid resource ID'
};
