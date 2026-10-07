import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { AdminAllegationsView } from 'src/sections/admin/allegations/view/admin-allegations-view';

// ----------------------------------------------------------------------

const metadata = { title: `Allegations | Admin - ${CONFIG.site.name}` };

export default function AdminAllegationsPage() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <AdminAllegationsView />
    </>
  );
}
