import { ZodError } from 'zod';

/**
 * Standardized error handling middleware
 */
export function errorHandler(err, req, res, next) {
  // Handle Zod Validation Errors
  if (err.name === 'ZodError' || err instanceof ZodError) {
    const issues = err.issues || err.errors || [];
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: issues.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      },
    });
  }

  // Handle Prisma Known Request Errors
  if (err.code && typeof err.code === 'string' && err.code.startsWith('P')) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'UNIQUE_CONSTRAINT_FAILED',
          message: 'A record with this value already exists',
          details: err.meta,
        },
      });
    }

    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'The requested resource was not found',
        },
      });
    }
  }

  // Handle Generic / Custom HTTP Errors
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  if (process.env.NODE_ENV !== 'production' && status === 500) {
    console.error('[Error Details]:', err);
  }

  return res.status(status).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: status === 500 && process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : message,
    },
  });
}
