import { format, isValid, parse } from 'date-fns';

// ----------------------------------------------------------------------

const STORAGE_KEY = 'agency-staff-availability-blocks';

export function loadAvailabilityBlocks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveAvailabilityBlocks(blocks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(blocks));
}

export function upsertAvailabilityBlock({ staffId, date, type = 'busy', note = '' }) {
  const key = `${staffId}-${date}`;
  const blocks = loadAvailabilityBlocks();
  blocks[key] = {
    id: key,
    staffId,
    date,
    type,
    note,
    blocksAutoAccept: true,
    updatedAt: new Date().toISOString(),
  };
  saveAvailabilityBlocks(blocks);
  return blocks[key];
}

export function removeAvailabilityBlock(staffId, date) {
  const key = `${staffId}-${date}`;
  const blocks = loadAvailabilityBlocks();
  delete blocks[key];
  saveAvailabilityBlocks(blocks);
}

export function getAvailabilityBlock(staffId, date) {
  const blocks = loadAvailabilityBlocks();
  return blocks[`${staffId}-${date}`] || null;
}

export function isStaffBusyOnDate(staffId, date) {
  const block = getAvailabilityBlock(staffId, date);
  if (!block) return false;
  return ['busy', 'dayOff', 'leave'].includes(block.type);
}

export function availabilityBlocksToShiftEntries(blocks = loadAvailabilityBlocks()) {
  const shifts = {};

  Object.values(blocks).forEach((block) => {
    if (!block?.staffId || !block?.date) return;

    const parsed = parse(block.date, 'yyyy-MM-dd', new Date());
    if (!isValid(parsed)) return;

    const key = `${block.staffId}-${block.date}`;
    shifts[key] = {
      id: key,
      staffId: block.staffId,
      date: block.date,
      startTime: '00:00',
      endTime: '23:59',
      busy: block.type === 'busy',
      dayOff: block.type === 'dayOff',
      leave: block.type === 'leave',
      blocksAutoAccept: true,
      note: block.note || '',
    };
  });

  return shifts;
}

export function formatBusyDayLabel(date) {
  const parsed = parse(date, 'yyyy-MM-dd', new Date());
  if (!isValid(parsed)) return date;
  return format(parsed, 'EEEE d MMM');
}
