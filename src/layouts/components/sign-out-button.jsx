import { useAuth0 } from '@auth0/auth0-react';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import Button from '@mui/material/Button';

import { useRouter } from 'src/routes/hooks';

import { CONFIG } from 'src/config-global';

import { toast } from 'src/components/snackbar';

import { signOut as amplifySignOut } from 'src/auth/context/amplify/action';
import { signOut as firebaseSignOut } from 'src/auth/context/firebase/action';
import { signOut as jwtSignOut } from 'src/auth/context/jwt/action';
import { signOut as supabaseSignOut } from 'src/auth/context/supabase/action';
import { useAuthContext } from 'src/auth/hooks';
import { logout } from 'src/store/slices/userSlice';
import { clearImpersonation } from 'src/store/slices/impersonationSlice';
import { authApi, useLogoutMutation } from 'src/store/Reducer/auth';
import { resetAccountScopedState } from 'src/store/reset-role-api-caches';
import { clearStoragePreservingUiPrefs } from 'src/hooks/use-persisted-view-mode';
import { buildLogoutPayload } from 'src/sections/account/account-profile-utils';

// ----------------------------------------------------------------------

const signOut =
  (CONFIG.auth.method === 'supabase' && supabaseSignOut) ||
  (CONFIG.auth.method === 'firebase' && firebaseSignOut) ||
  (CONFIG.auth.method === 'amplify' && amplifySignOut) ||
  jwtSignOut;

// ----------------------------------------------------------------------

export function SignOutButton({ onClose, ...other }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const [logoutApi] = useLogoutMutation();

  const { checkUserSession } = useAuthContext();
  const { logout: signOutAuth0 } = useAuth0();

  const handleLogout = useCallback(async () => {
    try {
      try {
        await logoutApi(buildLogoutPayload()).unwrap();
      } catch {
        // Still clear local session if API fails
      }

      await signOut();

      resetAccountScopedState(dispatch);
      dispatch(authApi.util.resetApiState());

      dispatch(logout());
      dispatch(clearImpersonation());

      clearStoragePreservingUiPrefs();
      sessionStorage.clear();

      await checkUserSession?.();

      onClose?.();
      router.replace('/');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Unable to logout!');
    }
  }, [checkUserSession, dispatch, logoutApi, onClose, router]);

  const handleLogoutAuth0 = useCallback(async () => {
    try {
      await signOutAuth0();

      resetAccountScopedState(dispatch);
      dispatch(authApi.util.resetApiState());

      onClose?.();
      router.refresh();

      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Unable to logout!');
    }
  }, [onClose, router, signOutAuth0, dispatch]);

  return (
    <Button
      fullWidth
      variant="soft"
      size="large"
      color="error"
      onClick={CONFIG.auth.method === 'auth0' ? handleLogoutAuth0 : handleLogout}
      {...other}
    >
      Logout
    </Button>
  );
}
