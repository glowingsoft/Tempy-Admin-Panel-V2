import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { MessagesView } from 'src/sections/messaging';

// ----------------------------------------------------------------------

const metadata = { title: `Chat | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <MessagesView />
    </>
  );
}
