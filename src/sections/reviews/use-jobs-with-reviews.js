import { useMemo, useState, useCallback } from 'react';

import { useGetReviewsQuery, useGetJobReviewBookingsQuery } from 'src/store/Reducer/reviews-api';

import { attachJobReviews } from './reviews-api-utils';

// ----------------------------------------------------------------------

/**
 * Employer jobs enriched with their worker review:
 * - GET /reviews → the customer's reviews
 * - GET /web/<role>/booking → each booking's `job`, `jobStatus` and `review`; the job API has no
 *   booking id and its own `isReviewed` / `reviews` don't reflect booking reviews yet
 * - rememberReview(jobId, review) → shows a just-saved review immediately
 */
export function useJobsWithReviews(mode, jobs = []) {
  const [localReviews, setLocalReviews] = useState(() => new Map());

  const { data: reviewsData } = useGetReviewsQuery({ page: 0, limit: 200 });

  // Completed jobs without a review object need their booking (it carries `review` + the booking id).
  const needsBookings = useMemo(
    () =>
      (Array.isArray(jobs) ? jobs : []).some(
        (job) => job && !job.review?.id && String(job.apiStatus || job.status || '').toLowerCase() === 'completed'
      ),
    [jobs]
  );
  const { data: bookings = [] } = useGetJobReviewBookingsQuery({ mode, limit: 500 }, { skip: !needsBookings });

  const rememberReview = useCallback((jobId, review) => {
    const key = String(jobId || '').trim();
    if (!key || !review) return;
    setLocalReviews((prev) => new Map(prev).set(key, review));
  }, []);

  const forgetReview = useCallback((jobId) => {
    const key = String(jobId || '').trim();
    setLocalReviews((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const jobsWithReviews = useMemo(() => attachJobReviews(jobs, { reviews: reviewsData?.data || [], bookings, localReviews }), [bookings, jobs, localReviews, reviewsData?.data]);

  return { jobs: jobsWithReviews, reviews: reviewsData?.data || [], rememberReview, forgetReview };
}
