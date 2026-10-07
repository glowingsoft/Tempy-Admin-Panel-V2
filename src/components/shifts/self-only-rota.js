/**
 * Build a single-person rota for individual / staff-member dashboards.
 */

export function getUserDisplayName(user) {
  return (
    user?.basicInfo?.name ||
    user?.displayName ||
    user?.name ||
    [user?.basicInfo?.firstName, user?.basicInfo?.lastName].filter(Boolean).join(' ') ||
    'My account'
  );
}

export function getUserEmail(user) {
  return String(user?.basicInfo?.email || user?.email || '')
    .trim()
    .toLowerCase();
}

export function getUserIdentityIds(user) {
  return [
    user?._id,
    user?.id,
    user?.userId,
    user?.nurseId,
    user?.staffId,
    user?.workerId,
    user?.basicInfo?._id,
    user?.basicInfo?.id,
    user?.accountState?.userId,
    user?.accountState?._id,
    user?.user?._id,
    user?.user?.id,
  ]
    .filter((value) => value != null && value !== '')
    .map(String);
}

export function collectMemberIdentityIds(member) {
  if (!member) return [];
  const raw = member.raw && typeof member.raw === 'object' ? member.raw : {};
  const nested =
    (raw.worker && typeof raw.worker === 'object' && raw.worker) ||
    (raw.user && typeof raw.user === 'object' && raw.user) ||
    (member.worker && typeof member.worker === 'object' && member.worker) ||
    {};

  return [
    member.id,
    member._id,
    member.userId,
    member.staffId,
    member.workerId,
    member.nurseId,
    member.membershipId,
    raw._id,
    raw.id,
    raw.workerId,
    raw.staffId,
    raw.userId,
    nested._id,
    nested.id,
  ]
    .filter((value) => value != null && value !== '')
    .map(String);
}

/** True when a rota row is the logged-in staff member. */
export function staffMemberMatchesUser(member, user) {
  if (!member || member.isVacant || !user) return false;

  const email = getUserEmail(user);
  const memberEmail = String(member.email || member.basicInfo?.email || member.raw?.email || '')
    .trim()
    .toLowerCase();
  if (email && memberEmail && email === memberEmail) return true;

  const userIds = new Set(getUserIdentityIds(user));
  if (collectMemberIdentityIds(member).some((id) => userIds.has(id))) return true;

  const userName = getUserDisplayName(user).trim().toLowerCase();
  const memberName = String(member.name || '').trim().toLowerCase();
  return Boolean(userName && memberName && userName === memberName);
}

/**
 * Re-key calendar/availability cells onto the rows actually shown.
 * Person-level busy/leave is copied onto every matching role row.
 */
export function remapShiftsOntoStaffRows(shifts = {}, staffList = [], { user, attachUnmatched = false } = {}) {
  if (!staffList.length || !shifts || typeof shifts !== 'object') return shifts;

  const aliasToIds = new Map();
  const addAlias = (alias, visibleId) => {
    const key = String(alias || '').trim();
    if (!key) return;
    const current = aliasToIds.get(key) || [];
    if (!current.includes(visibleId)) current.push(visibleId);
    aliasToIds.set(key, current);
  };

  staffList.forEach((member) => {
    const visibleId = String(member.id);
    collectMemberIdentityIds(member).forEach((id) => addAlias(id, visibleId));
    if (user) getUserIdentityIds(user).forEach((id) => addAlias(id, visibleId));
  });

  const visibleIdSet = new Set(staffList.map((member) => String(member.id)));
  const fallbackIds = attachUnmatched ? staffList.map((member) => String(member.id)) : [];

  const next = {};
  const put = (shift, staffId) => {
    const date = shift?.date;
    if (!shift || !date || !staffId) return;
    const key = `${staffId}-${date}`;
    const mapped = { ...shift, staffId };
    const existing = next[key];
    if (!existing) {
      next[key] = mapped;
      return;
    }
    const list = Array.isArray(existing) ? existing : [existing];
    if (mapped.busy || mapped.dayOff || mapped.leave || mapped.onCall || mapped.sleepover || mapped.blocksAutoAccept) {
      next[key] = mapped;
      return;
    }
    const withoutDup = list.filter((item) => item.id !== mapped.id && item.apiId !== mapped.apiId);
    const merged = [...withoutDup, mapped];
    next[key] = merged.length === 1 ? merged[0] : merged;
  };

  Object.values(shifts).forEach((entry) => {
    (Array.isArray(entry) ? entry : [entry]).forEach((shift) => {
      if (!shift) return;
      const currentId = String(shift.staffId || '');
      if (visibleIdSet.has(currentId)) {
        put(shift, currentId);
        return;
      }

      const targets = aliasToIds.get(currentId) || [];
      const isBlock =
        shift.busy ||
        shift.dayOff ||
        shift.leave ||
        shift.onCall ||
        shift.sleepover ||
        shift.blocksAutoAccept;

      if (isBlock && (targets.length || fallbackIds.length)) {
        (targets.length ? targets : fallbackIds).forEach((id) => put(shift, id));
        return;
      }
      if (targets.length) {
        put(shift, targets[0]);
        return;
      }
      if (fallbackIds.length) {
        put(shift, fallbackIds[0]);
        return;
      }
      put(shift, currentId);
    });
  });

  return next;
}

/**
 * Staff dashboard: only show role teams the logged-in person belongs to.
 * One job → one role row. Multiple jobs → multiple role rows.
 */
export function filterTeamsForStaffMemberDashboard(teams = [], user) {
  if (!Array.isArray(teams) || !teams.length) return [];

  return teams
    .map((team) => {
      const mine = (team.staff || []).filter((member) => staffMemberMatchesUser(member, user));
      if (!mine.length) return null;
      return {
        ...team,
        staff: mine,
        totals: {
          ...(team.totals || {}),
          totalPeople: mine.length,
        },
      };
    })
    .filter(Boolean);
}

function buildSelfStaffForTeam(team, user) {
  const selfId = getUserIdentityIds(user)[0] || 'self';
  return {
    id: `${team.id || 'role'}__${selfId}`,
    name: getUserDisplayName(user),
    email: getUserEmail(user),
    role: team.label || 'Staff',
    staffId: selfId,
    workerId: selfId,
  };
}

/**
 * Nurse calendar is already scoped to this user. Keep every API role —
 * including roles with 0 shifts this fortnight — and put the nurse on empty rows.
 */
export function hydrateStaffMemberCalendarTeams(teams = [], user) {
  if (!Array.isArray(teams) || !teams.length) return [];

  return teams.map((team) => {
    const realStaff = (team.staff || []).filter((member) => !member.isVacant);
    const mine = realStaff.filter((member) => staffMemberMatchesUser(member, user));
    const staff = mine.length ? mine : realStaff.length ? realStaff : [buildSelfStaffForTeam(team, user)];

    return {
      ...team,
      staff,
      totals: {
        ...(team.totals || {}),
        totalPeople: staff.length,
      },
    };
  });
}

export function buildSelfOnlyTeams(user, { id = 9001, role = 'Staff', label = 'My shifts', badge = 'ME' } = {}) {
  const member = {
    id,
    name: getUserDisplayName(user),
    role,
    email: getUserEmail(user),
  };

  return [
    {
      id: 'my-shifts',
      color: '#1565c0',
      badge,
      badgeColor: '#1565c0',
      label,
      staff: [member],
    },
  ];
}

export function deriveStaffMapsFromTeams(teams = []) {
  const allStaff = teams.flatMap((team) => (team.staff || []).filter((s) => !s.isVacant));
  const staffTeamMap = teams.reduce((acc, team) => {
    (team.staff || []).forEach((member) => {
      acc[member.id] = team;
    });
    return acc;
  }, {});
  return { allStaff, staffTeamMap };
}
