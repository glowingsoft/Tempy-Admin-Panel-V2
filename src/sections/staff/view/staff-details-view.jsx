import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { ModuleLoading } from 'src/components/loading-screen';

import { useGetDashboardStaffByIdQuery } from 'src/store/Reducer/staff-api';

import { resolveStaffAccountKey } from '../staff-api-utils';
import { canUseFavorites } from '../favorites-api-utils';
import { useStaffFavorites } from '../use-staff-favorites';
import { StaffDetailsContent } from '../staff-details-content';

// ----------------------------------------------------------------------

export function StaffDetailsView({ staffId }) {
  const router = useRouter();
  const { user } = useSelector((state) => state.user);
  const accountKey = useMemo(() => resolveStaffAccountKey(user), [user]);
  const favoritesEnabled = canUseFavorites(user);

  const {
    data: staff,
    isLoading,
    isError,
    error,
    isFetching,
  } = useGetDashboardStaffByIdQuery(
    { accountKey, id: staffId },
    { skip: !staffId || !accountKey }
  );

  const {
    isFavoriteStaff,
    toggleFavoriteStaff,
    busy: favoriteBusy,
  } = useStaffFavorites({ skip: !favoritesEnabled });

  const displayStaff = useMemo(() => {
    if (!staff) return null;
    if (!favoritesEnabled) return staff;
    return { ...staff, isFavorite: isFavoriteStaff(staff) };
  }, [favoritesEnabled, isFavoriteStaff, staff]);

  if (!staffId || !accountKey) {
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

  if (isLoading || (isFetching && !staff)) {
    return (
      <DashboardContent maxWidth="xl">
        <ModuleLoading />
      </DashboardContent>
    );
  }

  if (isError || !displayStaff) {
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
        <Stack spacing={2} alignItems="flex-start">
          <Alert severity="error">
            {error?.data?.message || error?.error || 'Could not load this staff member.'}
          </Alert>
          <Button variant="contained" onClick={() => router.push(paths.dashboard.staff.root)}>
            Back to Staff
          </Button>
        </Stack>
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
          { name: displayStaff.name },
        ]}
        sx={{ mb: { xs: 3, md: 4 } }}
      />

      <StaffDetailsContent
        staff={displayStaff}
        onToggleFavorite={
          favoritesEnabled && !favoriteBusy
            ? () => toggleFavoriteStaff(displayStaff)
            : undefined
        }
      />
    </DashboardContent>
  );
}
