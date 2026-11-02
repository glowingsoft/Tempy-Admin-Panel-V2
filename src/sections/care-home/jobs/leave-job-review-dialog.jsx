import { RateWorkerDialog } from './rate-worker-dialog';


export function LeaveJobReviewDialog({
  open,
  job,
  onClose,
  onSubmit,
  onDelete,
  submitting = false,
  deleting = false,
}) {
  if (!job) return null;

  return (
    <RateWorkerDialog
      open={open}
      job={job}
      onClose={onClose}
      onSubmit={onSubmit}
      onDelete={onDelete}
      submitting={submitting}
      deleting={deleting}
    />
  );
}
