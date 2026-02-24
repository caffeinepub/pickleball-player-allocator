// Storage helpers for persisting player profile and session data

export interface StoredPlayerProfile {
  name: string;
  duprRating?: number;
}

export interface StoredSession {
  sessionId: string;
  isHost: boolean;
}

const PLAYER_PROFILE_KEY = 'pickleball_player_profile';
const CURRENT_SESSION_KEY = 'pickleball_current_session';
const SESSION_PLAYER_NAMES_KEY = 'pickleball_session_player_names';

// Player profile
export function getPlayerProfile(): StoredPlayerProfile | null {
  try {
    const raw = localStorage.getItem(PLAYER_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setPlayerProfile(profile: StoredPlayerProfile): void {
  localStorage.setItem(PLAYER_PROFILE_KEY, JSON.stringify(profile));
}

// Current session
export function getCurrentSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(CURRENT_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCurrentSession(session: StoredSession | null): void {
  if (session === null) {
    localStorage.removeItem(CURRENT_SESSION_KEY);
  } else {
    localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(session));
  }
}

// Session player names registry: sessionId -> { playerIndex: name }
// We store names by index because the backend uses the host's principal for all added players
export function getSessionPlayerNames(sessionId: string): Record<number, string> {
  try {
    const raw = localStorage.getItem(`${SESSION_PLAYER_NAMES_KEY}_${sessionId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function setSessionPlayerName(sessionId: string, playerIndex: number, name: string): void {
  const existing = getSessionPlayerNames(sessionId);
  existing[playerIndex] = name;
  localStorage.setItem(`${SESSION_PLAYER_NAMES_KEY}_${sessionId}`, JSON.stringify(existing));
}

export function clearSessionPlayerNames(sessionId: string): void {
  localStorage.removeItem(`${SESSION_PLAYER_NAMES_KEY}_${sessionId}`);
}

// Backward-compatible aliases
export const loadPlayerProfile = getPlayerProfile;
export const savePlayerProfile = setPlayerProfile;
export const loadCurrentSession = getCurrentSession;
export const saveCurrentSession = setCurrentSession;
