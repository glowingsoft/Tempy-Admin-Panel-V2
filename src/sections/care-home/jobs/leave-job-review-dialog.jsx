import { RateWorkerDialog } from './rate-worker-dialog';

// ----------------------------------------------------------------------

export function LeaveJobReviewDialog({
  open,
  job,
  onClose,
  onSubmit,
  submitting = false,
}) {
  if (!job) return null;

  return (
    <RateWorkerDialog
      open={open}
      job={job}
      onClose={onClose}
      onSubmit={onSubmit}
      submitting={submitting}
    />
  );
}
