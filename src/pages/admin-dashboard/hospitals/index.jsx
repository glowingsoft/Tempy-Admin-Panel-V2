import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { AdminHospitalListView } from 'src/sections/admin/hospitals/view/admin-hospital-list-view';

const metadata = { title: `Hospitals/NHS - Admin - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <AdminHospitalListView />
    </>
  );
}
