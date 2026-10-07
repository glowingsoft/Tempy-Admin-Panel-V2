import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';
import { useRoleModuleGuard } from 'src/auth/hooks';

import { AgencyShiftsView } from 'src/sections/agency/shifts/view/agency-shifts-view';

// ----------------------------------------------------------------------

const metadata = { title: `Shifts | Agency Dashboard - ${CONFIG.site.name}` };

export default function AgencyShiftsPage() {
  const shouldRedirect = useRoleModuleGuard('agency.shifts');
  if (shouldRedirect) return null;

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <AgencyShiftsView enableAvailabilityApi apiRole="agency" />
    </>
  );
}
