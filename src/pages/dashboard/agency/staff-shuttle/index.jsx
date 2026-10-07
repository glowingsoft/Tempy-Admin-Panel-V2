import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';
import { AgencyStaffTransportView } from 'src/sections/agency/staff-transport/view/agency-staff-transport-view';

// ----------------------------------------------------------------------

const metadata = { title: `Staff Shuttle | Dashboard - ${CONFIG.site.name}` };

export default function AgencyStaffShuttlePage() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <AgencyStaffTransportView />
    </>
  );
}
