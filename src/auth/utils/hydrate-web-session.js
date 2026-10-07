import { setUser } from 'src/store/slices/userSlice';
import { store } from 'src/store/store';
import { resetAccountScopedState } from 'src/store/reset-role-api-caches';

import { API_ROUTES } from 'src/store/apiRoutes';

import {
  API_USER_TYPE_PERMISSION,
  API_USER_TYPE_TO_ACCOUNT_TYPE,
  normalizeLoginResponse,
} from 'src/sections/auth/jwt/auth-api-utils';
import { getProfileUserId } from 'src/sections/account/account-profile-utils';

import { jwtDecode } from '../context/jwt/utils';
import { persistAuthToken } from './auth-token-storage';

function pickJwtUserId(decoded = {}) {
  return String(decoded._id || decoded.id || decoded.userId || decoded.sub || '').trim();
}

function pickJwtUserType(decoded = {}) {
  return String(
    decoded.userType ||
      decoded.accountState?.userType ||
      decoded.role ||
      ''
  ).trim();
}

function buildUserFromJwt(decoded, token) {
  const userType = pickJwtUserType(decoded) || 'careHome';
  const id = pickJwtUserId(decoded);

  return normalizeLoginResponse(
    {
      token,
      _id: id,
      id,
      userType,
      accountState: decoded.accountState || { userType },
      permission: API_USER_TYPE_PERMISSION[userType],
    },
    { fallbackUserType: userType }
  );
}

async function fetchUserProfile(token, userId) {
  const base = String(import.meta.env.VITE_BASE_URL || '').replace(/\/$/, '');
  if (!base || !userId) return null;

  const response = await fetch(`${base}${API_ROUTES.USERS_BY_ID(userId)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) return null;
  return response.json();
}


export async function hydrateSessionFromToken(token) {
  const accessToken = String(token || '').trim();
  if (!accessToken) return null;

  let decoded = {};
  try {
    decoded = jwtDecode(accessToken) || {};
    if (decoded?.exp && Number(decoded.exp) * 1000 <= Date.now()) {
      persistAuthToken(null);
      return null;
    }
  } catch {
    return null;
  }

  persistAuthToken(accessToken);
  let user = buildUserFromJwt(decoded, accessToken);

  try {
    const userId = pickJwtUserId(decoded);
    const profile = await fetchUserProfile(accessToken, userId);
    if (profile) {
      user = normalizeLoginResponse(
        {
          ...(profile?.data || profile),
          token: accessToken,
        },
        { fallbackUserType: pickJwtUserType(decoded) || user?.accountState?.userType }
      );
    }
  } catch {
  }

  if (!user?.permission && user?.accountState?.userType) {
    user.permission = API_USER_TYPE_PERMISSION[user.accountState.userType];
  }

  if (user?.accountState?.userType && !user.accountState.accountType) {
    user.accountState.accountType = API_USER_TYPE_TO_ACCOUNT_TYPE[user.accountState.userType];
  }

  const previousUserId = getProfileUserId(store.getState()?.user?.user);
  const nextUserId = getProfileUserId(user);
  if (previousUserId && nextUserId && previousUserId !== nextUserId) {
    resetAccountScopedState(store.dispatch);
  }

  store.dispatch(setUser(user));
  return user;
}
