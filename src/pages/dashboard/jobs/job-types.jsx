import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { JobTypesView } from 'src/sections/care-home/jobs/view/job-types-view';

const metadata = { title: `Job Types | Dashboard - ${CONFIG.site.name}` };

export default function JobTypesPage() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <JobTypesView />
    </>
  );
}
