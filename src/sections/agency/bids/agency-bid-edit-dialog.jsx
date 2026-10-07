import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z as zod } from 'zod';

import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { fCurrency } from 'src/utils/format-number';

import { Form, Field } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';

import {
  canReofferBid,
  computeHourlyRate,
  formatBidDeadlineLabel,
} from './bids-actions';
import { canEditAgencyBid } from './agency-bid-api-utils';
import { bidTotalForRate, pickAgreedRateOption, shiftHours, useSupplierAgreedRates } from '../jobs/use-supplier-agreed-rates';

// ----------------------------------------------------------------------

const BidEditSchema = zod.object({
  agreedRateId: zod.string().optional(),
  bidAmount: zod
    .string()
    .min(1, { message: 'Offer amount is required!' })
    .regex(/^\d+(\.\d{1,2})?$/, { message: 'Enter a valid amount!' }),
  notes: zod.string().optional(),
});

/**
 * @param {'edit' | 'reoffer'} mode
 *  - edit: update same bid (any amount) — Find Jobs after Bid Now
 *  - reoffer: must be lower than current — Bids page “lower quote”
 */
function agreedJobFromBid(bid, job) {
  if (job && typeof job === 'object') {
    return {
      ...job,
      hasAgreedRate: job.hasAgreedRate === true || bid?.hasAgreedRate === true,
      hours: job.hours || bid?.hours,
      shiftStartTime: job.shiftStartTime || bid?.startTime,
      shiftEndTime: job.shiftEndTime || bid?.endTime,
    };
  }
  if (!bid) return null;
  return {
    id: bid.jobId,
    hasAgreedRate: bid.hasAgreedRate === true,
    postedBy: { id: bid.posterUserId, name: bid.posterName || bid.careHome },
    customerId: bid.posterUserId,
    jobTypeTitle: bid.jobTypeTitle || '',
    role: bid.jobTypeTitle || '',
    title: bid.jobTitle,
    hours: bid.hours,
    shiftStartTime: bid.startTime,
    shiftEndTime: bid.endTime,
  };
}

export function AgencyBidEditDialog({
  open,
  bid,
  job = null,
  shiftRow = null,
  mode = 'edit',
  submitting = false,
  rateApiBase = '',
  onClose,
  onSubmit,
}) {
  const isReoffer = mode === 'reoffer';
  // Edit / re-offer only while bid is still pending (poster has not declined/accepted)
  const canEdit = isReoffer ? canReofferBid(bid) : canEditAgencyBid(bid);
  const currentAmount = Number(bid?.bidAmount) || 0;
  const agreedJob = agreedJobFromBid(bid, job);

  const methods = useForm({
    resolver: zodResolver(BidEditSchema),
    defaultValues: { agreedRateId: '', bidAmount: '', notes: '' },
    mode: 'onBlur',
  });

  const { reset, handleSubmit, setError, setValue, watch } = methods;
  const bidAmountValue = watch('bidAmount');
  const selectedRateId = watch('agreedRateId');
  const { isAgreed, rateOptions, checkingAgreedRate, agreedRatesError } = useSupplierAgreedRates({
    open: open && !isReoffer,
    job: agreedJob,
    shiftRow,
    rateApiBase,
  });
  const showAgreedDropdown = !isReoffer && isAgreed;
  const hours = Number(bid?.hours) || shiftHours(shiftRow, agreedJob);
  const selectedRate = useMemo(
    () => rateOptions.find((option) => option.id === selectedRateId) || null,
    [rateOptions, selectedRateId]
  );

  useEffect(() => {
    if (open && bid) {
      if (isReoffer) {
        const suggested = Math.max(1, Math.round((bid.bidAmount - 5) * 100) / 100);
        reset({
          agreedRateId: '',
          bidAmount: String(suggested < bid.bidAmount ? suggested : Math.max(1, bid.bidAmount - 1)),
          notes: bid.notes || bid.note || '',
        });
      } else {
        reset({
          agreedRateId: '',
          bidAmount: String(bid.bidAmount ?? ''),
          notes: bid.notes || bid.note || '',
        });
      }
    }
  }, [open, bid, isReoffer, reset]);

  useEffect(() => {
    if (!open || !showAgreedDropdown || !rateOptions.length) return;
    if (rateOptions.some((option) => option.id === selectedRateId)) return;
    const picked = pickAgreedRateOption(rateOptions, {
      amount: bid?.bidAmount,
      hourlyRate: bid?.agreedHourlyRate,
      hours,
    });
    if (!picked) return;
    setValue('agreedRateId', picked.id, { shouldDirty: false });
    setValue('bidAmount', bidTotalForRate(picked.rate, hours), { shouldValidate: true, shouldDirty: false });
  }, [open, showAgreedDropdown, rateOptions, selectedRateId, bid, hours, setValue]);

  const handleSelectAgreedRate = (event) => {
    const nextId = event.target.value;
    const option = rateOptions.find((item) => item.id === nextId);
    setValue('agreedRateId', nextId, { shouldDirty: true });
    if (!option) return;
    setValue('bidAmount', bidTotalForRate(option.rate, hours), { shouldValidate: true, shouldDirty: true });
  };

  const handleFormSubmit = handleSubmit(async (data) => {
    if (!canEdit) {
      toast.error(
        isReoffer
          ? 'Deadline has passed — re-offer is closed'
          : 'This offer was declined or is no longer editable'
      );
      return;
    }

    const bidAmount = parseFloat(data.bidAmount);
    if (!(bidAmount > 0)) {
      setError('bidAmount', { message: 'Amount must be greater than 0' });
      return;
    }
    if (isReoffer && !(bidAmount < currentAmount)) {
      setError('bidAmount', {
        message: `Re-offer must be lower than current bid (${fCurrency(currentAmount)})`,
      });
      return;
    }

    await onSubmit?.({
      bidAmount,
      notes: data.notes,
      hourlyRate: computeHourlyRate(bidAmount, bid.hours),
    });
  });

  if (!bid) return null;

  const previewRate =
    bidAmountValue && /^\d+(\.\d{1,2})?$/.test(bidAmountValue)
      ? computeHourlyRate(parseFloat(bidAmountValue), bid.hours)
      : bid.hourlyRate;

  const savings =
    isReoffer && bidAmountValue && /^\d+(\.\d{1,2})?$/.test(bidAmountValue)
      ? Math.max(0, currentAmount - parseFloat(bidAmountValue))
      : 0;

  const deadlineLabel = formatBidDeadlineLabel(bid);

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ pr: 6 }}>
        {isReoffer ? 'Lower quote to win this shift' : 'Edit bid'}
        <IconButton
          aria-label="Close"
          onClick={onClose}
          disabled={submitting}
          size="small"
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <Iconify icon="eva:close-fill" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {bid.jobTitle} · {bid.careHome}
        </Typography>

        {!canEdit ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            This bid cannot be edited right now.
          </Alert>
        ) : isReoffer ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            {deadlineLabel
              ? `Deadline still open (${deadlineLabel}). `
              : 'Pending bid — '}
            Lower your quote below {fCurrency(currentAmount)} to improve your chance of winning this
            shift.
          </Alert>
        ) : (
          <Alert severity="info" sx={{ mb: 2 }}>
            Update bid amount or notes. Current:{' '}
            <strong>{fCurrency(currentAmount || 0)}</strong>
          </Alert>
        )}

        <Form methods={methods} onSubmit={handleFormSubmit} id="agency-bid-edit-form">
          <Stack spacing={2}>
            {showAgreedDropdown ? (
              <Field.Select
                name="agreedRateId"
                label="Agreed rate"
                disabled={!canEdit || submitting || checkingAgreedRate}
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
              <Field.Text
                name="bidAmount"
                label={isReoffer ? 'New lower offer' : 'Bid amount'}
                placeholder="0.00"
                disabled={!canEdit || submitting}
                InputLabelProps={{ shrink: true }}
                inputProps={{ inputMode: 'decimal' }}
              />
            )}

            <Field.Text
              name="notes"
              label="Notes"
              placeholder=""
              multiline
              rows={3}
              disabled={!canEdit || submitting}
              InputLabelProps={{ shrink: true }}
            />

            {bid.hours > 0 && (
              <Typography variant="caption" color="text.secondary">
                Hourly rate: {fCurrency(previewRate)}/hr ({bid.hours}h shift)
                {savings > 0 ? ` · saves ${fCurrency(savings)}` : ''}
              </Typography>
            )}
          </Stack>
        </Form>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button color="inherit" variant="outlined" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <LoadingButton
          type="button"
          variant="contained"
          color="primary"
          loading={submitting}
          disabled={!canEdit}
          onClick={handleFormSubmit}
        >
          {isReoffer ? 'Submit lower quote' : 'Save bid'}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
