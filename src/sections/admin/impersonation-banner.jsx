import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { usePathname, useRouter } from 'src/routes/hooks';

import { useDispatch, useSelector } from 'react-redux';

import { exitImpersonation, getImpersonationDashboardLabel } from './admin-impersonation-utils';

// ----------------------------------------------------------------------

export function ImpersonationBanner() {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const impersonation = useSelector((state) => state.impersonation);

  // Never show on admin screens — wait until the role dashboard has mounted
  const onAdminDashboard = String(pathname || '').startsWith(paths.adminDashboard.root);

  if (!impersonation?.isActive || onAdminDashboard) {
    return null;
  }

  const handleExit = () => {
    exitImpersonation({ impersonationState: impersonation, dispatch, router });
  };

  const dashboardLabel = getImpersonationDashboardLabel(impersonation.targetType);

  return (
    <Alert
      severity="warning"
      sx={{
        borderRadius: 0,
        alignItems: { xs: 'flex-start', sm: 'center' },
        '& .MuiAlert-message': { width: 1 },
        '& .MuiAlert-action': {
          pt: { xs: 0.5, sm: 0 },
          mr: 0,
          ml: { xs: 0, sm: 2 },
          alignSelf: { xs: 'stretch', sm: 'center' },
        },
      }}
      action={
        <Button
          color="inherit"
          size="small"
          variant="outlined"
          onClick={handleExit}
          sx={{ whiteSpace: 'nowrap', width: { xs: 1, sm: 'auto' } }}
        >
          Exit to Admin
        </Button>
      }
    >
      <Stack spacing={0.25}>
        <Typography variant="body2" component="span">
          Viewing as <strong>{impersonation.targetName}</strong>
        </Typography>
        <Typography variant="caption" color="text.secondary" component="span">
          {dashboardLabel} (impersonation mode) · View only — you cannot create, edit or delete
          anything in this account
        </Typography>
      </Stack>
    </Alert>
  );
}
