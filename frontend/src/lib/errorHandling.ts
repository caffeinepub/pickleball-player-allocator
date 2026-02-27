import type { AddPlayerResult, EndSessionResult } from '../backend';

// ─── Add Player Errors ────────────────────────────────────────────────────────

export function formatAddPlayerError(result: AddPlayerResult): string | null {
  switch (result.__kind__) {
    case 'ok':
    case 'guestAdded':
      return null;
    case 'notHost':
      return 'You are not the host of this session.';
    case 'sessionNotFound':
      return 'Session not found.';
    case 'playerAlreadyExists':
      return 'This player is already in the session.';
    case 'invalidGuestName':
      return 'Guest name must be 1–50 characters.';
    case 'invalidInput':
      return 'Invalid input provided.';
    case 'unknownError':
    default:
      return 'Failed to add player. Please try again.';
  }
}

export function formatAddPlayerErrorKind(kind: string): string {
  switch (kind) {
    case 'notHost':
      return 'You are not the host of this session.';
    case 'sessionNotFound':
      return 'Session not found.';
    case 'playerAlreadyExists':
      return 'This player is already in the session.';
    case 'invalidGuestName':
      return 'Guest name must be 1–50 characters.';
    case 'invalidInput':
      return 'Invalid input provided.';
    case 'unknownError':
    default:
      return 'Failed to add player. Please try again.';
  }
}

export function isAddPlayerSuccess(result: AddPlayerResult): boolean {
  return result.__kind__ === 'ok' || result.__kind__ === 'guestAdded';
}

// ─── End Session Errors ───────────────────────────────────────────────────────

export function formatEndSessionError(result: EndSessionResult): string | null {
  switch (result) {
    case 'ok':
      return null;
    case 'notHost':
      return 'You are not the host of this session.';
    case 'alreadyEnded':
      return 'This session has already ended.';
    case 'sessionNotFound':
      return 'Session not found.';
    default:
      return 'Failed to end session. Please try again.';
  }
}

export function isEndSessionNotHostError(result: EndSessionResult): boolean {
  return result === 'notHost';
}

export function isEndSessionAlreadyEndedError(result: EndSessionResult): boolean {
  return result === 'alreadyEnded';
}

// ─── Session Errors ───────────────────────────────────────────────────────────

export function formatSessionError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred.';
}

// ─── Network Errors ───────────────────────────────────────────────────────────

export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('network') ||
      error.message.includes('fetch') ||
      error.message.includes('timeout')
    );
  }
  return false;
}

// ─── Auth Errors ──────────────────────────────────────────────────────────────

export function isAuthError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('Unauthorized') ||
      error.message.includes('unauthorized') ||
      error.message.includes('not authenticated')
    );
  }
  return false;
}
