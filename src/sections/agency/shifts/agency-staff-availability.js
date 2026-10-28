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
