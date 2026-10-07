import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import LoadingButton from '@mui/lab/LoadingButton';

import { fToNow } from 'src/utils/format-time';

import { Label } from 'src/components/label';
import { formatNotificationCategoryLabel } from 'src/sections/notifications/notifications-api-utils';


function statusColor(status) {
  if (status === 'accepted' || status === 'active') return 'success';
  if (status === 'rejected' || status === 'inactive') return 'error';
  return 'warning';
}

export function NotificationActionDialog({
  open,
  notification,
  loading = false,
  onClose,
  onAccept,
  onReject,
}) {
  if (!notification) return null;

  const showActions = notification.requiresAction !== false;

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ pb: 1 }}>Notification</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={1.5}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
            <Typography variant="subtitle1" fontWeight={700}>
              {notification.title}
            </Typography>
            <Label variant="soft" color={statusColor(notification.status)}>
              {notification.status || 'pending'}
            </Label>
          </Stack>

          {notification.createdAt ? (
            <Typography variant="caption" color="text.secondary">
              {fToNow(notification.createdAt)}
              {notification.category
                ? ` · ${formatNotificationCategoryLabel(notification.category)}`
                : ''}
            </Typography>
          ) : null}

          <Box
            sx={{
              p: 1.5,
              borderRadius: 1.5,
              bgcolor: 'background.neutral',
              typography: 'body2',
              color: 'text.secondary',
              whiteSpace: 'pre-wrap',
            }}
          >
            {notification.message || 'No details provided.'}
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button color="inherit" variant="outlined" onClick={onClose} disabled={loading}>
          Close
        </Button>
        {showActions ? (
          <>
            <LoadingButton
              color="error"
              variant="outlined"
              loading={loading}
              onClick={onReject}
            >
              Reject
            </LoadingButton>
            <LoadingButton variant="contained" loading={loading} onClick={onAccept}>
              Accept
            </LoadingButton>
          </>
        ) : null}
      </DialogActions>
    </Dialog>
  );
}

NotificationActionDialog.propTypes = {
  open: PropTypes.bool,
  notification: PropTypes.object,
  loading: PropTypes.bool,
  onClose: PropTypes.func,
  onAccept: PropTypes.func,
  onReject: PropTypes.func,
};
