import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';
import { useRoleModuleGuard } from 'src/auth/hooks';

import { ShiftsView } from 'src/sections/care-home/shifts/view/shifts-view';

// ----------------------------------------------------------------------

const metadata = { title: `Shifts | Dashboard - ${CONFIG.site.name}` };

export default function ShiftsPage() {
  const shouldRedirect = useRoleModuleGuard('shifts');
  if (shouldRedirect) return null;

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <ShiftsView enableBookingCalendar apiRole="careHome" />
    </>
  );
}
