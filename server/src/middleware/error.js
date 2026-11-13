import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

/** 404 handler for unmatched routes. */
export function notFound(req, _res, next) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}

/** Central error handler: normalises Mongoose, JWT and validation errors. */
// eslint-disable-next-line no-unused-vars
export function errorHandler(error, req, res, _next) {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Something went wrong';
  let details = error.details;

  if (error.name === 'ValidationError') {
    statusCode = 400;
    details = Object.values(error.errors).map((err) => ({ field: err.path, message: err.message }));
    message = 'Validation failed';
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for ${error.path}`;
  } else if (error.code === 11000) {
    statusCode = 409;
    const field = Object.keys(error.keyValue || {})[0] || 'field';
    message = `That ${field} is already taken`;
    details = error.keyValue;
  } else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Invalid or expired token';
  }

  if (statusCode >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl}`, error);
    if (env.isProd) message = 'Internal server error';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
  });
}
