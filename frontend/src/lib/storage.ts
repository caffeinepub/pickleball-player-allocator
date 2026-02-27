// LocalStorage helpers for player profiles and sessions

export interface LocalPlayerProfile {
  name: string;
  mobileNumber?: string;
  bio?: string;
  profilePicture?: string;
  workField?: string;
}

// Backward-compat alias
export type StoredPlayerProfile = LocalPlayerProfile;

export interface StoredSession {
  sessionId: string;
  sessionCode?: string;
  role?: 'host' | 'player';
}

const PROFILE_KEY = 'ballclub_player_profile';
const SESSION_KEY = 'ballclub_current_session';
const PLAYER_NAMES_PREFIX = 'ballclub_player_name_';

export function savePlayerProfile(profile: LocalPlayerProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // localStorage not available
  }
}

export function getPlayerProfile(): LocalPlayerProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LocalPlayerProfile;
  } catch {
    return null;
  }
}

export function clearPlayerProfile(): void {
  try {
    localStorage.removeItem(PROFILE_KEY);
  } catch {
    // localStorage not available
  }
}

export function saveCurrentSession(session: string | StoredSession): void {
  try {
    if (typeof session === 'string') {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ sessionId: session }));
    } else {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
  } catch {
    // localStorage not available
  }
}

export function getCurrentSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Handle legacy string storage
    if (typeof parsed === 'string') {
      return { sessionId: parsed };
    }
    return parsed as StoredSession;
  } catch {
    return null;
  }
}

export function clearCurrentSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // localStorage not available
  }
}

export function savePlayerNameForSession(sessionId: string, playerId: string, name: string): void {
  try {
    localStorage.setItem(`${PLAYER_NAMES_PREFIX}${sessionId}_${playerId}`, name);
  } catch {
    // localStorage not available
  }
}

export function getPlayerNameForSession(sessionId: string, playerId: string): string | null {
  try {
    return localStorage.getItem(`${PLAYER_NAMES_PREFIX}${sessionId}_${playerId}`);
  } catch {
    return null;
  }
}

// Backward-compat aliases
export const loadPlayerProfile = getPlayerProfile;
export const setPlayerProfile = savePlayerProfile;
export const loadCurrentSession = getCurrentSession;
export const setCurrentSession = saveCurrentSession;
