function pickId(value) {
  if (value == null || value === '') return '';
  if (typeof value === 'object') {
    return String(value._id || value.id || value.favoriteUser || '').trim();
  }
  return String(value).trim();
}

/** Dashboards allowed to call /favorites (API: admin or careHome only). */
export const FAVORITES_ALLOWED_DASHBOARDS = new Set(['care_home']);

export const FAVORITE_DASHBOARD_KEYS = {
  care_home: 'care_home',
  careHome: 'care_home',
  hospital_nhs: 'hospital_nhs',
  hospital: 'hospital_nhs',
  local_authority: 'local_authority',
  localAuthority: 'local_authority',
  individual_home_care: 'individual_home_care',
  individualHomeCare: 'individual_home_care',
  agency: 'agency',
  home_care_company: 'home_care_company',
  homeCareCompany: 'home_care_company',
};

export function resolveFavoriteDashboardKey(user) {
  const accountType =
    user?.accountState?.accountType || user?.accountType || user?.userType || '';
  const permission = Number(user?.permission);

  if (FAVORITE_DASHBOARD_KEYS[accountType]) {
    return FAVORITE_DASHBOARD_KEYS[accountType];
  }

  if (permission === 2) return 'care_home';
  if (permission === 3) return 'agency';
  if (permission === 4) return 'hospital_nhs';
  if (permission === 5) return 'local_authority';
  if (permission === 6) return 'individual_home_care';
  if (permission === 7) return 'home_care_company';

  return 'care_home';
}

export function canUseFavorites(user) {
  return FAVORITES_ALLOWED_DASHBOARDS.has(resolveFavoriteDashboardKey(user));
}

export function favoritesListArg(dashboardKey = 'care_home') {
  return {
    page: 0,
    limit: 200,
    accountType: dashboardKey || 'care_home',
  };
}

export function mapFavoriteFromApi(item = {}, fallbackAccountType = '') {
  const favoriteUserId = pickId(item.favoriteUser);
  const id = pickId(item._id || item.id);
  const accountType = String(
    item.accountType ||
      item.dashboard ||
      item.userType ||
      fallbackAccountType ||
      ''
  ).trim();

  return {
    id,
    favoriteUserId,
    userId: pickId(item.user),
    accountType,
    status: String(item.status || 'active').toLowerCase(),
    createdAt: item.createdAt || '',
    raw: item,
  };
}

export function extractFavoritesList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.favorites)) return response.favorites;
  if (Array.isArray(response?.results)) return response.results;
  return [];
}

export function isActiveFavorite(favorite) {
  const status = String(favorite?.status || 'active').toLowerCase();
  return status !== 'inactive' && status !== 'deleted' && status !== 'delete';
}

/** Resolve which user id to send as `favoriteUser` for staff rows. */
export function resolveFavoriteUserId(staff) {
  if (!staff) return '';
  return String(
    staff.staffId || staff.workerId || staff.userId || staff.id || ''
  ).trim();
}

export function filterFavoritesForDashboard(list = [], dashboardKey = '') {
  const key = String(dashboardKey || '').trim();
  if (!key) return list;

  return list.filter((item) => {
    const itemKey = String(item.accountType || '').trim();
    // If API does not return accountType, keep row (auth user already scopes list).
    if (!itemKey) return true;
    return itemKey === key;
  });
}
