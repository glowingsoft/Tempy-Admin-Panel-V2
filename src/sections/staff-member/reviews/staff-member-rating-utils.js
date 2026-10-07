import {
  LATE_CANCELLATION_CRITERIA_SCORES,
  STANDARD_CANCELLATION_CRITERIA_SCORES,
  STAFF_RATING_CRITERIA,
} from './staff-member-rating-criteria';
import { getLocalCancellationItems } from '../jobs/staff-member-cancellation-store';
import {
  extractReviewCriteria,
  resolveReviewOverallRating,
} from 'src/sections/reviews/review-criteria-utils';

// ----------------------------------------------------------------------

function toStar(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.min(5, Math.max(0, Math.round(num)));
}

function average(values = []) {
  const list = values.filter((value) => value > 0);
  if (!list.length) return 0;
  return list.reduce((sum, value) => sum + value, 0) / list.length;
}

function buildCancellationReview(item = {}, index = 0) {
  const within24Hours = Boolean(item.within24Hours);
  const criteria = within24Hours
    ? { ...LATE_CANCELLATION_CRITERIA_SCORES }
    : { ...STANDARD_CANCELLATION_CRITERIA_SCORES };

  return {
    id: `cancellation-${item.bookingId || item.jobId || index}`,
    source: 'cancellation',
    reviewType: 'system',
    rating: resolveReviewOverallRating({ criteria }),
    criteria,
    comment: within24Hours
      ? 'Late shift cancellation — automatic rating penalty applied.'
      : 'Shift cancellation — automatic rating penalty applied.',
    postedAt: item.cancelledAt || '',
    name: 'System',
    isCancellationPenalty: true,
    within24Hours,
  };
}

export function buildCancellationPenaltyReviews(cancellationStats = {}) {
  const items = getLocalCancellationItems();
  if (items.length) {
    return items.map((item, index) => buildCancellationReview(item, index));
  }

  const total = Number(cancellationStats.total) || 0;
  const late = Number(cancellationStats.late) || 0;
  const onTime = Math.max(0, total - late);
  const reviews = [];

  for (let index = 0; index < late; index += 1) {
    reviews.push(
      buildCancellationReview(
        { within24Hours: true, cancelledAt: '', bookingId: `late-${index}` },
        index
      )
    );
  }

  for (let index = 0; index < onTime; index += 1) {
    reviews.push(
      buildCancellationReview(
        { within24Hours: false, cancelledAt: '', bookingId: `cancel-${index}` },
        late + index
      )
    );
  }

  return reviews;
}

export function mergeStaffReviews(apiReviews = [], cancellationStats = {}) {
  const clientReviews = (Array.isArray(apiReviews) ? apiReviews : []).map((review) => ({
    ...review,
    criteria: extractReviewCriteria(review),
    source: review.source || 'client',
    rating: resolveReviewOverallRating(review, extractReviewCriteria(review)),
  }));

  const penaltyReviews = buildCancellationPenaltyReviews(cancellationStats);

  return [...clientReviews, ...penaltyReviews].sort((a, b) => {
    const aTime = new Date(a.postedAt || a.reviewedAt || 0).getTime();
    const bTime = new Date(b.postedAt || b.reviewedAt || 0).getTime();
    return bTime - aTime;
  });
}

export function calculateStaffRatingScores(apiReviews = [], cancellationStats = {}) {
  const reviews = mergeStaffReviews(apiReviews, cancellationStats);

  const criteriaTotals = Object.fromEntries(
    STAFF_RATING_CRITERIA.map(({ key }) => [key, { sum: 0, count: 0 }])
  );

  const starCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let reviewScoreSum = 0;
  let reviewScoreCount = 0;

  reviews.forEach((review) => {
    const criteria = review.criteria || extractReviewCriteria(review);
    const criteriaValues = Object.values(criteria).filter((value) => value > 0);
    const overall = criteriaValues.length
      ? average(criteriaValues)
      : resolveReviewOverallRating(review, criteria);

    if (overall > 0) {
      reviewScoreSum += overall;
      reviewScoreCount += 1;
      const star = toStar(overall);
      if (star >= 1 && star <= 5) starCounts[star] += 1;
    }

    STAFF_RATING_CRITERIA.forEach(({ key }) => {
      const value = criteria[key];
      if (value > 0) {
        criteriaTotals[key].sum += value;
        criteriaTotals[key].count += 1;
      } else if (overall > 0) {
        criteriaTotals[key].sum += overall;
        criteriaTotals[key].count += 1;
      }
    });
  });

  const criteriaAverages = STAFF_RATING_CRITERIA.map(({ key, label }) => {
    const row = criteriaTotals[key];
    const averageScore = row.count ? row.sum / row.count : 0;
    return {
      key,
      label,
      average: averageScore,
      count: row.count,
    };
  });

  const overallAverage = reviewScoreCount ? reviewScoreSum / reviewScoreCount : 0;
  const penaltyCount = reviews.filter((review) => review.isCancellationPenalty).length;

  return {
    reviews,
    overallAverage,
    totalReviews: reviews.length,
    clientReviewCount: reviews.length - penaltyCount,
    penaltyReviewCount: penaltyCount,
    starCounts,
    criteriaAverages,
  };
}

export function buildStarCounts(reviews = []) {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach((review) => {
    const star = toStar(resolveReviewOverallRating(review, review.criteria));
    if (star >= 1 && star <= 5) counts[star] += 1;
  });
  return counts;
}
