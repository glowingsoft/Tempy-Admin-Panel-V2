import { useCallback, useEffect, useState } from 'react';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import LoadingButton from '@mui/lab/LoadingButton';

import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';

import { buildSupportCreatePayload } from './support-api-utils';

// ----------------------------------------------------------------------

export function SupportRequestDialog({ open, onClose, onSubmit, submitting = false }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (open) {
      setSubject('');
      setMessage('');
    }
  }, [open]);

  const handleClose = useCallback(() => {
    if (submitting) return;
    onClose?.();
  }, [onClose, submitting]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      const payload = buildSupportCreatePayload({ subject, message });
      if (!payload.subject) {
        toast.error('Subject is required');
        return;
      }
      if (!payload.message) {
        toast.error('Message is required');
        return;
      }

      await onSubmit?.(payload);
    },
    [message, onSubmit, subject]
  );

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>New support request</DialogTitle>

      <DialogContent dividers sx={{ pt: 2 }}>
        <form id="support-request-form" onSubmit={handleSubmit}>
          <TextField
            autoFocus
            label="Subject"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="e.g. Support Request — Local Authority"
            fullWidth
            required
            disabled={submitting}
            sx={{ mb: 2.5, mt: 1 }}
          />

          <TextField
            label="Message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Describe how we can help…"
            fullWidth
            required
            multiline
            minRows={4}
            disabled={submitting}
          />
        </form>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="outlined" color="inherit" onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <LoadingButton
          type="submit"
          form="support-request-form"
          variant="contained"
          loading={submitting}
          startIcon={<Iconify icon="mingcute:add-line" />}
        >
          Submit
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
