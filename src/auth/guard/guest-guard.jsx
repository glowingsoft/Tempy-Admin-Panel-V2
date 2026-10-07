import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useRouter, useSearchParams } from 'src/routes/hooks';

import { selectUser } from 'src/store/slices/userSlice';

import { SplashScreen } from 'src/components/loading-screen';

import { useAuthContext } from '../hooks';
import { getPostLoginPath } from '../utils/get-post-login-path';

// ----------------------------------------------------------------------

export function GuestGuard({ children }) {
  const router = useRouter();

  const searchParams = useSearchParams();

  const { loading } = useAuthContext();
  const reduxUser = useSelector(selectUser);

  const [isChecking, setIsChecking] = useState(true);

  const returnTo =
    searchParams.get('returnTo') ||
    getPostLoginPath(reduxUser?.permission, reduxUser?.accountState?.accountType);

  const isLoggedIn = Boolean(reduxUser?.token && reduxUser?.permission);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (isLoggedIn) {
      router.replace(returnTo);
      return;
    }

    setIsChecking(false);
  }, [isLoggedIn, loading, returnTo, router]);

  if (isChecking) {
    return <SplashScreen />;
  }

  return <>{children}</>;
}
