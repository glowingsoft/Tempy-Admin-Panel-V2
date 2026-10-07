import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { AdminDashboardView } from 'src/sections/admin/dashboard/view/admin-dashboard-view';

// ----------------------------------------------------------------------

const metadata = { title: `Admin Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <AdminDashboardView />
    </>
  );
}
