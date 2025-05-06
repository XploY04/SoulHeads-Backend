// filepath: c:\Users\YASH\Documents\Github\SoulHeads\utils\errorHandler.js
const logger = require("./logger");

/**
 * Custom error class with HTTP status code and additional details
 */
class AppError extends Error {
  constructor(message, statusCode, errorCode = "", details = {}) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true; // Indicates known operational error vs programming error

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Centralized error handling functions
 */
const handleError = (err, req, res, next) => {
  // Default to 500 internal server error
  const statusCode = err.statusCode || 500;
  const errorCode = err.errorCode || "SERVER_ERROR";
  const details = err.details || {};

  // Only log detailed error info for non-operational/unexpected errors
  if (!err.isOperational) {
    logger.error({
      message: err.message,
      stack: err.stack,
      path: req?.path,
      method: req?.method,
      statusCode,
      errorCode,
      details,
      user: req?.user?._id || "anonymous",
      ip: req?.ip,
    });
  } else {
    // For expected errors, log with less detail/lower level
    logger.warn({
      message: err.message,
      errorCode,
      statusCode,
      path: req?.path,
      method: req?.method,
      user: req?.user?._id || "anonymous",
    });
  }

  // Don't expose stack traces in production
  const response = {
    success: false,
    message: err.message || "Something went wrong",
    errorCode,
    ...(Object.keys(details).length > 0 && { details }),
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
};

/**
 * Helper function for creating common types of errors
 */
const errorTypes = {
  validation: (message, details) =>
    new AppError(
      message || "Validation error",
      400,
      "VALIDATION_ERROR",
      details
    ),
  notFound: (resource) =>
    new AppError(`${resource || "Resource"} not found`, 404, "NOT_FOUND"),
  unauthorized: (message) =>
    new AppError(message || "Unauthorized access", 401, "UNAUTHORIZED"),
  forbidden: (message) =>
    new AppError(message || "Forbidden", 403, "FORBIDDEN"),
  conflict: (message, details) =>
    new AppError(message || "Resource conflict", 409, "CONFLICT", details),
  internal: (message) =>
    new AppError(message || "Internal server error", 500, "SERVER_ERROR"),
};

/**
 * Async error handler wrapper to avoid try/catch blocks
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  AppError,
  handleError,
  errorTypes,
  catchAsync,
};
