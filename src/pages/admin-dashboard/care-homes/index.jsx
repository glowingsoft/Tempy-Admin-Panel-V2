import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { AdminCareHomeListView } from 'src/sections/admin/care-homes/view/admin-care-home-list-view';

// ----------------------------------------------------------------------

const metadata = { title: `Care Homes - Admin - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <AdminCareHomeListView />
    </>
  );
}
