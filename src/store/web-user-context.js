/** `/web/user/*` routes use the scoped user id in query params. */
export function isWebUserRoute(url = '') {
  return String(url).startsWith('/web/user/');
}

export function buildWebUserContextParams(userId, url = '') {
  const id = String(userId || '').trim();
  if (!id || !isWebUserRoute(url)) return {};

  return {
    userId: id,
  };
}
