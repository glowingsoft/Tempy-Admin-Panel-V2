import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';
import { useRoleModuleGuard } from 'src/auth/hooks';

import { AgencyJobsView } from 'src/sections/agency/jobs/view/agency-jobs-view';

const metadata = { title: `Jobs | Dashboard - ${CONFIG.site.name}` };

export default function FindJobsPage() {
  const shouldRedirect = useRoleModuleGuard('jobs.find');
  if (shouldRedirect) return null;

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <AgencyJobsView mode="agency" />
    </>
  );
}
