import { Request, Response, NextFunction } from 'express';
import { ENV } from '../config/env';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log internally for debugging, never expose to client
  console.error('Unhandled Server Error:', {
    message: err.message,
    name: err.name,
    path: req.path,
    method: req.method,
    stack: ENV.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Handle specific known error types safely
  if (err.type === 'entity.parse.failed') {
    res.status(400).json({
      success: false,
      message: 'Malformed JSON payload provided.',
    });
    return;
  }

  // Generic sanitized response
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.isOperational
      ? err.message
      : 'An unexpected internal security error occurred. Please try again later.',
  });
};
