import { format } from 'date-fns';

export const ROSTER_SCOPE = {
  CURRENT: 'current',
  ALL: 'all',
};

/** Active people on the rota — excludes vacant slots and staff who have left. */
export function isCurrentRosterMember(member) {
  return Boolean(member) && !member.isVacant && !member.isPast;
}

export function memberHasRosterActivity(member, shifts = {}, days = []) {
  if (!member?.id || !days.length) return false;
  return days.some((day) => {
    const key = `${member.id}-${format(day, 'yyyy-MM-dd')}`;
    const entry = shifts[key];
    if (!entry) return false;
    if (Array.isArray(entry)) return entry.length > 0;
    return true;
  });
}

/**
 * Current = not vacant, not past, and has something on the visible rota dates.
 * All = everyone (past + vacant included).
 */
export function filterStaffByRosterScope(staff = [], rosterScope = ROSTER_SCOPE.CURRENT, ctx = {}) {
  if (rosterScope === ROSTER_SCOPE.ALL) return staff;

  const { shifts, days } = ctx;
  const usePeriodFilter = Boolean(shifts && days?.length);

  return staff.filter((member) => {
    if (!isCurrentRosterMember(member)) return false;
    if (!usePeriodFilter || ctx.keepIdleMembers) return true;
    return memberHasRosterActivity(member, shifts, days);
  });
}

/**
 * Shrink teams to the current roster. Empty teams drop out in Current view
 * so the table stays compact; All keeps every team/slot. Teams flagged `keepWhenEmpty`
 * (a job type the calendar API returned with no workers) always stay.
 */
export function mapTeamsByRosterScope(teams = [], rosterScope = ROSTER_SCOPE.CURRENT, ctx = {}) {
  return teams
    .map((team) => {
      // Job type rows sent with no workers stay as an empty row instead of dropping out.
      const visibleStaff = team.keepWhenEmpty ? team.staff || [] : filterStaffByRosterScope(team.staff, rosterScope, ctx);
      return {
        ...team,
        staff: visibleStaff,
        hiddenRosterCount: (team.staff?.length || 0) - visibleStaff.length,
      };
    })
    .filter((team) => rosterScope === ROSTER_SCOPE.ALL || team.staff.length > 0);
}

export function countRosterMembers(teams = []) {
  return teams.reduce((acc, team) => acc + (team.staff || []).filter((member) => !member?.isPlaceholder).length, 0);
}

export function countHiddenRosterMembers(teams = [], rosterScope = ROSTER_SCOPE.CURRENT, ctx = {}) {
  const total = countRosterMembers(teams);
  const visible = countRosterMembers(mapTeamsByRosterScope(teams, rosterScope, ctx));
  return Math.max(0, total - visible);
}
