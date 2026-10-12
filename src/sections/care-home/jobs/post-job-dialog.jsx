import { useCallback, useEffect, useRef, useState } from 'react';

import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { toast } from 'src/components/snackbar';
import { CustomerMandateNotice, useCustomerMandateBlock } from 'src/sections/agency/payments/customer-mandate-notice';

import { JobDraftForm } from './care-home-job-form';
import { JobCareDetailsFields } from './job-care-details-fields';
import { getJobApiErrorMessage } from './care-home-job-api-utils';
import {
  EMPTY_JOB_DRAFT,
  JOB_STATUS_OPTIONS,
  createDefaultSchedule,
  jobToDraft,
  mergeEmptyJobContact,
  validateCareDetails,
  validateJobDraft,
} from './care-home-job-utils';
import { useLastJobContactDetails } from './use-last-job-contact';


function buildOpenDraft({ editingJob, initialDraft }) {
  if (editingJob) return jobToDraft(editingJob);

  if (initialDraft) {
    return {
      ...EMPTY_JOB_DRAFT,
      ...initialDraft,
      type: '',
      typeId: '',
      typeTitle: '',
      branchId: '',
      address: '',
      location: null,
      gender: '',
      schedules: initialDraft.schedules?.length
        ? initialDraft.schedules.map((entry) => ({ ...entry }))
        : [{ ...createDefaultSchedule() }],
    };
  }

  return { ...EMPTY_JOB_DRAFT, schedules: [{ ...createDefaultSchedule() }] };
}

export function PostJobDialog({
  open,
  onClose,
  onSubmit,
  editingJob = null,
  initialDraft = null,
  mode = 'careHome',
  calendarTeamLabels = null,
  typeFieldLabel = 'Type',
  intent = 'job',
}) {
  const { blocked: mandateBlocked } = useCustomerMandateBlock(mode);
  const [draft, setDraft] = useState(EMPTY_JOB_DRAFT);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const wasOpenRef = useRef(false);
  const contactAppliedRef = useRef(false);
  const lastContact = useLastJobContactDetails(mode, open && !editingJob);

  const isBookShift = intent === 'bookShift' && !editingJob;
  const isRequest = intent === 'request' && !editingJob;
  const dialogTitle = editingJob
    ? 'Edit job'
    : isBookShift
      ? 'Book shift'
      : isRequest
        ? 'Request staff'
        : 'Add job';
  const submitLabel = editingJob
    ? 'Save changes'
    : draft.requestFromAgency || isRequest
      ? 'Send request'
      : isBookShift
        ? 'Book shift'
        : 'Add job';

  useEffect(() => {
    if (!open) {
      contactAppliedRef.current = false;
    }
    if (open && !wasOpenRef.current) {
      const next = buildOpenDraft({ editingJob, initialDraft });
      setDraft(editingJob ? next : mergeEmptyJobContact(next, lastContact));
      setStep(1);
      setFormError('');
      setSubmitting(false);
      contactAppliedRef.current = Boolean(!editingJob && lastContact);
    }
    wasOpenRef.current = open;
  }, [open, editingJob, initialDraft, lastContact]);

  useEffect(() => {
    if (!open || editingJob || !lastContact || contactAppliedRef.current) return;
    contactAppliedRef.current = true;
    setDraft((prev) => mergeEmptyJobContact(prev, lastContact));
  }, [editingJob, lastContact, open]);

  const handleDraftChange = useCallback((field, value) => {
    setFormError('');
    setDraft((prev) => {
      if (field && typeof field === 'object' && value === undefined) {
        return { ...prev, ...field };
      }
      return { ...prev, [field]: value };
    });
  }, []);

  const handleSchedulesChange = useCallback((schedules) => {
    setFormError('');
    setDraft((prev) => ({ ...prev, schedules }));
  }, []);

  const handleNextStep = useCallback(() => {
    if (!editingJob && mandateBlocked) {
      const message = 'Set up a direct debit on Payments before posting a job.';
      setFormError(message);
      toast.error(message);
      return;
    }
    const error = validateJobDraft(draft);
    if (error) {
      setFormError(error);
      toast.error(error);
      return;
    }
    setFormError('');
    setStep(2);
  }, [draft, editingJob, mandateBlocked]);

  const handleSubmit = useCallback(async () => {
    if (!editingJob && mandateBlocked) {
      const message = 'Set up a direct debit on Payments before posting a job.';
      setFormError(message);
      toast.error(message);
      return;
    }
    const error = validateJobDraft(draft);
    if (error) {
      setFormError(error);
      toast.error(error);
      setStep(1);
      return;
    }

    if (!editingJob) {
      const careError = validateCareDetails(draft);
      if (careError) {
        setFormError(careError);
        toast.error(careError);
        setStep(2);
        return;
      }
    }

    setSubmitting(true);
    setFormError('');
    try {
      await onSubmit({
        ...draft,
        schedules: draft.schedules.map((entry) => ({ ...entry })),
      });
      onClose();
    } catch (err) {
      const message =
        getJobApiErrorMessage(err) ||
        err?.data?.message ||
        err?.error ||
        err?.message ||
        'Could not send request. Please try again.';
      setFormError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }, [draft, editingJob, mandateBlocked, onClose, onSubmit]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      disableEnforceFocus
      fullWidth
      maxWidth="md"
      fullScreen={false}
      scroll="paper"
      sx={{
        '& .MuiDialog-paper': {
          m: { xs: 1.5, sm: 2 },
          width: { xs: 'calc(100% - 24px)', sm: '100%' },
          maxHeight: { xs: 'calc(100% - 24px)', sm: '90vh' },
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <DialogTitle>
        {dialogTitle}
        {!editingJob ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 400 }}>
            Step {step} of 2 — {step === 1 ? 'Job details' : 'Care details'}
          </Typography>
        ) : null}
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          pt: { xs: 2.75, sm: 3 },
          pb: 2.5,
          px: { xs: 2, sm: 3 },
          overflowY: 'auto',
          overflowX: 'hidden',
          '& .MuiFormControl-root, & .MuiTextField-root': {
            mt: 1,
            overflow: 'visible',
          },
        }}
      >
        {step === 1 ? (
          <>
            {!editingJob ? <CustomerMandateNotice mode={mode} sx={{ mb: 2 }} /> : null}
            {editingJob && (
              <FormControl fullWidth size="small" sx={{ mb: 2.5 }}>
                <InputLabel id="job-edit-status-label" shrink>
                  Status
                </InputLabel>
                <Select
                  labelId="job-edit-status-label"
                  value={draft.status || 'active'}
                  label="Status"
                  notched
                  onChange={(event) => handleDraftChange('status', event.target.value)}
                >
                  {JOB_STATUS_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <JobDraftForm
              mode={mode}
              draft={draft}
              onChange={handleDraftChange}
              onSchedulesChange={handleSchedulesChange}
              calendarTeamLabels={calendarTeamLabels}
              typeFieldLabel={typeFieldLabel}
            />
          </>
        ) : (
          <JobCareDetailsFields draft={draft} onChange={handleDraftChange} />
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, flexDirection: 'column', alignItems: 'stretch', gap: 1 }}>
        {formError ? (
          <Typography role="alert" variant="body2" color="error" sx={{ px: 0.5 }}>
            {formError}
          </Typography>
        ) : null}
        <Stack direction="row" justifyContent="flex-end" spacing={1.5} component="div" sx={{ width: 1 }}>
          <Button type="button" color="inherit" variant="outlined" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          {step === 2 ? (
            <Button
              type="button"
              color="inherit"
              variant="outlined"
              onClick={() => setStep(1)}
              disabled={submitting}
            >
              Back
            </Button>
          ) : null}
          {step === 1 ? (
            <Button
              type="button"
              variant="contained"
              color="primary"
              disabled={!editingJob && mandateBlocked}
              onClick={handleNextStep}
            >
              Next — Care details
            </Button>
          ) : (
            <LoadingButton
              type="button"
              variant="contained"
              color="primary"
              loading={submitting}
              disabled={!editingJob && mandateBlocked}
              onClick={handleSubmit}
            >
              {submitLabel}
            </LoadingButton>
          )}
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
