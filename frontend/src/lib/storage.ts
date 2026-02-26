/**
 * LocalStorage helpers for persisting session and player data.
 */

export interface StoredPlayerProfile {
  principalId?: string;
  name: string;
  mobileNumber?: string;
  bio?: string;
  profilePicture?: string;
  workField?: string;
}

export interface StoredSession {
  sessionId: string;
  sessionCode: string;
  role: 'host' | 'player';
  /** @deprecated use role === 'host' instead */
  isHost?: boolean;
}

const PLAYER_PROFILE_KEY = 'pickleball_player_profile';
const CURRENT_SESSION_KEY = 'pickleball_current_session';
const SESSION_PLAYER_NAMES_KEY = 'pickleball_session_player_names';

// ─── Player Profile ───────────────────────────────────────────────────────────

export function getPlayerProfile(): StoredPlayerProfile | null {
  try {
    const raw = localStorage.getItem(PLAYER_PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredPlayerProfile;
  } catch {
    return null;
  }
}

export function savePlayerProfile(profile: StoredPlayerProfile): void {
  try {
    localStorage.setItem(PLAYER_PROFILE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.warn('Failed to save player profile to localStorage:', err);
  }
}

export function clearPlayerProfile(): void {
  try {
    localStorage.removeItem(PLAYER_PROFILE_KEY);
  } catch {
    // ignore
  }
}

// ─── Current Session ──────────────────────────────────────────────────────────

export function getCurrentSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(CURRENT_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    // Back-compat: if old format had isHost but no role, derive role
    if (!parsed.role && parsed.isHost !== undefined) {
      parsed.role = parsed.isHost ? 'host' : 'player';
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveCurrentSession(session: StoredSession): void {
  try {
    localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(session));
  } catch (err) {
    console.warn('Failed to save current session to localStorage:', err);
  }
}

export function clearCurrentSession(): void {
  try {
    localStorage.removeItem(CURRENT_SESSION_KEY);
  } catch {
    // ignore
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
      JSON.stringify(existing)
    );
  } catch (err) {
    console.warn('Failed to save session player name to localStorage:', err);
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
