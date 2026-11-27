import { addDays, addWeeks, format, getDay, isValid, parse, startOfDay } from 'date-fns';

/** Client examples: can't work Tuesdays, Wednesday mornings, or weekends. */
export const WEEKLY_UNAVAILABILITY_RULES = [
  {
    id: 'tuesdays',
    label: 'Tuesdays',
    helper: 'All day (00:00 – 00:00)',
    status: 'dayOff',
    startTime: '00:00',
    endTime: '00:00',
    matchesDay: (jsDay) => jsDay === 2,
  },
  {
    id: 'wednesday-mornings',
    label: 'Wednesday mornings',
    helper: '00:00 – 12:00',
    status: 'busy',
    startTime: '00:00',
    endTime: '12:00',
    matchesDay: (jsDay) => jsDay === 3,
  },
  {
    id: 'weekends',
    label: 'Weekends',
    helper: 'Saturday & Sunday, all day (00:00 – 00:00)',
    status: 'dayOff',
    startTime: '00:00',
    endTime: '00:00',
    matchesDay: (jsDay) => jsDay === 0 || jsDay === 6,
  },
];

export const DEFAULT_WEEKLY_UNAVAILABILITY_WEEKS = 12;

function parseStartDate(value) {
  if (value instanceof Date && isValid(value)) return startOfDay(value);
  const raw = String(value || '').trim();
  if (!raw) return startOfDay(new Date());
  const parsed = parse(raw, 'yyyy-MM-dd', new Date());
  return isValid(parsed) ? startOfDay(parsed) : startOfDay(new Date());
}

/**
 * Expand selected weekly rules into concrete availability slots for the API.
 * @returns {Array<{ date: string, status: string, startTime: string, endTime: string, ruleId: string }>}
 */
export function expandWeeklyUnavailabilitySlots({
  ruleIds = [],
  startDate,
  weeks = DEFAULT_WEEKLY_UNAVAILABILITY_WEEKS,
} = {}) {
  const selected = new Set((Array.isArray(ruleIds) ? ruleIds : []).map(String));
  const rules = WEEKLY_UNAVAILABILITY_RULES.filter((rule) => selected.has(rule.id));
  if (!rules.length) return [];

  const start = parseStartDate(startDate);
  const weekCount = Math.min(52, Math.max(1, Number(weeks) || DEFAULT_WEEKLY_UNAVAILABILITY_WEEKS));
  const end = addDays(addWeeks(start, weekCount), -1);
  const slots = [];

  for (let cursor = start; cursor.getTime() <= end.getTime(); cursor = addDays(cursor, 1)) {
    const jsDay = getDay(cursor);
    const date = format(cursor, 'yyyy-MM-dd');
    rules.forEach((rule) => {
      if (!rule.matchesDay(jsDay)) return;
      slots.push({
        date,
        status: rule.status,
        startTime: rule.startTime,
        endTime: rule.endTime,
        ruleId: rule.id,
        note: `Weekly unavailability: ${rule.label}`,
      });
    });
  }

  return slots;
}
