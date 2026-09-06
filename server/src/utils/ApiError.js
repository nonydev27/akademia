/**
 * utils/ApiError.js — a small typed error class controllers/services can throw.
 *
 * TODO:
 * - Extend Error, accept (statusCode, publicMessage, details?).
 * - Add static helpers for common cases used throughout the app, e.g.:
 *     ApiError.notFound('Student not found')
 *     ApiError.forbidden('You cannot access this tenant\'s data')
 *     ApiError.badRequest('Validation failed', zodErrorDetails)
 * - middleware/error.middleware.js should check `err instanceof ApiError` and
 *   use err.statusCode + err.publicMessage directly; anything else falls
 *   back to a generic 500.
 */

export class ApiError extends Error {
  constructor(statusCode, publicMessage, details) {
    super(publicMessage);
    this.statusCode = statusCode;
    this.publicMessage = publicMessage;
    this.details = details;
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message);
  }

  static badRequest(message = 'Bad request', details) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = 'Not authenticated') {
    return new ApiError(401, message);
  }
}
