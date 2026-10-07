import { extractReviewCriteria, resolveReviewOverallRating } from './review-criteria-utils';

function pickId(value) {
  if (value == null || value === '') return '';
  if (typeof value === 'object') {
    return String(value._id || value.id || '').trim();
  }
  return String(value).trim();
}

export function formatReviewPostedAt(value) {
  if (!value) return '';
  if (typeof value === 'string') {
    if (/just now/i.test(value)) return value;
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  }
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toISOString().slice(0, 10);
  } catch {
    return String(value);
  }
}

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function pickText(...values) {
  return values.map((value) => (typeof value === 'string' ? value.trim() : '')).find(Boolean) || '';
}

/**
 * Job/booking context of a review. Booking reviews may arrive with `objectId`
 * populated as the booking document (booking.job / booking.shift nested).
 */
export function extractReviewJobInfo(item = {}) {
  const reviewType = String(item.reviewType || item.type || '').toLowerCase();
  const populatedObject = asObject(item.objectId) || asObject(item.object) || asObject(item.target);
  const booking = asObject(item.booking) || (reviewType === 'booking' ? populatedObject : null) || {};
  const job = asObject(item.job) || asObject(booking.job) || {};
  const jobType = asObject(job.type) || {};
  const shift = asObject(item.shift) || asObject(booking.shift) || {};

  const bookingId = pickId(item.booking) || pickId(item.bookingId) || (reviewType === 'booking' ? pickId(item.objectId || item.targetId || item.object) : '');

  return {
    bookingId,
    jobId: pickId(item.job) || pickId(item.jobId) || pickId(booking.job) || pickId(booking.jobId),
    jobTitle: pickText(job.name, job.title, jobType.title, jobType.name, item.jobTitle, item.jobName, booking.jobTitle, booking.title),
    shiftDate: formatReviewPostedAt(shift.date || booking.date || booking.shiftDate || item.shiftDate),
  };
}

export function mapReviewFromApi(item = {}) {
  // `subject` is the author (customer); `nurse` / `objectUser` is the reviewed worker.
  const reviewer = asObject(item.subject) || asObject(item.user) || asObject(item.reviewer) || {};

  return {
    ...extractReviewJobInfo(item),
    id: pickId(item._id || item.id),
    reviewType: String(item.reviewType || item.type || 'user').toLowerCase(),
    objectId: pickId(item.objectId || item.targetId || item.object),
    rating: Number(item.rating ?? item.overallRating ?? 0) || 0,
    criteria: extractReviewCriteria(item),
    source: String(item.source || item.reviewSource || 'client').toLowerCase(),
    comment: String(item.comment || item.review || item.message || '').trim(),
    postedAt: formatReviewPostedAt(item.createdAt || item.postedAt || item.reviewedAt),
    reviewedAt: formatReviewPostedAt(item.createdAt || item.postedAt || item.reviewedAt),
    name: reviewer.name || item.name || item.userName || item.reviewerName || 'Reviewer',
    avatarUrl: reviewer.profileIcon || reviewer.avatarUrl || item.avatarUrl || item.profileIcon || null,
    reviewedUserId: pickId(item.objectUser) || pickId(item.nurse),
    reviewerId:
      pickId(reviewer._id || reviewer.id) ||
      pickId(item.subject) ||
      pickId(item.user) ||
      pickId(item.userId) ||
      pickId(item.createdBy) ||
      pickId(item.reviewedBy) ||
      pickId(item.author),
    status: String(item.status || 'active').toLowerCase(),
    raw: item,
  };
}

/** Review attached to a job/booking API item (`review` or first of `reviews`). */
export function pickApiReview(item = {}) {
  const raw = asObject(item.review) || (Array.isArray(item.reviews) ? asObject(item.reviews[0]) : null);
  const review = raw ? mapReviewFromApi(raw) : null;
  return review?.id ? review : null;
}

/** Job/booking API flags — `isReviewed` and `hasReview` are not always in sync, so any of them counts. */
export function isApiReviewed(item = {}) {
  return Boolean(item.isReviewed || item.hasReview || pickApiReview(item));
}

export function withResolvedReviewRating(review = {}) {
  const criteria = review.criteria || extractReviewCriteria(review);
  return {
    ...review,
    criteria,
    rating: resolveReviewOverallRating(review, criteria),
  };
}

export function extractReviewsList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.reviews)) return response.reviews;
  if (Array.isArray(response?.results)) return response.results;
  return [];
}

/**
 * Closed-job Leave Review target (POST /reviews):
 * booking id → { reviewType: 'booking' } (backend sets objectUser = booking worker),
 * else the assigned worker → { reviewType: 'user' }.
 * Never job.user (that is the customer who posted the job) and never the job id.
 */
export function resolveJobReviewTarget(job = {}) {
  const scheduleBookingId = (Array.isArray(job.schedules) ? job.schedules : []).map((shift) => pickId(shift?.bookingId)).find(Boolean);
  const bookingId = pickId(job.bookingId) || pickId(job.booking) || pickId(job.acceptedBookingId) || pickId(job.latestBookingId) || scheduleBookingId;
  if (bookingId) {
    return { reviewType: 'booking', objectId: bookingId };
  }

  const scheduleWorkerId = (Array.isArray(job.schedules) ? job.schedules : []).map((shift) => pickId(shift?.workerId)).find(Boolean);
  const workerId = pickId(job.worker) || pickId(job.workerId) || scheduleWorkerId;
  return workerId ? { reviewType: 'user', objectId: workerId } : null;
}

/** Submit target: an existing review keeps its own type/object (update), otherwise resolve from the job (create). */
export function resolveReviewSubmitTarget(job = {}) {
  const review = job.review || {};
  if (review.id) {
    const objectId = pickId(review.objectId);
    return { reviewType: review.reviewType || 'booking', objectId, reviewId: review.id };
  }
  return resolveJobReviewTarget(job);
}

/** Whether an API review belongs to this job (by booking/worker target, or the booking's job). */
export function reviewMatchesJob(review = {}, job = {}, target = resolveJobReviewTarget(job)) {
  if (target?.objectId && String(review.reviewType) === target.reviewType && String(review.objectId) === target.objectId) {
    return true;
  }
  const jobId = pickId(job.id || job._id);
  return Boolean(jobId && review.jobId && String(review.jobId) === jobId);
}

/**
 * This customer's existing review on a booking/user target (one review per target; update instead of create).
 * A booking can only be reviewed by its own customer, so any review on it is theirs; user reviews
 * must carry the author to be matched.
 */
export function findOwnReviewForTarget(reviews = [], target = null, currentUserId = '') {
  if (!target?.objectId) return null;
  const me = String(currentUserId || '').trim();
  return (
    (Array.isArray(reviews) ? reviews : []).find((review) => {
      if (!review.id || String(review.reviewType) !== target.reviewType || String(review.objectId) !== target.objectId) {
        return false;
      }
      if (review.reviewerId) return review.reviewerId === me;
      return target.reviewType === 'booking';
    }) || null
  );
}

function isCompletedBooking(booking = {}) {
  return booking.status === 'completed' || booking.jobStatus === 'completed';
}

/**
 * The job's booking to show/rate: an already reviewed booking first (so the card shows it),
 * else a completed one with a worker.
 */
export function pickReviewableJobBooking(bookings = [], jobId = '') {
  const id = String(jobId || '').trim();
  const forJob = (Array.isArray(bookings) ? bookings : []).filter((booking) => booking.id && String(booking.jobId) === id);
  return (
    forJob.find((booking) => booking.review?.id) ||
    forJob.find((booking) => isCompletedBooking(booking) && booking.workerId) ||
    forJob.find(isCompletedBooking) ||
    null
  );
}

/** Review from a POST/PUT /reviews response ({ data: { review } }). */
export function mapReviewMutationResponse(response) {
  const item = response?.data?.review || response?.review || response?.data || null;
  const review = item && typeof item === 'object' ? mapReviewFromApi(item) : null;
  return review?.id ? review : null;
}

/**
 * Attach each job's review so the card shows the rating + "Update" instead of "Rate worker".
 * Order: review saved this session (`localReviews`, jobId → review) → review on the job →
 * review on the job's booking (job API omits both the booking id and, currently, the review) →
 * match in the customer's GET /reviews list.
 */
export function attachJobReviews(jobs = [], { reviews = [], bookings = [], localReviews = null } = {}) {
  return (Array.isArray(jobs) ? jobs : []).map((job) => {
    if (!job) return job;
    const jobId = pickId(job.id || job._id);
    const target = resolveJobReviewTarget(job);
    const booking = pickReviewableJobBooking(bookings, jobId);
    const nextJob =
      booking && target?.reviewType !== 'booking'
        ? { ...job, bookingId: booking.id, workerId: job.workerId || booking.workerId }
        : job;

    const local = jobId ? localReviews?.get(jobId) : null;
    if (local) return { ...nextJob, review: local, isReviewed: true };
    if (nextJob.review?.id || nextJob.review?.rating) return nextJob;
    if (booking?.review?.id) return { ...nextJob, review: booking.review, isReviewed: true };

    const matched = reviews.find((review) => reviewMatchesJob(review, nextJob));
    return matched ? { ...nextJob, review: matched, isReviewed: true } : nextJob;
  });
}

export function resolveStaffReviewObjectId(staff = {}) {
  return pickId(staff.staffId || staff.workerId || staff.userId || staff.id);
}
