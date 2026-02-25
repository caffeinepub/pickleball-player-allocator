/**
 * Error handling utilities for IC canister interactions.
 */

/**
 * Detects if an error is an IC0508 "canister is stopped" error.
 */
export function isCanisterStoppedError(err: unknown): boolean {
  if (!err) return false;
  const msg = String((err as any)?.message ?? err);
  return (
    msg.includes('IC0508') ||
    msg.includes('reject-code-5') ||
    msg.includes('canister is stopped') ||
    msg.includes('canister is not running')
  );
}

/**
 * Detects if an error is an authentication/authorization error.
 */
export function isAuthError(err: unknown): boolean {
  if (!err) return false;
  const msg = String((err as any)?.message ?? err);
  return (
    msg.includes('Unauthorized') ||
    msg.includes('unauthorized') ||
    msg.includes('not authorized') ||
    msg.includes('Anonymous') ||
    msg.includes('anonymous')
  );
}

/**
 * Detects if an error is a network/connection error.
 */
export function isNetworkError(err: unknown): boolean {
  if (!err) return false;
  const msg = String((err as any)?.message ?? err);
  return (
    msg.includes('fetch') ||
    msg.includes('network') ||
    msg.includes('Failed to fetch') ||
    msg.includes('NetworkError') ||
    msg.includes('ECONNREFUSED')
  );
}

/**
 * Formats an error into a user-friendly message.
 */
export function formatErrorMessage(err: unknown): string {
  if (!err) return 'An unexpected error occurred. Please try again.';

  const msg = String((err as any)?.message ?? err);

  if (isCanisterStoppedError(err)) {
    return 'The service is temporarily unavailable. Please try again in a moment.';
  }

  if (isAuthError(err)) {
    return 'You need to be logged in to perform this action.';
  }

  if (isNetworkError(err)) {
    return 'Network error. Please check your connection and try again.';
  }

  if (msg.includes('Actor not available') || msg.includes('Unable to connect')) {
    return 'Still connecting to the network. Please wait a moment and try again.';
  }

  if (msg.includes('Session does not exist')) {
    return 'Session not found. Please check the session code and try again.';
  }

  if (msg.includes('Not enough players')) {
    return 'Not enough players to start. Add more players first.';
  }

  if (msg.includes('Only the session host')) {
    return 'Only the session host can perform this action.';
  }

  if (msg.includes('Number of courts must be greater than 0')) {
    return 'Please select at least 1 court.';
  }

  if (msg.includes('Still connecting')) {
    return msg;
  }

  // Strip raw IC rejection details for cleaner UX
  if (msg.includes('Call was rejected') || msg.includes('Reject code')) {
    return 'The request was rejected by the network. Please try again.';
  }

  // Return a cleaned-up version of the message if it's short enough
  if (msg.length < 120) {
    return msg;
  }

  return 'Something went wrong. Please try again.';
}

/**
 * Retries a failed async call with exponential backoff.
 * Only retries on canister-stopped errors (up to 3 attempts).
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      // Only retry on canister-stopped errors
      if (!isCanisterStoppedError(err)) {
        throw err;
      }

      if (attempt < maxRetries - 1) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
