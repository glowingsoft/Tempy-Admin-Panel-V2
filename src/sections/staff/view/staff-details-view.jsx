import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useStaff } from '../context/staff-provider';
import { StaffDetailsContent } from '../staff-details-content';

// ----------------------------------------------------------------------

export function StaffDetailsView({ staffId }) {
  const router = useRouter();

  const { getStaffById } = useStaff();

  const staff = getStaffById(staffId);

  if (!staff) {
    return (
      <DashboardContent maxWidth="xl">
        <CustomBreadcrumbs
          heading="Staff details"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Staff', href: paths.dashboard.staff.root },
            { name: 'Not found' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <Button variant="contained" onClick={() => router.push(paths.dashboard.staff.root)}>
          Back to Staff
        </Button>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent maxWidth="xl">
      <CustomBreadcrumbs
        heading="Staff details"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Staff', href: paths.dashboard.staff.root },
          { name: staff.name },
        ]}
        sx={{ mb: { xs: 3, md: 4 } }}
      />

      <StaffDetailsContent staff={staff} />
    </DashboardContent>
  );
}
