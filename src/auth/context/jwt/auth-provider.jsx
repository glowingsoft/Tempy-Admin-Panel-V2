import { useMemo, useEffect, useCallback } from 'react';

import { useSetState } from 'src/hooks/use-set-state';

import { store } from 'src/store/store';

import { consumeTokenFromUrl, readPersistedAuthToken } from 'src/auth/utils/auth-token-storage';
import { hydrateSessionFromToken } from 'src/auth/utils/hydrate-web-session';

import { STORAGE_KEY } from './constant';
import { AuthContext } from '../auth-context';
import { setSession } from './utils';


export function AuthProvider({ children }) {
  const { state, setState } = useSetState({
    user: null,
    loading: true,
  });

  const checkUserSession = useCallback(async () => {
    try {
      const reduxUser = store.getState()?.user?.user;
      const urlToken = consumeTokenFromUrl();
      const accessToken =
        urlToken ||
        readPersistedAuthToken() ||
        sessionStorage.getItem(STORAGE_KEY) ||
        reduxUser?.token ||
        null;

      if (accessToken) {
        await setSession(accessToken);

        if (reduxUser?.token && reduxUser?.permission && !urlToken) {
          setState({
            user: {
              ...reduxUser,
              accessToken,
            },
            loading: false,
          });
          return;
        }

        const hydrated = await hydrateSessionFromToken(accessToken);
        const nextUser = store.getState()?.user?.user || hydrated || reduxUser;

        if (nextUser?.token && nextUser?.permission) {
          setState({
            user: {
              ...nextUser,
              accessToken,
            },
            loading: false,
          });
          return;
        }
      }

      await setSession(null);
      setState({ user: null, loading: false });
    } catch (error) {
      console.error(error);
      await setSession(null);
      setState({ user: null, loading: false });
    }
  }, [setState]);

  useEffect(() => {
    checkUserSession();
  }, []);


  const checkAuthenticated = state.user ? 'authenticated' : 'unauthenticated';

  const status = state.loading ? 'loading' : checkAuthenticated;

  const memoizedValue = useMemo(
    () => ({
      user: state.user
        ? {
          ...state.user,
          role: state.user?.role ?? 'admin',
        }
        : null,
      checkUserSession,
      loading: status === 'loading',
      authenticated: status === 'authenticated',
      unauthenticated: status === 'unauthenticated',
    }),
    [checkUserSession, state.user, status]
  );

  return <AuthContext.Provider value={memoizedValue}>{children}</AuthContext.Provider>;
}
