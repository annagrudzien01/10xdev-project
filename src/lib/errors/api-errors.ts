/**
 * Custom error classes for API error handling
 *
 * These errors are used throughout the application to provide consistent
 * error responses with appropriate HTTP status codes.
 */

/**
 * ValidationError - Thrown when request data fails validation
 * Maps to HTTP 400 Bad Request
 */
export class ValidationError extends Error {
  constructor(public details: Record<string, string>) {
    super("Validation failed");
    this.name = "ValidationError";
  }
}

/**
 * ConflictError - Thrown when operation conflicts with existing data
 * Maps to HTTP 409 Conflict
 *
 * Examples:
 * - Duplicate profile name
 * - Maximum profile limit exceeded
 * - Unique constraint violations
 */
export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

/**
 * UnauthorizedError - Thrown when authentication is required or fails
 * Maps to HTTP 401 Unauthorized
 */
export class UnauthorizedError extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * ForbiddenError - Thrown when user doesn't have permission to access resource
 * Maps to HTTP 403 Forbidden
 */
export class ForbiddenError extends Error {
  constructor(message = "Access forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * NotFoundError - Thrown when requested resource doesn't exist
 * Maps to HTTP 404 Not Found
 */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}
