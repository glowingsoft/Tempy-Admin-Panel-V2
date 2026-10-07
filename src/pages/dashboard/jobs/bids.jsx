import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';
import { useRoleModuleGuard } from 'src/auth/hooks';

import { JobBidsView } from 'src/sections/care-home/jobs/view/job-bids-view';

// ----------------------------------------------------------------------

const metadata = { title: `Bids | Dashboard - ${CONFIG.site.name}` };

export default function JobBidsPage() {
  const shouldRedirect = useRoleModuleGuard('jobs.bids');
  if (shouldRedirect) return null;

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <JobBidsView mode="careHome" />
    </>
  );
}
