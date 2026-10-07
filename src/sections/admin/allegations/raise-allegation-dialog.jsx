import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z as zod } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { AppButton } from 'src/components/app-button';
import { Field, Form } from 'src/components/hook-form';

import { ALLEGATION_TYPE_OPTIONS } from './admin-allegations-constants';

// ----------------------------------------------------------------------

const Schema = zod.object({
  employerName: zod.string().trim(),
  allegationType: zod.enum(['safeguarding', 'conduct', 'attendance', 'clinical', 'other'], {
    errorMap: () => ({ message: 'Allegation type is required' }),
  }),
  description: zod.string().trim().min(1, 'Description is required'),
});

export function RaiseAllegationDialog({ open, onClose, worker, onSubmit, submitting = false }) {
  const methods = useForm({
    resolver: zodResolver(Schema),
    defaultValues: {
      employerName: '',
      allegationType: 'safeguarding',
      description: '',
    },
  });

  const { reset, handleSubmit } = methods;

  useEffect(() => {
    if (!open) return;
    reset({
      employerName: worker?.employerName || worker?.location || '',
      allegationType: 'safeguarding',
      description: '',
    });
  }, [open, reset, worker]);

  const save = handleSubmit(async (data) => {
    await onSubmit?.({
      workerId: worker?.id,
      workerName: worker?.name,
      workerEmail: worker?.email,
      ...data,
    });
    onClose?.();
  });

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Raise allegation</DialogTitle>

      <Form methods={methods} onSubmit={save}>
        <DialogContent dividers sx={{ pt: 2.5 }}>
          <Alert severity="warning" sx={{ mb: 2.5 }}>
            This records an open allegation against <strong>{worker?.name || 'this worker'}</strong>.
            A third allegation that still counts suspends them and stops upcoming shifts.
          </Alert>

          <Field.Text
            name="employerName"
            label="Employer / site (optional)"
            size="small"
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />

          <Field.Select
            name="allegationType"
            label="Allegation type"
            size="small"
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          >
            {ALLEGATION_TYPE_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Field.Select>

          <Field.Text
            name="description"
            label="Details"
            size="small"
            multiline
            minRows={4}
            InputLabelProps={{ shrink: true }}
            placeholder="Describe the allegation and any immediate actions taken"
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button color="inherit" variant="outlined" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <AppButton type="submit" color="error" loading={submitting}>
            Raise allegation
          </AppButton>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
