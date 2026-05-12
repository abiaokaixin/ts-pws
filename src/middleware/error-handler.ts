import { Request, Response, NextFunction } from 'express';
import type { ApiResponse } from '../browser/types.js';

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public errorCode?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    const body: ApiResponse = {
      success: false,
      error: err.message,
      errorCode: err.errorCode,
    };
    res.status(err.statusCode).json(body);
    return;
  }

  console.error('[ws-service] Unhandled error:', err);

  const body: ApiResponse = {
    success: false,
    error: err.message || 'Internal server error',
    errorCode: 'INTERNAL_ERROR',
  };
  res.status(500).json(body);
}