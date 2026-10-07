import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import { handleApiError } from './handleApiError';
import { logout } from './slices/userSlice';
import { readAuthCookie } from 'src/auth/utils/auth-token-storage';
import { buildWebUserContextParams } from './web-user-context';
import { VIEW_ONLY_MESSAGE, isViewOnlySession } from 'src/auth/utils/view-only';

const ADMIN_ACCESS_TOKEN = import.meta.env.VITE_ADMIN_ACCESS_TOKEN;

// Mutations admin may still send while viewing another account.
const VIEW_ONLY_ALLOWED_MUTATIONS = ['logout'];

const IMPERSONATION_WEB_PREFIX = {
  agency: '/web/agency/',
  care_home: '/web/care-home/',
  hospital_nhs: '/web/hospital/',
  local_authority: '/web/local-authority/',
  individual_home_care: '/web/user/',
  home_care_company: '/web/home-care-company/',
  staff_member: '/web/nurse/',
};

/**
 * While admin impersonates, always use targetId for /web/* calls.
 * Direct login uses the session user id.
 */
function resolveWebRequestUserId(state, url = '') {
  const impersonation = state?.impersonation;

  if (impersonation?.isActive && impersonation?.targetId) {
    const targetId = String(impersonation.targetId).trim();
    if (!url || url.startsWith('/web/')) {
      const prefix = IMPERSONATION_WEB_PREFIX[impersonation.targetType];
      if (!prefix || url.startsWith(prefix) || url.startsWith('/web/')) {
        return targetId;
      }
    }
  }

  const user = state?.user?.user;
  return String(user?.basicInfo?._id || user?.basicInfo?.id || user?._id || user?.id || '').trim();
}

// Non-/web GETs the backend also answers as the viewed account when they carry ?userId=.
// Never /admin/*, /users/* or /dashboard: there userId is an ordinary admin filter.
const VIEW_AS_GET_PREFIXES = ['/notifications', '/conversations', '/favorites'];

function isViewAsGetRoute(url) {
  return VIEW_AS_GET_PREFIXES.some(
    (prefix) => url === prefix || url.startsWith(`${prefix}/`) || url.startsWith(`${prefix}?`)
  );
}

function withWebContextParams(arg, state) {
  if (!arg || typeof arg !== 'object') return arg;

  const url = typeof arg.url === 'string' ? arg.url : '';
  const method = String(arg.method || 'GET').toUpperCase();

  if (!url.startsWith('/web/')) {
    const impersonation = state?.impersonation;
    const targetId = impersonation?.isActive ? String(impersonation.targetId || '').trim() : '';
    if (!targetId || method !== 'GET' || !isViewAsGetRoute(url)) return arg;
    return { ...arg, params: { ...(arg.params || {}), userId: targetId } };
  }

  const userId = resolveWebRequestUserId(state, url);

  if (!userId) return arg;
  const shouldInjectBodyUserId =
    ['POST', 'PUT', 'PATCH'].includes(method) &&
    arg.body &&
    typeof arg.body === 'object' &&
    !Array.isArray(arg.body) &&
    !(typeof FormData !== 'undefined' && arg.body instanceof FormData);

  return {
    ...arg,
    params: {
      ...(arg.params || {}),
      userId,
      ...buildWebUserContextParams(userId, url),
    },
    ...(shouldInjectBodyUserId
      ? {
          body: {
            ...arg.body,
            userId,
          },
        }
      : {}),
  };
}

export const createCustomFetchBaseQuery = () => {
  const baseQuery = fetchBaseQuery({
    baseUrl: import.meta.env.VITE_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const state = getState();
      const impersonation = state?.impersonation;
      const token =
        state?.user?.user?.token ||
        (typeof window !== 'undefined' ? window.sessionStorage.getItem('jwt_access_token') || window.localStorage.getItem('jwt_access_token') || readAuthCookie() : '') ||
        (impersonation?.isActive ? impersonation?.adminToken : null);

      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      // Only headers the API already allows (extra custom headers break CORS from localhost).
      if (impersonation?.isActive) {
        if (ADMIN_ACCESS_TOKEN) {
          headers.set('x-admin-access-token', ADMIN_ACCESS_TOKEN);
        }
        try {
          headers.set('X-Timezone', Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
        } catch {
          headers.set('X-Timezone', 'UTC');
        }
      }

      return headers;
    },
  });

  return async (arg, api, extraOptions) => {
    const state = api.getState();

    // Admin inside another account can look but not change anything: no mutation leaves the
    // browser (queries still run, including the ones sent as POST). Signing out stays possible.
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    if (api.type === 'mutation' && !VIEW_ONLY_ALLOWED_MUTATIONS.includes(api.endpoint) && isViewOnlySession(state, currentPath)) {
      return { error: { status: 403, data: { message: VIEW_ONLY_MESSAGE } } };
    }

    const result = await baseQuery(withWebContextParams(arg, state), api, extraOptions);

    if (result.error) {
      const message = handleApiError(result.error);
      console.error('API Error:', message);

      const { status } = result.error;

      if (status === 401) {
        if (api.getState()?.impersonation?.isActive) {
          return result;
        }

        const isBrowser = typeof window !== 'undefined';
        const pathname = isBrowser ? window.location.pathname : '';
        const isOnAuthPage =
          isBrowser &&
          (pathname === '/' ||
            pathname === '/auth/sign-in' ||
            pathname === '/auth/sign-up' ||
            pathname === '/auth/verify-email' ||
            pathname.startsWith('/auth/forget-password') ||
            pathname.startsWith('/auth/verify-password') ||
            pathname.startsWith('/auth/reset-password'));

        if (!isOnAuthPage) {
          api.dispatch(logout());

          if (isBrowser) {
            window.location.replace('/');
          }
        }
      }
    }

    return result;
  };
};
