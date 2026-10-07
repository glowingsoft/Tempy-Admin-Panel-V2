import { isValidElement } from 'react';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

// ----------------------------------------------------------------------

function renderConfirmAction(action) {
  if (!isValidElement(action)) {
    return action;
  }

  const { loading, disabled, children, startIcon, ...rest } = action.props;
  const isLoading = Boolean(loading || disabled);

  return (
    <LoadingButton {...rest} startIcon={isLoading ? undefined : startIcon} loading={isLoading} disabled={disabled}>
      {children}
    </LoadingButton>
  );
}

export function ConfirmDialog({ title, content, action, open, onClose, ...other }) {
  const actionBusy = isValidElement(action) && Boolean(action.props.loading || action.props.disabled);

  return (
    <Dialog fullWidth maxWidth="xs" open={open} onClose={actionBusy ? undefined : onClose} {...other}>
      <DialogTitle sx={{ pb: 2 }}>{title}</DialogTitle>

      {content && <DialogContent sx={{ typography: 'body2' }}> {content} </DialogContent>}

      <DialogActions>
        {renderConfirmAction(action)}

        <Button variant="outlined" color="primary" onClick={onClose} disabled={actionBusy}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
