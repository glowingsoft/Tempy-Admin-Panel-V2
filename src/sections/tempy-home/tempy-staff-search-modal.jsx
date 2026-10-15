import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { Iconify } from 'src/components/iconify';
import { ModuleLoading } from 'src/components/loading-screen';

import { getStaffSpecialtyLabel } from 'src/_mock/_staff';

import { useSearchPublicStaffQuery } from 'src/store/Reducer/public-staff-api';

// ----------------------------------------------------------------------

function loginHref({ speciality, location, staffId }) {
  const params = new URLSearchParams();
  if (speciality) params.set('speciality', speciality);
  if (location) params.set('location', location);
  if (staffId) params.set('staffId', staffId);
  return `${paths.auth.jwt.signIn}?returnTo=${encodeURIComponent(`/?${params.toString()}`)}`;
}

export function TempyStaffSearchModal({ open, onClose, speciality = '', location = null }) {
  const router = useRouter();
  const { data, isLoading, isFetching, isError, error } = useSearchPublicStaffQuery(
    { speciality, location },
    { skip: !open || !speciality || !location?.fullAddress, refetchOnMountOrArgChange: 60, refetchOnFocus: false }
  );

  const staff = data?.data || [];

  const selectStaff = (person) => {
    router.push(
      loginHref({
        speciality,
        location: location?.fullAddress || '',
        staffId: person.staffId || person.id,
      })
    );
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pr: 6 }}>
        Available staff
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 12, top: 12 }}
          aria-label="Close"
        >
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 0, pb: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ px: 3, mb: 1.5 }}>
          {getStaffSpecialtyLabel(speciality) || speciality}
          {location?.fullAddress ? ` · ${location.fullAddress}` : ''}
        </Typography>

        {isLoading && !staff.length ? <ModuleLoading sx={{ py: 4 }} /> : null}

        {isError && !isFetching ? (
          <Alert severity="error" sx={{ mx: 3, mb: 1.5 }}>
            {error?.data?.message || 'Could not load staff. Please try again.'}
          </Alert>
        ) : null}

        {!isFetching && !isError && !staff.length ? (
          <Typography variant="body2" color="text.secondary" sx={{ px: 3, py: 2 }}>
            No staff found for this speciality.
          </Typography>
        ) : null}

        <List disablePadding>
          {staff.map((person) => (
            <ListItemButton
              key={person.id}
              onClick={() => selectStaff(person)}
              sx={{ px: 3, py: 1.25 }}
            >
              <ListItemAvatar>
                <Avatar src={person.avatar} alt={person.name} />
              </ListItemAvatar>
              <ListItemText
                primary={person.name}
                secondary={getStaffSpecialtyLabel(person.speciality || speciality)}
                primaryTypographyProps={{ fontWeight: 600 }}
              />
              <Iconify icon="eva:arrow-ios-forward-fill" width={18} sx={{ color: 'text.disabled' }} />
            </ListItemButton>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  );
}
