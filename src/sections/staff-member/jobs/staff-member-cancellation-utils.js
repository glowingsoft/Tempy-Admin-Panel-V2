import { getLocalCancellationStats } from './staff-member-cancellation-store';

// ----------------------------------------------------------------------

function toCount(value) {
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 ? num : 0;
}

function pickCancellationBlock(source) {
  if (!source || typeof source !== 'object') return null;

  const candidates = [
    source.cancellations,
    source.cancellationStats,
    source.shiftCancellations,
    source.summary?.cancellations,
    source.stats?.cancellations,
    source.profile?.cancellations,
    source.basicInfo?.cancellations,
  ];

  return candidates.find((item) => item && typeof item === 'object') || null;
}

export function extractCancellationStats(...sources) {
  let total = 0;
  let late = 0;
  let foundApi = false;

  sources.forEach((source) => {
    const block = pickCancellationBlock(source);
    if (!block) return;

    const nextTotal = toCount(
      block.total ?? block.count ?? block.totalCount ?? block.allTime ?? block.overall
    );
    const nextLate = toCount(
      block.late ??
        block.lateNotice ??
        block.within24Hours ??
        block.shortNotice ??
        block.lessThan24Hours
    );

    if (nextTotal > 0 || nextLate > 0) {
      total = Math.max(total, nextTotal);
      late = Math.max(late, nextLate);
      foundApi = true;
    }
  });

  if (!foundApi) {
    return {
      total: 0,
      late: 0,
      hasCancelledBefore: false,
      source: 'api',
    };
  }

  return {
    total: Math.max(total, late),
    late,
    hasCancelledBefore: Math.max(total, late) > 0,
    source: 'api',
  };
}

export function mergeCancellationStats(apiStats = {}, localStats = getLocalCancellationStats()) {
  const total = Math.max(toCount(apiStats.total), toCount(localStats.total));
  const late = Math.max(toCount(apiStats.late), toCount(localStats.late));

  return {
    total,
    late,
    hasCancelledBefore: total > 0,
    source: apiStats?.source === 'api' && toCount(apiStats.total) > 0 ? 'api' : 'local',
  };
}

export function formatCancellationHistoryMessage(stats = {}) {
  const total = toCount(stats.total);
  const late = toCount(stats.late);

  if (!total) {
    return 'You have not cancelled any shifts before.';
  }

  if (late > 0) {
    return `You have cancelled ${total} shift${total === 1 ? '' : 's'} before (${late} with less than 24 hours notice).`;
  }

  return `You have cancelled ${total} shift${total === 1 ? '' : 's'} before.`;
}

export const LATE_CANCELLATION_RATING_WARNING =
  'Cancelling with less than 24 hours notice will automatically add a low star rating to your profile.';
