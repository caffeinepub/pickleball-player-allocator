export interface StoredPlayerProfile {
  name: string;
  mobileNumber: string;
  bio?: string;
  workField?: string;
  profilePicture?: string;
  principalId?: string;
}

export interface StoredSession {
  sessionId: string;
  sessionCode?: string;
  role: 'host' | 'player';
  /** @deprecated use role === 'host' */
  isHost?: boolean;
}

const PROFILE_KEY = 'ballclub_player_profile';
const SESSION_KEY = 'ballclub_current_session';
const SESSION_PLAYER_NAMES_KEY = 'ballclub_session_player_names';

export function savePlayerProfile(profile: StoredPlayerProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.warn('Failed to save profile to localStorage', e);
  }
}

export function getPlayerProfile(): StoredPlayerProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredPlayerProfile;
  } catch (e) {
    console.warn('Failed to read profile from localStorage', e);
    return null;
  }
}

export function clearPlayerProfile(): void {
  try {
    localStorage.removeItem(PROFILE_KEY);
  } catch (e) {
    console.warn('Failed to clear profile from localStorage', e);
  }
}

export function saveCurrentSession(session: StoredSession): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (e) {
    console.warn('Failed to save session to localStorage', e);
  }
}

export function getCurrentSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    // Backward compat: if role is missing, derive from isHost
    if (!parsed.role) {
      parsed.role = parsed.isHost ? 'host' : 'player';
    }
    return parsed;
  } catch (e) {
    console.warn('Failed to read session from localStorage', e);
    return null;
  }
}

export function clearCurrentSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (e) {
    console.warn('Failed to clear session from localStorage', e);
  }
}

/**
 * Clears all session-related data from localStorage when a session is confirmed
 * to no longer exist (e.g. SessionNotFound error). Prevents the app from
 * repeatedly trying to load a session that is gone.
 */
export function clearInvalidSession(sessionId: string): void {
  try {
    const current = getCurrentSession();
    if (current?.sessionId === sessionId) {
      clearCurrentSession();
    }
    clearSessionPlayerNames(sessionId);
  } catch (e) {
    console.warn('Failed to clear invalid session data', e);
  }
}

// ─── Session Player Names (index-based, per session) ─────────────────────────

export function getSessionPlayerNames(sessionId: string): Record<number, string> {
  try {
    const raw = localStorage.getItem(`${SESSION_PLAYER_NAMES_KEY}_${sessionId}`);
    if (!raw) return {};
    return JSON.parse(raw) as Record<number, string>;
  } catch {
    return {};
  }
}

export function setSessionPlayerName(sessionId: string, playerIndex: number, name: string): void {
  try {
    const existing = getSessionPlayerNames(sessionId);
    existing[playerIndex] = name;
    localStorage.setItem(
      `${SESSION_PLAYER_NAMES_KEY}_${sessionId}`,
      JSON.stringify(existing),
    );
  } catch (e) {
    console.warn('Failed to save session player name to localStorage', e);
  }
}

export function clearSessionPlayerNames(sessionId: string): void {
  try {
    localStorage.removeItem(`${SESSION_PLAYER_NAMES_KEY}_${sessionId}`);
  } catch {
    // ignore
  }
}

// ─── Backward-compatible aliases ──────────────────────────────────────────────
export const loadPlayerProfile = getPlayerProfile;
export const setPlayerProfile = savePlayerProfile;
export const loadCurrentSession = getCurrentSession;
export const setCurrentSession = saveCurrentSession;
