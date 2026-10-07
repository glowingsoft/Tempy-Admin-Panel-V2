export const REVIEW_CRITERIA = [
  { key: 'professionalism', label: 'Professionalism' },
  { key: 'communication', label: 'Communication' },
  { key: 'compassion', label: 'Compassion' },
  { key: 'effectiveness', label: 'Effectiveness' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'attitude', label: 'Attitude' },
  { key: 'attentionToDetail', label: 'Attention to detail' },
  { key: 'attendingOnTime', label: 'Attending on time' },
];

const CRITERIA_ALIASES = {
  professionalism: ['professionalism', 'professional'],
  communication: ['communication'],
  compassion: ['compassion', 'empathy'],
  effectiveness: ['effectiveness', 'effective'],
  attendance: ['attendance', 'reliability'],
  attitude: ['attitude'],
  attentionToDetail: ['attentionToDetail', 'attention_to_detail', 'attentionToDetails', 'detail'],
  attendingOnTime: ['attendingOnTime', 'attending_on_time', 'punctuality', 'onTime', 'on_time'],
};

function clampScore(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.min(5, Math.max(0, num));
}

function pickCriteriaBlock(review = {}) {
  const raw = review.raw && typeof review.raw === 'object' ? review.raw : review;
  const candidates = [
    review.criteria,
    review.scores,
    review.ratings,
    review.ratingBreakdown,
    raw.criteria,
    raw.scores,
    raw.ratings,
    raw.ratingBreakdown,
    raw.ratingCriteria,
  ];

  return candidates.find((item) => item && typeof item === 'object' && !Array.isArray(item)) || null;
}

export function extractReviewCriteria(review = {}) {
  const block = pickCriteriaBlock(review);
  const next = {};

  REVIEW_CRITERIA.forEach(({ key }) => {
    const aliases = CRITERIA_ALIASES[key] || [key];
    for (const alias of aliases) {
      const value = clampScore(block?.[alias]);
      if (value > 0) {
        next[key] = value;
        break;
      }
    }
  });

  return next;
}

export function resolveReviewOverallRating(review = {}, criteria = extractReviewCriteria(review)) {
  const criteriaValues = Object.values(criteria).filter((value) => value > 0);
  if (criteriaValues.length) {
    return criteriaValues.reduce((sum, value) => sum + value, 0) / criteriaValues.length;
  }

  const fallback = clampScore(review.rating ?? review.overallRating ?? review.score);
  return fallback > 0 ? fallback : 0;
}
