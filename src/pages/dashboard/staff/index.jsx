import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { StaffListView } from 'src/sections/staff/view/staff-list-view';

// ----------------------------------------------------------------------

const metadata = { title: `Staff | Dashboard - ${CONFIG.site.name}` };

export default function StaffPage() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <StaffListView />
    </>
  );
}
