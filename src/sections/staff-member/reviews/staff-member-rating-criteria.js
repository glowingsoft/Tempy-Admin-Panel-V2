import { REVIEW_CRITERIA } from 'src/sections/reviews/review-criteria-utils';

export const STAFF_RATING_CRITERIA = REVIEW_CRITERIA;

/** Late cancellation (<24h) — non-5* review with attendance/time penalties. */
export const LATE_CANCELLATION_CRITERIA_SCORES = {
  professionalism: 3,
  communication: 3,
  compassion: 3,
  effectiveness: 3,
  attendance: 1,
  attitude: 3,
  attentionToDetail: 3,
  attendingOnTime: 1,
};

/** Any cancellation — still non-5* overall. */
export const STANDARD_CANCELLATION_CRITERIA_SCORES = {
  professionalism: 4,
  communication: 4,
  compassion: 4,
  effectiveness: 4,
  attendance: 3,
  attitude: 4,
  attentionToDetail: 4,
  attendingOnTime: 4,
};
