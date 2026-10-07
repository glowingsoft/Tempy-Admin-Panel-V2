import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { AdminAgencyListView } from 'src/sections/admin/agencies/view/admin-agency-list-view';

// ----------------------------------------------------------------------

const metadata = { title: `Agencies - Admin - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <AdminAgencyListView />
    </>
  );
}
