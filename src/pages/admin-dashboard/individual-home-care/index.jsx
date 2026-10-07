import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { AdminIndividualHomeCareListView } from 'src/sections/admin/individual-home-care/view/admin-individual-home-care-list-view';

const metadata = { title: `Individual (Home Care) - Admin - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <AdminIndividualHomeCareListView />
    </>
  );
}
