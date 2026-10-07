import { useSelector } from 'react-redux';

import { getProfileUserId } from 'src/sections/account/account-profile-utils';

// ----------------------------------------------------------------------

/** Active account id — impersonation target when admin is viewing as a user. */
export function selectScopedUserId(state) {
  const impersonation = state?.impersonation;
  if (impersonation?.isActive && impersonation?.targetId) {
    return String(impersonation.targetId).trim();
  }
  return getProfileUserId(state?.user?.user);
}

export function selectIsImpersonating(state) {
  return Boolean(state?.impersonation?.isActive);
}

export function useScopedUserId() {
  return useSelector(selectScopedUserId);
}

export function useIsImpersonating() {
  return useSelector(selectIsImpersonating);
}
