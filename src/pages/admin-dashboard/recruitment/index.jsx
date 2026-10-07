import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { AdminRecruitmentView } from 'src/sections/admin/recruitment/view/admin-recruitment-view';

// ----------------------------------------------------------------------

const metadata = { title: `Permanent hire | Admin - ${CONFIG.site.name}` };

export default function AdminRecruitmentPage() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <AdminRecruitmentView />
    </>
  );
}
