export const AUTH_TOKEN_COOKIE = 'tempy_access_token';
export const AUTH_TOKEN_STORAGE_KEY = 'jwt_access_token';

function cookieMaxAgeSeconds(token) {
  try {
    const parts = String(token || '').split('.');
    if (parts.length < 2) return 60 * 60 * 24 * 7;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    const exp = Number(payload?.exp);
    if (!exp) return 60 * 60 * 24 * 7;
    return Math.max(60, Math.floor(exp - Date.now() / 1000));
  } catch {
    return 60 * 60 * 24 * 7;
  }
}

export function readAuthCookie() {
  if (typeof document === 'undefined') return '';
  const match = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${AUTH_TOKEN_COOKIE}=`));
  if (!match) return '';
  return decodeURIComponent(match.slice(AUTH_TOKEN_COOKIE.length + 1).trim());
}

export function writeAuthCookie(token) {
  if (typeof document === 'undefined') return;
  if (!token) {
    clearAuthCookie();
    return;
  }

  const maxAge = cookieMaxAgeSeconds(token);
  const secure = typeof window !== 'undefined' && window.location?.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${AUTH_TOKEN_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

export function clearAuthCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = `${AUTH_TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function persistAuthToken(token) {
  if (typeof window === 'undefined') return;
  if (!token) {
    sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    clearAuthCookie();
    return;
  }

  sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  writeAuthCookie(token);
}

export function readPersistedAuthToken() {
  if (typeof window === 'undefined') return '';
  return (
    sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY) ||
    localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) ||
    readAuthCookie() ||
    ''
  );
}

export function consumeTokenFromUrl() {
  if (typeof window === 'undefined') return '';

  const url = new URL(window.location.href);
  const queryToken =
    url.searchParams.get('token') ||
    url.searchParams.get('accessToken') ||
    url.searchParams.get('access_token');

  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
  const hashToken = hashParams.get('token') || hashParams.get('access_token') || hashParams.get('accessToken');

  const token = String(queryToken || hashToken || '').trim();
  if (!token) return '';

  url.searchParams.delete('token');
  url.searchParams.delete('accessToken');
  url.searchParams.delete('access_token');
  hashParams.delete('token');
  hashParams.delete('access_token');
  hashParams.delete('accessToken');
  const nextHash = hashParams.toString();
  url.hash = nextHash ? `#${nextHash}` : '';

  window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
  return token;
}
