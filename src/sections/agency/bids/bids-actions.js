import { addDays, addHours, differenceInMinutes, format, isValid, parseISO } from 'date-fns';

function csvCell(value) {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadTextFile(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

const STORAGE_KEY = 'agency-bids';

export function loadAgencyBids(defaultBids) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultBids;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : defaultBids;
  } catch {
    return defaultBids;
  }
}

export function saveAgencyBids(bids) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bids));
}

export function computeHourlyRate(bidAmount, hours) {
  if (!hours) return 0;
  return Math.round((bidAmount / hours) * 100) / 100;
}

export function createBidId() {
  return `bid-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createDefaultBidDeadline(fromDate = new Date()) {
  return addHours(fromDate, 24).toISOString();
}

export function getBidDeadlineDate(bid) {
  if (!bid?.deadlineAt) return null;
  const parsed = parseISO(bid.deadlineAt);
  return isValid(parsed) ? parsed : null;
}

export function isBidDeadlineAlive(bid, now = new Date()) {
  if (bid?.status !== 'pending') return false;
  const deadline = getBidDeadlineDate(bid);
  if (!deadline) return false;
  return deadline.getTime() > now.getTime();
}

export function canReofferBid(bid, now = new Date()) {
  if (!bid) return false;
  const status = String(bid.status || '')
    .toLowerCase()
    .trim();
  if (
    [
      'declined',
      'decline',
      'rejected',
      'reject',
      'accepted',
      'accept',
      'awarded',
      'hired',
      'withdrawn',
      'withdraw',
      'deleted',
      'cancelled',
      'canceled',
    ].includes(status)
  ) {
    return false;
  }
  if (status && status !== 'pending') return false;
  if (!bid.deadlineAt) return true;
  return isBidDeadlineAlive(bid, now);
}

export function formatBidDeadlineLabel(bid, now = new Date()) {
  const deadline = getBidDeadlineDate(bid);
  if (!deadline) return '';

  if (deadline.getTime() <= now.getTime()) {
    return 'Deadline passed';
  }

  const mins = differenceInMinutes(deadline, now);
  if (mins < 60) return `${mins}m left`;
  if (mins < 60 * 24) {
    const hours = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem ? `${hours}h ${rem}m left` : `${hours}h left`;
  }

  return `Until ${format(deadline, 'EEE d MMM · HH:mm')}`;
}

export function withBidDeadlines(bids = []) {
  return bids.map((bid, index) => {
    if (bid.deadlineAt) return bid;

    if (bid.status === 'pending') {
      const alive = index !== 1;
      return {
        ...bid,
        deadlineAt: alive
          ? addHours(new Date(), 18 - index * 3).toISOString()
          : addHours(new Date(), -2).toISOString(),
        originalBidAmount: bid.originalBidAmount ?? bid.bidAmount,
      };
    }

    return {
      ...bid,
      deadlineAt: bid.deadlineAt || addDays(new Date(bid.submittedDate || Date.now()), 1).toISOString(),
      originalBidAmount: bid.originalBidAmount ?? bid.bidAmount,
    };
  });
}

export function appendAgencyBid(job, { bidPrice, notes }) {
  const bidAmount = parseInt(bidPrice, 10);
  const hours = 8;
  const schedule = job.schedule || job.schedules?.[0] || '';
  const careHome =
    typeof job.postedBy === 'object' && job.postedBy?.name ? job.postedBy.name : 'Care home';

  const bid = {
    id: createBidId(),
    status: 'pending',
    jobRef: `CH-J-${String(job.id).toUpperCase()}`,
    jobTitle: job.title,
    careHome,
    image: typeof job.image === 'string' ? job.image : '',
    schedule,
    address: job.address || '',
    bidAmount,
    originalBidAmount: bidAmount,
    hourlyRate: computeHourlyRate(bidAmount, hours),
    hours,
    notes: notes?.trim() || '',
    submittedAt: 'Just now',
    submittedDate: new Date().toISOString().slice(0, 10),
    deadlineAt: createDefaultBidDeadline(),
  };

  const existing = loadAgencyBids([]);
  saveAgencyBids([bid, ...existing]);
  return bid;
}

export function exportBidsReport({ bids, filename = 'bids-report.csv' }) {
  const headers = [
    'Job ref',
    'Role',
    'Date & Time',
    'Location',
    'Care home',
    'Bid amount',
    'Status',
    'Submitted',
  ];
  const rows = bids.map((bid) => [
    bid.jobRef,
    bid.jobTitle,
    bid.schedule,
    bid.address || '',
    bid.careHome,
    bid.bidAmount,
    bid.status,
    bid.submittedAt,
  ]);

  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
  downloadTextFile(csv, filename);
}

export function printBidsReport() {
  window.print();
}
