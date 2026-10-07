import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { BranchDetailsView } from 'src/sections/branches/view/branch-details-view';

const metadata = { title: `Branch | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <BranchDetailsView />
    </>
  );
}
