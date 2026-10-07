import { useMemo } from 'react';

import { useGetNurseReviewsQuery, useGetReviewsQuery } from 'src/store/Reducer/reviews-api';
import { useGetNurseBookingsQuery } from 'src/store/Reducer/nurse-bookings-api';
import { useIsImpersonating, useScopedUserId } from 'src/hooks/use-scoped-user-id';
import { useStaffCancellationStats } from 'src/sections/staff-member/jobs/use-staff-cancellation-stats';

import { calculateStaffRatingScores } from './staff-member-rating-utils';

// ----------------------------------------------------------------------

/** Adds job title / shift date from the nurse's bookings when the review payload lacks them. */
function withBookingJobInfo(review, bookingsById) {
  const booking = review.bookingId ? bookingsById.get(review.bookingId) : null;
  if (!booking) return review;
  return {
    ...review,
    jobId: review.jobId || booking.jobId,
    jobTitle: review.jobTitle || booking.title,
    shiftDate: review.shiftDate || booking.shiftDate,
  };
}

export function useStaffMemberRatingScores() {
  const userId = useScopedUserId();
  const isImpersonating = useIsImpersonating();
  const cancellationStats = useStaffCancellationStats();

  // GET /reviews/all/:nurseId — reviews whose objectUser is this nurse (booking reviews).
  const nurseReviewsQuery = useGetNurseReviewsQuery({ nurseId: userId, page: 0, limit: 200 }, { skip: !userId });

  // Direct user reviews (reviewType: user, objectId = nurse) — best-effort, in case objectUser isn't set on them.
  const userReviewsQuery = useGetReviewsQuery({ page: 0, limit: 100, reviewType: 'user', objectId: userId }, { skip: !userId });

  const bookingsQuery = useGetNurseBookingsQuery({ page: 0, limit: 500, userId, requireOwner: isImpersonating }, { skip: !userId });

  const bookingsById = useMemo(() => {
    const map = new Map();
    (bookingsQuery.data?.data || []).forEach((booking) => {
      if (booking.id) map.set(booking.id, booking);
    });
    return map;
  }, [bookingsQuery.data?.data]);

  const apiReviews = useMemo(() => {
    const seen = new Set();

    return [...(nurseReviewsQuery.data?.data || []), ...(userReviewsQuery.data?.data || [])]
      .filter((review) => {
        if (seen.has(review.id)) return false;
        seen.add(review.id);
        return true;
      })
      .map((review) => withBookingJobInfo(review, bookingsById));
  }, [bookingsById, nurseReviewsQuery.data?.data, userReviewsQuery.data?.data]);

  const scores = useMemo(() => calculateStaffRatingScores(apiReviews, cancellationStats), [apiReviews, cancellationStats]);

  return {
    ...scores,
    isLoading: nurseReviewsQuery.isLoading || userReviewsQuery.isLoading || bookingsQuery.isLoading,
    // Direct-review / bookings lookups are best-effort; only the nurse reviews endpoint gates the page.
    isError: nurseReviewsQuery.isError,
    error: nurseReviewsQuery.error,
  };
}
