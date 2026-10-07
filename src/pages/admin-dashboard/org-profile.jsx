import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { AdminOrgProfileView } from 'src/sections/admin/org-profile/view';

// ----------------------------------------------------------------------

const metadata = { title: `Profile - Admin - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <AdminOrgProfileView />
    </>
  );
}
