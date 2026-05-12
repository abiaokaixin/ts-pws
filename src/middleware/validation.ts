import { Request, Response, NextFunction } from 'express';
import { AppError } from './error-handler.js';

/**
 * Require specific body fields to be present.
 */
export function requireBody(...fields: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const missing = fields.filter(f => req.body[f] === undefined);
    if (missing.length > 0) {
      throw new AppError(
        `Missing required fields: ${missing.join(', ')}`,
        400,
        'MISSING_FIELDS'
      );
    }
    next();
  };
}

/**
 * Require specific query params to be present.
 */
export function requireQuery(...fields: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const missing = fields.filter(f => req.query[f] === undefined);
    if (missing.length > 0) {
      throw new AppError(
        `Missing required query params: ${missing.join(', ')}`,
        400,
        'MISSING_QUERY_PARAMS'
      );
    }
    next();
  };
}

/**
 * Validate that a string is a valid URL.
 */
export function validUrl(field: string = 'url') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const url = req.body[field] || req.query[field];
    if (!url) {
      throw new AppError(`Field '${field}' is required`, 400, 'MISSING_FIELD');
    }
    try {
      new URL(url);
    } catch {
      throw new AppError(`Invalid URL: ${url}`, 400, 'INVALID_URL');
    }
    next();
  };
}

/**
 * Validate numeric parameter is within range.
 */
export function validateIntRange(
  field: string,
  min: number,
  max: number,
  source: 'body' | 'query' = 'body'
) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const val = source === 'body' ? req.body[field] : req.query[field];
    if (val === undefined) return next();
    const num = parseInt(val, 10);
    if (isNaN(num) || num < min || num > max) {
      throw new AppError(
        `Field '${field}' must be an integer between ${min} and ${max}`,
        400,
        'INVALID_RANGE'
      );
    }
    next();
  };
}