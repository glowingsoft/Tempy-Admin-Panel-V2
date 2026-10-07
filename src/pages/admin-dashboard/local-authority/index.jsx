import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { AdminLocalAuthorityListView } from 'src/sections/admin/local-authority/view/admin-local-authority-list-view';

const metadata = { title: `Local Authority - Admin - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <AdminLocalAuthorityListView />
    </>
  );
}
