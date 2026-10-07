import { paths } from 'src/routes/paths';

// ----------------------------------------------------------------------

export const LATE_CANCELLATION_STRIKE_LIMIT = 3;

export const STAFF_TERMS_OF_USE_HREF = paths.dashboard.staffMember.terms;

function toCount(value) {
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 ? num : 0;
}

function pickStrikeList(source) {
  if (!source || typeof source !== 'object') return null;

  const candidates = [source.strikes, source.basicInfo?.strikes, source.profile?.strikes, source.nurse?.strikes];

  return candidates.find(Array.isArray) || null;
}

function isClearedStrike(strike) {
  if (!strike || typeof strike !== 'object') return false;
  return strike.cleared === true || strike.isCleared === true || Boolean(strike.clearedAt) || String(strike.status || '').toLowerCase() === 'cleared';
}

/**
 * Active (not cleared) strikes on the supplier's profile.
 * Returns null when no source carries a strikes list, so callers can fall back.
 */
export function countActiveProfileStrikes(...sources) {
  const list = sources.map(pickStrikeList).find(Boolean);
  if (!list) return null;
  return list.filter((strike) => !isClearedStrike(strike)).length;
}

export function getStrikeRuleStatus(stats = {}) {
  const lateStrikes = stats.activeStrikes != null ? toCount(stats.activeStrikes) : toCount(stats.late);
  const remainingStrikes = Math.max(0, LATE_CANCELLATION_STRIKE_LIMIT - lateStrikes);

  return {
    lateStrikes,
    strikeLimit: LATE_CANCELLATION_STRIKE_LIMIT,
    remainingStrikes,
    isAccessBlocked: lateStrikes >= LATE_CANCELLATION_STRIKE_LIMIT,
    isFinalStrikeRisk: within24HoursWouldReachLimit(lateStrikes),
  };
}

function within24HoursWouldReachLimit(lateStrikes) {
  return lateStrikes === LATE_CANCELLATION_STRIKE_LIMIT - 1;
}

export function formatStrikeRuleMessage(strikeStatus = {}, { within24Hours = false } = {}) {
  const { lateStrikes, strikeLimit, remainingStrikes, isAccessBlocked } = strikeStatus;

  if (isAccessBlocked) {
    return `You have reached ${strikeLimit} late cancellation strikes. Your Tempy access may be suspended. Refer to the conditions of use for details.`;
  }

  if (within24Hours) {
    return `This will count as a strike (you have ${lateStrikes} of ${strikeLimit}). At ${strikeLimit} your account is suspended.`;
  }

  if (lateStrikes > 0) {
    return `You have ${lateStrikes} of ${strikeLimit} late cancellation strikes. ${remainingStrikes} remaining before Tempy access may be suspended.`;
  }

  return `Tempy operates a 3 strikes rule. Cancelling ${strikeLimit} shifts with less than 24 hours notice may suspend your access to the Tempy app. Refer to the conditions of use.`;
}
