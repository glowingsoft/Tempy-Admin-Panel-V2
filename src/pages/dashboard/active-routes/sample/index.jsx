import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';
import { SampleListView } from 'src/sections/_active/sample-view/sample-list-view';


// ----------------------------------------------------------------------

const metadata = { title: `Wallets | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <SampleListView />
    </>
  );
}
