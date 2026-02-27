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
 * Detects if an error is a session-not-found error.
 * Handles both the typed flag set by useGetSessionState and raw message checks.
 */
export function isSessionNotFoundError(err: unknown): boolean {
  if (!err) return false;
  // Check the typed flag set by the query hook
  if ((err as any)?.isSessionNotFound === true) return true;
  const msg = String((err as any)?.message ?? err);
  return (
    msg.includes('Session not found') ||
    msg.includes('session not found') ||
    msg.includes('Session does not exist') ||
    msg.includes('does not exist') ||
    msg.includes('No session exists')
  );
}

/**
 * Detects if an error is a duplicate player error (player already in session).
 */
export function isDuplicatePlayerError(err: unknown): boolean {
  if (!err) return false;
  const msg = String((err as any)?.message ?? err);
  return (
    msg.includes('already in') ||
    msg.includes('already exists') ||
    msg.includes('duplicate') ||
    msg.includes('Duplicate')
  );
}

/**
 * Detects if an error is an invalid Principal ID format error.
 */
export function isInvalidPrincipalError(err: unknown): boolean {
  if (!err) return false;
  const msg = String((err as any)?.message ?? err);
  return (
    msg.includes('Invalid Principal') ||
    msg.includes('invalid principal') ||
    msg.includes('Principal ID format') ||
    msg.includes('fromText') ||
    msg.includes('decode')
  );
}

/**
 * Detects if an error is a host-only authorization error.
 */
export function isHostOnlyError(err: unknown): boolean {
  if (!err) return false;
  const msg = String((err as any)?.message ?? err);
  return (
    msg.includes('Only the session host') ||
    msg.includes('host can add') ||
    msg.includes('host can perform')
  );
}

/**
 * Returns a user-friendly error message specific to session loading failures.
 */
export function formatSessionError(err: unknown): string {
  if (!err) return 'Unable to load session. Please try again.';

  if (isSessionNotFoundError(err)) {
    return 'Session not found. It may have ended or the link is invalid.';
  }

  if (isNetworkError(err)) {
    return 'Network error. Please check your connection and try again.';
  }

  if (isCanisterStoppedError(err)) {
    return 'The service is temporarily unavailable. Please try again in a moment.';
  }

  if (isAuthError(err)) {
    return 'Authentication required to view this session.';
  }

  const msg = String((err as any)?.message ?? err);
  if (msg.includes('Actor not available') || msg.includes('Unable to connect')) {
    return 'Still connecting to the network. Please wait a moment and try again.';
  }

  return 'Unable to load session. Please try again.';
}

/**
 * Returns a user-friendly error message for add-player failures.
 */
export function formatAddPlayerError(err: unknown): string {
  if (!err) return 'Failed to add player. Please try again.';

  if (isInvalidPrincipalError(err)) {
    return 'Invalid Principal ID format. Please check the ID and try again.';
  }

  if (isDuplicatePlayerError(err)) {
    return 'This player is already in the session.';
  }

  if (isHostOnlyError(err)) {
    return 'Only the session host can add players.';
  }

  if (isSessionNotFoundError(err)) {
    return 'Session not found. It may have ended.';
  }

  if (isNetworkError(err)) {
    return 'Network error. Please check your connection and try again.';
  }

  const msg = String((err as any)?.message ?? err);
  if (msg.length < 120) return msg;

  return 'Failed to add player. Please try again.';
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

  if (isNetworkError(err)) {
    return 'Network error. Please check your connection and try again.';
  }

  if (msg.includes('Actor not available') || msg.includes('Unable to connect')) {
    return 'Still connecting to the network. Please wait a moment and try again.';
  }

  if (isSessionNotFoundError(err)) {
    return 'Session not found. Please check the session code and try again.';
  }

  if (msg.includes('Not enough players')) {
    return 'Not enough players to start. Add more players first.';
  }

  if (isHostOnlyError(err)) {
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
