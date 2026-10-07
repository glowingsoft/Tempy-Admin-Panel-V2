import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from 'src/store/slices/userSlice';

// ----------------------------------------------------------------------

export const UI_PREF_STORAGE_PREFIX = 'tempy-ui-pref:';

/** Keys/prefixes kept across logout (localStorage.clear). */
export const PRESERVED_LOCAL_STORAGE_PREFIXES = [UI_PREF_STORAGE_PREFIX];

const VIEW_MODE_KEY_PREFIX = `${UI_PREF_STORAGE_PREFIX}view-mode:`;
const COOKIE_NAME = 'tempy_ui_view_prefs';
const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 365; // 1 year

function safeParseJson(raw) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getUserScopeKey(user) {
  const raw =
    user?._id ||
    user?.id ||
    user?.userId ||
    user?.basicInfo?.email ||
    user?.email ||
    user?.displayName ||
    '';
  const normalized = String(raw).trim().toLowerCase();
  return normalized || 'anon';
}

function readCookiePrefs() {
  if (typeof document === 'undefined') return {};
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${COOKIE_NAME}=`));
  if (!match) return {};
  const value = decodeURIComponent(match.split('=').slice(1).join('='));
  const parsed = safeParseJson(value);
  return parsed && typeof parsed === 'object' ? parsed : {};
}

function writeCookiePrefs(prefs) {
  if (typeof document === 'undefined') return;
  try {
    const encoded = encodeURIComponent(JSON.stringify(prefs));
    document.cookie = `${COOKIE_NAME}=${encoded}; path=/; max-age=${COOKIE_MAX_AGE_SEC}; SameSite=Lax`;
  } catch {
    // ignore
  }
}

function storageKeyFor(scope, pageKey) {
  return `${VIEW_MODE_KEY_PREFIX}${scope}:${pageKey}`;
}

function isValidMode(value) {
  return value === 'grid' || value === 'list' || value === 'calendar' || value === 'map';
}

function readViewMode(scope, pageKey, defaultMode) {
  const fullKey = storageKeyFor(scope, pageKey);

  try {
    const fromLs = window.localStorage.getItem(fullKey);
    if (isValidMode(fromLs)) return fromLs;
  } catch {
    // ignore
  }

  // Legacy unscoped key (pre user-scope)
  try {
    const legacy = window.localStorage.getItem(`${VIEW_MODE_KEY_PREFIX}${pageKey}`);
    if (isValidMode(legacy)) return legacy;
  } catch {
    // ignore
  }

  const cookiePrefs = readCookiePrefs();
  const scopedCookie = cookiePrefs?.[scope]?.[pageKey];
  if (isValidMode(scopedCookie)) return scopedCookie;

  const legacyCookie = cookiePrefs?.[pageKey];
  if (isValidMode(legacyCookie)) return legacyCookie;

  return defaultMode;
}

function writeViewMode(scope, pageKey, mode) {
  if (!isValidMode(mode)) return;

  const fullKey = storageKeyFor(scope, pageKey);

  try {
    window.localStorage.setItem(fullKey, mode);
    // Keep legacy key in sync for older mounts
    window.localStorage.setItem(`${VIEW_MODE_KEY_PREFIX}${pageKey}`, mode);
  } catch {
    // ignore
  }

  const prefs = readCookiePrefs();
  const next = {
    ...prefs,
    [pageKey]: mode,
    [scope]: {
      ...(prefs?.[scope] && typeof prefs[scope] === 'object' ? prefs[scope] : {}),
      [pageKey]: mode,
    },
  };
  writeCookiePrefs(next);
}

/**
 * Persist grid/list preference across logout/login for the signed-in user.
 * Dual-writes localStorage + cookie so normal logout keeps the choice.
 */
export function usePersistedViewMode(pageKey, defaultMode = 'grid') {
  const user = useSelector(selectUser);
  const scope = getUserScopeKey(user);

  const [viewMode, setViewModeState] = useState(() =>
    readViewMode(scope, pageKey, defaultMode)
  );

  // Re-hydrate when user identity becomes available after login, and promote legacy prefs
  useEffect(() => {
    const restored = readViewMode(scope, pageKey, defaultMode);
    setViewModeState((prev) => (prev === restored ? prev : restored));

    if (scope !== 'anon' && isValidMode(restored)) {
      writeViewMode(scope, pageKey, restored);
    }
  }, [scope, pageKey, defaultMode]);

  const setViewMode = useCallback(
    (next) => {
      setViewModeState((prev) => {
        const value = typeof next === 'function' ? next(prev) : next;
        if (!isValidMode(value)) return prev;
        writeViewMode(scope, pageKey, value);
        return value;
      });
    },
    [pageKey, scope]
  );

  const handleViewModeChange = useCallback(
    (event, nextView) => {
      if (nextView) setViewMode(nextView);
    },
    [setViewMode]
  );

  return { viewMode, setViewMode, handleViewModeChange };
}

/**
 * Snapshot UI prefs before wiping storage (logout / manual clear).
 */
export function snapshotUiPrefsFromStorage() {
  const snapshot = {
    local: {},
    cookie: readCookiePrefs(),
  };

  try {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key) continue;
      if (PRESERVED_LOCAL_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix))) {
        snapshot.local[key] = window.localStorage.getItem(key);
      }
    }
  } catch {
    // ignore
  }

  return snapshot;
}

export function restoreUiPrefsSnapshot(snapshot) {
  if (!snapshot) return;

  Object.entries(snapshot.local || {}).forEach(([key, value]) => {
    try {
      if (value != null) window.localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  });

  if (snapshot.cookie && typeof snapshot.cookie === 'object') {
    writeCookiePrefs(snapshot.cookie);
  }
}

/**
 * Clear storage but keep UI preferences (grid/list view, etc.).
 */
export function clearStoragePreservingUiPrefs() {
  const snapshot = snapshotUiPrefsFromStorage();

  try {
    window.localStorage.clear();
  } catch {
    // ignore
  }

  restoreUiPrefsSnapshot(snapshot);

  // Cookie is not cleared by localStorage.clear — refresh it so logout never drops prefs
  if (snapshot.cookie && typeof snapshot.cookie === 'object') {
    writeCookiePrefs(snapshot.cookie);
  }
}
