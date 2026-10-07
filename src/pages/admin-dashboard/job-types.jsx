import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { JobTypesView } from 'src/sections/care-home/jobs/view/job-types-view';

const metadata = { title: `Job Types | Admin - ${CONFIG.site.name}` };

export default function AdminJobTypesPage() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <JobTypesView variant="admin" />
    </>
  );
}
