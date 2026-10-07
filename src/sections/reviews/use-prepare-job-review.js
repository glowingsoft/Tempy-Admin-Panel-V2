import { useCallback } from 'react';

import { toast } from 'src/components/snackbar';
import { useScopedUserId } from 'src/hooks/use-scoped-user-id';
import { useLazyGetJobReviewBookingsQuery, useLazyGetReviewsQuery } from 'src/store/Reducer/reviews-api';

import { findOwnReviewForTarget, pickReviewableJobBooking, resolveJobReviewTarget } from './reviews-api-utils';

// ----------------------------------------------------------------------

/**
 * Resolves what a "Rate worker" review targets before the dialog opens.
 * - Jobs from the list API usually carry no booking id, so the completed booking
 *   is looked up from GET /web/<role>/booking?job=<jobId>.
 * - If this customer already reviewed that booking/worker, the existing review is
 *   attached so the dialog updates it instead of creating a duplicate.
 * Resolves to the job (bookingId / review filled in) or null when there is nothing to review.
 */
export function usePrepareJobReview(mode) {
  const currentUserId = useScopedUserId();
  const [fetchJobBookings, { isFetching: fetchingBookings }] = useLazyGetJobReviewBookingsQuery();
  const [fetchReviews, { isFetching: fetchingReviews }] = useLazyGetReviewsQuery();

  const resolveTargetJob = useCallback(
    async (job) => {
      const target = resolveJobReviewTarget(job);
      if (target?.reviewType === 'booking') return job;

      const jobId = String(job.id || job._id || '').trim();
      try {
        const bookings = jobId ? await fetchJobBookings({ mode, jobId }).unwrap() : [];
        const booking = pickReviewableJobBooking(bookings, jobId);
        if (booking) {
          return { ...job, bookingId: booking.id, workerId: job.workerId || booking.workerId };
        }
      } catch {
        // fall through to the worker target, if any
      }

      return target?.objectId ? job : null;
    },
    [fetchJobBookings, mode]
  );

  const prepareReviewJob = useCallback(
    async (job) => {
      if (!job) return null;
      if (job.review?.id) return job;

      const targetJob = await resolveTargetJob(job);
      if (!targetJob) {
        toast.error('No completed booking found for this job yet, so there is no worker to rate.');
        return null;
      }

      const target = resolveJobReviewTarget(targetJob);
      try {
        const { data: reviews = [] } = await fetchReviews({
          page: 0,
          limit: 50,
          reviewType: target.reviewType,
          objectId: target.objectId,
        }).unwrap();
        const existing = findOwnReviewForTarget(reviews, target, currentUserId);
        if (existing) return { ...targetJob, review: existing };
      } catch {
        // lookup is best-effort; the backend still rejects duplicate booking reviews
      }

      return targetJob;
    },
    [currentUserId, fetchReviews, resolveTargetJob]
  );

  return { prepareReviewJob, preparingReview: fetchingBookings || fetchingReviews };
}
