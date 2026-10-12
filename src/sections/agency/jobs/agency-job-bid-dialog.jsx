import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z as zod } from 'zod';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import Typography from '@mui/material/Typography';
import DialogContent from '@mui/material/DialogContent';
import LinearProgress from '@mui/material/LinearProgress';

import { fCurrency } from 'src/utils/format-number';

import { Form, Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';
import { JobMediaThumb } from 'src/components/jobs/job-image';

import { bidTotalForRate, pickAgreedRateOption, shiftHours, useSupplierAgreedRates } from './use-supplier-agreed-rates';


const BidSchema = zod.object({
  bidPrice: zod
    .string()
    .min(1, { message: 'Bid price is required!' })
    .regex(/^\d+(\.\d{1,2})?$/, { message: 'Enter a valid amount' })
    .refine((value) => Number(value) > 0, { message: 'Bid price must be greater than 0' }),
  notes: zod.string().optional(),
});

const defaultValues = {
  agreedRateId: '',
  bidPrice: '',
  notes: '',
};

function defaultBidPrice(job, shiftRow) {
  const raw = shiftRow?.hourlyRate ?? job?.hourlyRate;
  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount <= 0) return '';
  return String(Math.round(amount * 100) / 100);
}

export function AgencyJobBidDialog({
  open,
  job,
  shiftRow = null,
  submitting = false,
  submitError = '',
  submitBlocked = false,
  onClose,
  onSubmit,
  rateApiBase = '',
}) {
  const methods = useForm({
    resolver: zodResolver(BidSchema),
    defaultValues,
    mode: 'onBlur',
  });

  const { reset, handleSubmit, setValue, watch } = methods;
  const selectedRateId = watch('agreedRateId');

  const { isAgreed, rateOptions, checkingAgreedRate, agreedRatesError } = useSupplierAgreedRates({
    open,
    job,
    shiftRow,
    rateApiBase,
  });
  const selectedRate = useMemo(
    () => rateOptions.find((option) => option.id === selectedRateId) || null,
    [rateOptions, selectedRateId]
  );
  const hours = shiftHours(shiftRow, job);

  const scheduleLabel = shiftRow?.label || job?.schedule || '';
  const blocked = Boolean(submitBlocked || submitError);

  useEffect(() => {
    if (!open || blocked) return;
    reset({
      ...defaultValues,
      bidPrice: defaultBidPrice(job, shiftRow),
    });
  }, [open, blocked, job?.id, job?.hourlyRate, shiftRow?.id, shiftRow?.hourlyRate, reset]);

  useEffect(() => {
    if (!open || blocked || !isAgreed || !rateOptions.length) return;
    if (rateOptions.some((option) => option.id === selectedRateId)) return;
    const picked = pickAgreedRateOption(rateOptions, { hours });
    if (!picked) return;
    setValue('agreedRateId', picked.id, { shouldValidate: true, shouldDirty: false });
    setValue('bidPrice', bidTotalForRate(picked.rate, hours), { shouldValidate: true, shouldDirty: false });
  }, [open, blocked, isAgreed, rateOptions, selectedRateId, hours, setValue]);

  const handleSelectAgreedRate = (event) => {
    const nextId = event.target.value;
    const option = rateOptions.find((item) => item.id === nextId);
    setValue('agreedRateId', nextId, { shouldValidate: true, shouldDirty: true });
    if (!option) {
      setValue('bidPrice', '', { shouldValidate: true, shouldDirty: true });
      return;
    }
    setValue('bidPrice', bidTotalForRate(option.rate, hours), { shouldValidate: true, shouldDirty: true });
  };

  const handleFormSubmit = handleSubmit(async (data) => {
    if (blocked || submitting) return;
    await onSubmit?.({
      ...data,
      job,
      shiftRow,
      usedAgreedRate: Boolean(selectedRate),
      agreedHourlyRate: selectedRate?.rate,
    });
  });

  if (!job) return null;

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'grey.800',
        },
      }}
    >
      <DialogContent sx={{ p: 3, position: 'relative' }}>
        <IconButton
          aria-label="Close"
          onClick={onClose}
          disabled={submitting}
          size="small"
          sx={{ position: 'absolute', right: 8, top: 8, zIndex: 1 }}
        >
          <Iconify icon="eva:close-fill" />
        </IconButton>
        <Stack spacing={3}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ width: 1, pr: 4 }}>
            <JobMediaThumb
              image={job.image}
              alt={job.title}
              width={56}
              height={56}
              sx={{ flexShrink: 0 }}
            />
            <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                {job.title}
              </Typography>
              {scheduleLabel ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.4, mt: 0.25 }}>
                  {scheduleLabel}
                </Typography>
              ) : null}
            </Box>
          </Stack>

          {submitError ? (
            <Alert severity="error" sx={{ alignItems: 'flex-start', fontWeight: 600 }}>
              {submitError}
            </Alert>
          ) : null}

          {checkingAgreedRate ? <LinearProgress /> : null}

          <Form methods={methods} onSubmit={handleFormSubmit}>
            <Stack spacing={2.5}>
              {isAgreed ? (
                <Field.Select
                  name="agreedRateId"
                  label="Agreed rate"
                  disabled={submitting || blocked || checkingAgreedRate}
                  InputLabelProps={{ shrink: true }}
                  onChange={handleSelectAgreedRate}
                  helperText={
                    checkingAgreedRate
                      ? 'Loading agreed rates...'
                      : selectedRate
                        ? `${fCurrency(selectedRate.rate)}/h${hours > 0 ? ` · bid ${fCurrency(Number(bidTotalForRate(selectedRate.rate, hours)))} for this shift` : ''}`
                        : agreedRatesError
                          ? 'Could not load agreed rates'
                          : 'Select the agreed rate for this job role'
                  }
                >
                  {rateOptions.map((option) => (
                    <MenuItem key={option.id} value={option.id}>
                      {option.label} · {fCurrency(option.rate)}/h
                    </MenuItem>
                  ))}
                </Field.Select>
              ) : (
                <>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Offer your bid
                  </Typography>
                  <Field.Text
                    name="bidPrice"
                    label="Bid Price (£)"
                    placeholder="0"
                    disabled={submitting || blocked}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ inputMode: 'decimal' }}
                    onChange={(event) => {
                      const next = event.target.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');
                      setValue('bidPrice', next, { shouldValidate: true, shouldDirty: true });
                    }}
                  />
                </>
              )}

              <Field.Text
                name="notes"
                label="Notes"
                placeholder=""
                multiline
                rows={4}
                disabled={submitting || blocked}
                InputLabelProps={{ shrink: true }}
              />

              <LoadingButton
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  loading={submitting}
                  disabled={submitting || blocked}
                  sx={{ mt: 1, py: 1.25, fontWeight: 700 }}
                >
                  {blocked ? 'Bid already exists' : 'Submit Bid'}
              </LoadingButton>

              {blocked ? (
                <Button fullWidth variant="text" color="inherit" disabled={submitting} onClick={onClose}>
                  Close
                </Button>
              ) : null}
            </Stack>
          </Form>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
