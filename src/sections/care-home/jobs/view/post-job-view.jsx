import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { AddJobView } from 'src/sections/care-home/jobs/view/add-job-view';

// ----------------------------------------------------------------------

const metadata = { title: `Add Job | Dashboard - ${CONFIG.site.name}` };

export default function PostJobViewPage() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <AddJobView />
    </>
  );
}
