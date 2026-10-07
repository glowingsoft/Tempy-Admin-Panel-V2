import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { paths } from 'src/routes/paths';
import { SplashScreen } from 'src/components/loading-screen';
import { getDashboardRootPath } from 'src/auth/utils/dashboard-path-utils';

import { useAuthContext } from '../hooks';

const ProtectedRoute = ({ children, requiredPermission }) => {
  const { user } = useSelector((state) => state.user);
  const { loading } = useAuthContext();
  const location = useLocation();

  if (loading) {
    return <SplashScreen />;
  }

  const isLoggedIn = Boolean(user?.token && user?.permission);

  if (!isLoggedIn) {
    const returnTo = `${location.pathname}${location.search || ''}`;
    return (
      <Navigate
        to={`${paths.auth.jwt.signIn}?returnTo=${encodeURIComponent(returnTo)}`}
        replace
      />
    );
  }

  const userPermission = Number(user?.permission);

  const hasPermission = Array.isArray(requiredPermission)
    ? requiredPermission.map(Number).includes(userPermission)
    : userPermission === Number(requiredPermission);

  if (!hasPermission) {
    const homePath = getDashboardRootPath(
      userPermission,
      user?.accountState?.accountType
    );
    return <Navigate to={homePath} replace />;
  }

  return children || <Outlet />;
};

export default ProtectedRoute;
