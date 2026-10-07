import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';
import { HelpCenterView } from 'src/sections/active-sections/help-center/help-center-view';

// ----------------------------------------------------------------------

const metadata = { title: `Details - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <HelpCenterView />
    </>
  );
}
