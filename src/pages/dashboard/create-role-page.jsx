import { Helmet } from 'react-helmet-async';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useRouter } from 'src/routes/hooks';

import { CONFIG } from 'src/config-global';

import { getDashboardRootPath } from 'src/auth/utils/dashboard-path-utils';

// ----------------------------------------------------------------------

export function createRolePage({ title, allowedPermission, allowedAccountType, View }) {
  const metadata = { title: `${title} | Dashboard - ${CONFIG.site.name}` };

  return function RolePage() {
    const router = useRouter();
    const { user } = useSelector((state) => state.user);

    const isAllowed =
      Number(user?.permission) === allowedPermission ||
      user?.accountState?.accountType === allowedAccountType;

    const userRoot = getDashboardRootPath(user?.permission, user?.accountState?.accountType);

    useEffect(() => {
      if (!isAllowed) {
        router.replace(userRoot);
      }
    }, [isAllowed, router, userRoot]);

    if (!isAllowed) {
      return null;
    }

    return (
      <>
        <Helmet>
          <title>{metadata.title}</title>
        </Helmet>

        <View />
      </>
    );
  };
}

export function createRoleDashboardPage({ title, allowedPermission, allowedAccountType, DashboardView }) {
  const metadata = { title: `${title} - ${CONFIG.site.name}` };

  return function RoleDashboardPage() {
    const router = useRouter();
    const { user } = useSelector((state) => state.user);

    const isAllowed =
      Number(user?.permission) === allowedPermission ||
      user?.accountState?.accountType === allowedAccountType;

    const userRoot = getDashboardRootPath(user?.permission, user?.accountState?.accountType);

    useEffect(() => {
      if (!isAllowed) {
        router.replace(userRoot);
      }
    }, [isAllowed, router, userRoot]);

    if (!isAllowed) {
      return null;
    }

    return (
      <>
        <Helmet>
          <title>{metadata.title}</title>
        </Helmet>

        <DashboardView />
      </>
    );
  };
}
