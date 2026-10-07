import { Helmet } from 'react-helmet-async';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { CONFIG } from 'src/config-global';

import { getDashboardRootPath } from 'src/auth/utils/dashboard-path-utils';

import { CareHomeDashboardView } from 'src/sections/care-home/dashboard/view/care-home-dashboard-view';

// ----------------------------------------------------------------------

const metadata = { title: `Care Home Dashboard - ${CONFIG.site.name}` };

export default function OverviewAppPage() {
  const router = useRouter();
  const { user } = useSelector((state) => state.user);

  const userRoot = getDashboardRootPath(user?.permission, user?.accountState?.accountType);
  const isCareHome = userRoot === paths.dashboard.root;

  useEffect(() => {
    if (!isCareHome) {
      router.replace(userRoot);
    }
  }, [isCareHome, router, userRoot]);

  if (!isCareHome) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <CareHomeDashboardView />
    </>
  );
}
