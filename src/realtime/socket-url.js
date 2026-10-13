/** Socket.IO host is the API origin without `/api/v1`, plus the `/chat` namespace. */
export function resolveSocketUrl() {
  const fromEnv = String(import.meta.env.VITE_SOCKET_URL || '').trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  const apiBase = String(import.meta.env.VITE_BASE_URL || '').trim().replace(/\/$/, '');
  if (!apiBase) return '';

  const host = apiBase.replace(/\/api\/v\d+$/i, '');
  return `${host}/chat`;
}
