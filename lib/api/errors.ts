/**
 * Error handling for the Laravel API.
 *
 * Two backend conventions shape everything here:
 *
 * 1. Field detail lives in `errors: { field: [message, ...] }`, both for
 *    FormRequest failures and for domain errors thrown as ValidationException.
 * 2. A missing record is NOT a 404. Every admin service throws
 *    ValidationException, so "Vendor not found" arrives as a 422 with
 *    `errors.vendor`. `isNotFound()` exists so detail pages can still call
 *    Next's `notFound()` for the right cases.
 */

export type FieldErrors = Record<string, string[]>;

export class ApiRequestError extends Error {
  readonly status: number;
  readonly errors: FieldErrors;

  constructor(status: number, message: string, errors: FieldErrors = {}) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.errors = errors;
  }
}

/** Thrown when the network call itself failed — the backend was never reached. */
export class ApiUnreachableError extends Error {
  constructor(cause: unknown) {
    super("Could not reach the BagyesRUSH API. Check that the backend is running.");
    this.name = "ApiUnreachableError";
    this.cause = cause;
  }
}

export function isApiError(error: unknown): error is ApiRequestError {
  return error instanceof ApiRequestError;
}

/** 422 — validation or a domain rule the backend refused. */
export function isValidationError(error: unknown): error is ApiRequestError {
  return isApiError(error) && error.status === 422;
}

/** 403 — the admin's role does not carry the required permission. */
export function isForbiddenError(error: unknown): error is ApiRequestError {
  return isApiError(error) && error.status === 403;
}

/**
 * A genuine 404, or the 422 the admin services throw for a missing record.
 * Pass the resource key the backend uses (`vendor`, `order`, `user`, ...) to
 * avoid mistaking an ordinary validation failure for a missing record.
 */
export function isNotFound(error: unknown, resource: string): boolean {
  if (!isApiError(error)) return false;
  if (error.status === 404) return true;
  if (error.status !== 422) return false;

  const messages = error.errors[resource];
  return Array.isArray(messages) && messages.some((message) => /not found/i.test(message));
}

/** First message for a field, for rendering next to an input. */
export function fieldError(errors: FieldErrors | undefined, field: string): string | undefined {
  return errors?.[field]?.[0];
}

/** Turns any thrown value into a message safe to show an admin. */
export function toErrorMessage(error: unknown): string {
  if (isApiError(error) || error instanceof ApiUnreachableError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

/**
 * The shape every Server Action returns, so callers can render field errors
 * without knowing anything about the transport.
 */
export type ActionResult<T = undefined> =
  | { ok: true; data: T; message: string }
  | { ok: false; message: string; errors: FieldErrors };

export function actionFailure(error: unknown): ActionResult<never> {
  if (isApiError(error)) {
    return { ok: false, message: error.message, errors: error.errors };
  }
  return { ok: false, message: toErrorMessage(error), errors: {} };
}

/**
 * 404 on a collection endpoint — the route itself is not there.
 *
 * The dashboard and the API deploy separately, so for a window during any
 * release (and for as long as an environment runs an older backend) a screen
 * can call an endpoint that does not exist yet. A missing *route* is not a
 * missing *record*, and rendering "Something went wrong" for it tells nobody
 * anything useful.
 *
 * Only meaningful on index-style calls, where a 404 cannot mean "no such row".
 */
export function isMissingEndpoint(error: unknown): error is ApiRequestError {
  return isApiError(error) && error.status === 404;
}
