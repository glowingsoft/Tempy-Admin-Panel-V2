import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';
import { useRoleModuleGuard } from 'src/auth/hooks';

import { AddJobView } from 'src/sections/care-home/jobs/view/add-job-view';

const metadata = { title: `Add Job | Dashboard - ${CONFIG.site.name}` };

export default function PostJobPage() {
  const shouldRedirect = useRoleModuleGuard('jobs.post');
  if (shouldRedirect) return null;

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <AddJobView mode="careHome" />
    </>
  );
}
