import { Helmet } from 'react-helmet-async';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { CONFIG } from 'src/config-global';

import { getDashboardRootPath } from 'src/auth/utils/dashboard-path-utils';

import { AgencyDashboardView } from 'src/sections/agency/dashboard/view/agency-dashboard-view';

// ----------------------------------------------------------------------

const metadata = { title: `Agency Dashboard - ${CONFIG.site.name}` };

export default function AgencyDashboardPage() {
  const router = useRouter();
  const { user } = useSelector((state) => state.user);

  const userRoot = getDashboardRootPath(user?.permission, user?.accountState?.accountType);
  const isAgency = userRoot === paths.dashboard.agency.root;

  useEffect(() => {
    if (!isAgency) {
      router.replace(userRoot);
    }
  }, [isAgency, router, userRoot]);

  if (!isAgency) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <AgencyDashboardView />
    </>
  );
}
