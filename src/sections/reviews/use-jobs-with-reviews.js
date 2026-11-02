import { useMemo, useState, useEffect, useCallback } from 'react';

import { useGetReviewsQuery, useLazyGetJobReviewBookingsQuery } from 'src/store/Reducer/reviews-api';

import { attachJobReviews } from './reviews-api-utils';


function pickJobId(job) {
  return String(job?.id || job?._id || '').trim();
}

function isCompletedJob(job) {
  return String(job?.apiStatus || job?.status || '').toLowerCase() === 'completed';
}

export function useJobsWithReviews(mode, jobs = []) {
  const [localReviews, setLocalReviews] = useState(() => new Map());
  const [bookings, setBookings] = useState([]);
  const [fetchJobBookings] = useLazyGetJobReviewBookingsQuery();

  const { data: reviewsData } = useGetReviewsQuery({ page: 0, limit: 200 });

  const jobIdsNeedingBookings = useMemo(() => {
    const ids = [];
    const seen = new Set();
    (Array.isArray(jobs) ? jobs : []).forEach((job) => {
      if (!job || !isCompletedJob(job)) return;
      const jobId = pickJobId(job);
      if (!jobId || seen.has(jobId)) return;
      if (job.review?.id || localReviews.get(jobId)) return;
      seen.add(jobId);
      ids.push(jobId);
    });
    return ids;
  }, [jobs, localReviews]);

  const jobIdsKey = jobIdsNeedingBookings.join(',');

  useEffect(() => {
    if (!jobIdsKey) {
      setBookings([]);
      return undefined;
    }

    const jobIds = jobIdsKey.split(',').filter(Boolean);
    let cancelled = false;

    (async () => {
      const pages = await Promise.all(
        jobIds.map(async (jobId) => {
          try {
            const list = await fetchJobBookings({ mode, jobId, limit: 100 }).unwrap();
            return Array.isArray(list) ? list : [];
          } catch {
            return [];
          }
        })
      );
      if (!cancelled) setBookings(pages.flat());
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchJobBookings, jobIdsKey, mode]);

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

  const jobsWithReviews = useMemo(
    () => attachJobReviews(jobs, { reviews: reviewsData?.data || [], bookings, localReviews }),
    [bookings, jobs, localReviews, reviewsData?.data]
  );

  return { jobs: jobsWithReviews, reviews: reviewsData?.data || [], rememberReview, forgetReview };
}
