import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { resolveDashboardRole } from 'src/auth/utils/role-module-redirect';
import { getProfileUserId } from 'src/sections/account/account-profile-utils';

export const BREAK_SETTINGS_ROLES = new Set(['careHome', 'hospital', 'localAuthority', 'user']);

const STORAGE_PREFIX = 'tempy.companyPaysBreaks.';

function storageKey(userId) {
  return `${STORAGE_PREFIX}${String(userId || '').trim() || 'session'}`;
}

export function getCompanyPaysBreaks(userId) {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (raw === null || raw === undefined || raw === '') return true;
    return raw === '1' || raw === 'true';
  } catch {
    return true;
  }
}

export function setCompanyPaysBreaks(userId, paysBreaks) {
  try {
    localStorage.setItem(storageKey(userId), paysBreaks ? '1' : '0');
  } catch {
  }
}

export function useCompanyPaysBreaks() {
  const sessionUser = useSelector((state) => state.user?.user);
  const userId = getProfileUserId(sessionUser);
  const role = resolveDashboardRole(sessionUser);
  const canConfigure = BREAK_SETTINGS_ROLES.has(role);

  const [paysBreaks, setPaysBreaksState] = useState(() => getCompanyPaysBreaks(userId));

  useEffect(() => {
    setPaysBreaksState(getCompanyPaysBreaks(userId));
  }, [userId]);

  const setPaysBreaks = useCallback(
    (next) => {
      const value = Boolean(next);
      setCompanyPaysBreaks(userId, value);
      setPaysBreaksState(value);
    },
    [userId]
  );

  return {
    userId,
    canConfigure,
    paysBreaks: canConfigure ? paysBreaks : true,
    setPaysBreaks,
  };
}
