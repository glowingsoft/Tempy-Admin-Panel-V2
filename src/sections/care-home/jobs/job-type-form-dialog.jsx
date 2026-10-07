import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z as zod } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import Dialog from '@mui/material/Dialog';
import Stack from '@mui/material/Stack';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';

import { AppButton } from 'src/components/app-button';
import { Field, Form } from 'src/components/hook-form';

import { ADMIN_JOB_ROLE_STATUSES } from 'src/sections/admin/job-types/admin-job-roles-api-utils';

import { buildJobTypeLabel } from './care-home-job-types-utils';

const JobTypeSchema = zod.object({
  category: zod.string().trim().min(1, 'Department is required'),
  name: zod.string().trim().min(1, 'Title is required'),
  description: zod.string().trim(),
  status: zod.string().optional(),
});

export function JobTypeFormDialog({
  open,
  onClose,
  currentJobType,
  onSubmit,
  submitting = false,
  showStatus = false,
}) {
  const isEdit = Boolean(currentJobType);

  const defaultValues = useMemo(
    () => ({
      category: currentJobType?.category || '',
      name: currentJobType?.name || '',
      description: currentJobType?.description || '',
      status: currentJobType?.status || 'active',
    }),
    [currentJobType]
  );

  const methods = useForm({
    resolver: zodResolver(JobTypeSchema),
    defaultValues,
  });

  const { reset, handleSubmit, watch } = methods;
  const previewLabel = buildJobTypeLabel(watch('category'), watch('name'));

  useEffect(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [open, defaultValues, reset]);

  const handleFormSubmit = handleSubmit(async (data) => {
    await onSubmit?.(data);
    onClose?.();
  });

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="sm">
      <Form methods={methods} onSubmit={handleFormSubmit}>
        <DialogTitle>{isEdit ? 'Edit Job Type' : 'Add Job Type'}</DialogTitle>

        <DialogContent dividers sx={{ pt: 2.5, pb: 2.5, overflow: 'visible' }}>
          <Stack spacing={2.5}>
            <Field.Text
              name="category"
              label="Department"
              size="small"
              placeholder="e.g. Care, Nursing, Therapy"
              InputLabelProps={{ shrink: true }}
              disabled={submitting}
            />

            <Field.Text
              name="name"
              label="Title"
              size="small"
              placeholder="e.g. Senior Care Days"
              InputLabelProps={{ shrink: true }}
              disabled={submitting}
            />

            <Field.Text
              name="description"
              label="Description"
              size="small"
              placeholder="e.g. Leads the care team and oversees day-to-day care delivery"
              multiline
              minRows={3}
              InputLabelProps={{ shrink: true }}
              disabled={submitting}
            />

            {showStatus ? (
              <Field.Select name="status" label="Status" size="small" InputLabelProps={{ shrink: true }}>
                {ADMIN_JOB_ROLE_STATUSES.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Field.Select>
            ) : null}

            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Preview: <strong>{previewLabel || '—'}</strong>
            </Typography>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <AppButton variant="outlined" color="inherit" onClick={onClose} disabled={submitting}>
            Cancel
          </AppButton>
          <AppButton type="submit" loading={submitting}>
            {isEdit ? 'Save Changes' : 'Add Job Type'}
          </AppButton>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
