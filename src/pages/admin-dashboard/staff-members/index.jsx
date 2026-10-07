import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { AdminStaffMemberListView } from 'src/sections/admin/staff-members/view/admin-staff-member-list-view';

const metadata = { title: `Staff Members - Admin - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <AdminStaffMemberListView />
    </>
  );
}
