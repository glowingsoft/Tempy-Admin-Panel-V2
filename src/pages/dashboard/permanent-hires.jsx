import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { PermanentHiresView } from 'src/sections/supplier-relationship/view/permanent-hires-view';

// ----------------------------------------------------------------------

const metadata = { title: `Permanent hires | Dashboard - ${CONFIG.site.name}` };

export default function PermanentHiresPage() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <PermanentHiresView />
    </>
  );
}
