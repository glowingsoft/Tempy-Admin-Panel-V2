import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';

import { resetAccountScopedState } from 'src/store/reset-role-api-caches';

import { useIsImpersonating, useScopedUserId } from './use-scoped-user-id';

const SCOPE_STORAGE_KEY = 'tempy-last-account-scope';

/**
 * When the effective account changes (login, logout, impersonation switch),
 * drop RTK role caches + shared local seeds so the next user never sees
 * another customer's/supplier's data.
 */
export function useAccountScopeGuard() {
  const dispatch = useDispatch();
  const scopeUserId = useScopedUserId();
  const isImpersonating = useIsImpersonating();
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    const nextScope = `${isImpersonating ? 'i' : 'u'}:${scopeUserId || 'anon'}`;

    let previousScope = '';
    try {
      previousScope = window.sessionStorage.getItem(SCOPE_STORAGE_KEY) || '';
    } catch {
      previousScope = '';
    }

    const shouldReset =
      Boolean(previousScope) && previousScope !== nextScope && Boolean(scopeUserId);

    if (shouldReset) {
      resetAccountScopedState(dispatch);
    }

    if (scopeUserId) {
      try {
        window.sessionStorage.setItem(SCOPE_STORAGE_KEY, nextScope);
      } catch {
        // ignore
      }
    }

    bootstrappedRef.current = true;
  }, [dispatch, isImpersonating, scopeUserId]);
}
