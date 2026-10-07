import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { AdminHomeCareCompanyListView } from 'src/sections/admin/home-care-companies/view/admin-home-care-company-list-view';

const metadata = { title: `Home Care Companies - Admin - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <AdminHomeCareCompanyListView />
    </>
  );
}
