/**
 * Helpers for employer Shifts rota teams.
 * Roster rows come from the dashboard staff API — not localStorage.
 */

const TEAM_COLORS = ['#e53935', '#212121', '#455a64', '#039be5', '#00897b', '#6d4c41', '#5e35b1'];

function slugify(value) {
  return (
    String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'team'
  );
}

function badgeFromLabel(label) {
  const words = String(label || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return 'TM';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] || ''}${words[1][0] || ''}`.toUpperCase();
}

function humanizeLabel(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  return text
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function teamLabelForStaff(member = {}) {
  const specialty = Array.isArray(member.specialities)
    ? member.specialities[0]
    : member.specialty;
  return (
    humanizeLabel(specialty) ||
    String(member.role || '').trim() ||
    humanizeLabel(member.userType) ||
    'General'
  );
}

/**
 * Build shifts rota teams from GET dashboard staff list when the booking
 * calendar returns no role/worker groups yet.
 */
export function mapDashboardStaffToShiftTeams(staffList = []) {
  const staff = (Array.isArray(staffList) ? staffList : []).filter(
    (member) => member?.id && !member?.isVacant
  );
  if (!staff.length) return [];

  const byTeam = new Map();

  staff.forEach((member) => {
    const teamLabel = teamLabelForStaff(member);
    if (!byTeam.has(teamLabel)) byTeam.set(teamLabel, []);
    byTeam.get(teamLabel).push(member);
  });

  return Array.from(byTeam.entries()).map(([label, members], teamIndex) => {
    const teamId = `staff-api-${slugify(label)}-${teamIndex}`;
    const color = TEAM_COLORS[teamIndex % TEAM_COLORS.length];

    return {
      id: teamId,
      color,
      badge: badgeFromLabel(label),
      badgeColor: color,
      label,
      totals: {
        totalShifts: 0,
        totalHours: 0,
        totalPeople: members.length,
      },
      staff: members.map((member, index) => ({
        id: member.id || `${teamId}-staff-${index}`,
        name: member.name || 'Staff',
        email: member.email || '',
        role: member.role || label,
        roleCode: badgeFromLabel(member.role || label),
        phone: member.phone || '',
        specialty: member.specialty || label,
        avatarUrl: member.avatarUrl || '',
        fromStaffApi: true,
        isVacant: false,
        isPast: false,
      })),
      fromStaffApi: true,
    };
  });
}

export function resolveRosterAccountKey(apiRole = 'careHome') {
  switch (apiRole) {
    case 'hospital':
      return 'hospital_nhs';
    case 'localAuthority':
      return 'local_authority';
    case 'agency':
      return 'agency';
    case 'homeCareCompany':
      return 'home_care_company';
    case 'user':
      return 'user';
    default:
      return 'care_home';
  }
}
