import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';
import { useRoleModuleGuard } from 'src/auth/hooks';

import { CreatedJobsView } from 'src/sections/care-home/jobs/view/created-jobs-view';

// ----------------------------------------------------------------------

const metadata = { title: `Created Jobs | Dashboard - ${CONFIG.site.name}` };

export default function CreatedJobsPage() {
  const shouldRedirect = useRoleModuleGuard('jobs.created');
  if (shouldRedirect) return null;

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <CreatedJobsView mode="careHome" />
    </>
  );
}
