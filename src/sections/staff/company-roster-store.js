const STORAGE_PREFIX = 'tempy-company-roster:';

function storageKey(accountKey = 'care_home') {
  return `${STORAGE_PREFIX}${String(accountKey || 'care_home').trim() || 'care_home'}`;
}

function readRaw(accountKey) {
  try {
    const raw = localStorage.getItem(storageKey(accountKey));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRaw(accountKey, rows) {
  localStorage.setItem(storageKey(accountKey), JSON.stringify(rows));
}

/** Persist imported / company-owned staff with role + team (client: each company has different roles). */
export function saveCompanyRosterStaff(accountKey, rows = [], { merge = true } = {}) {
  const incoming = (Array.isArray(rows) ? rows : [])
    .map((row, index) => normalizeRosterRow(row, index))
    .filter(Boolean);

  if (!incoming.length) return readRaw(accountKey);

  const existing = merge ? readRaw(accountKey) : [];
  const byEmail = new Map();

  [...existing, ...incoming].forEach((row) => {
    const key = String(row.email || row.id || '').toLowerCase();
    if (!key) return;
    byEmail.set(key, row);
  });

  const next = Array.from(byEmail.values());
  writeRaw(accountKey, next);
  return next;
}

export function getCompanyRosterStaff(accountKey) {
  return readRaw(accountKey);
}

export function clearCompanyRosterStaff(accountKey) {
  localStorage.removeItem(storageKey(accountKey));
}

function normalizeRosterRow(row = {}, index = 0) {
  const name = String(row.name || '').trim();
  const email = String(row.email || '').trim().toLowerCase();
  const role = String(row.role || row.specialty || '').trim();
  const team = String(row.team || row.role || 'General').trim() || 'General';
  if (!name && !email) return null;

  return {
    id: String(row.id || email || `import-${Date.now()}-${index}`),
    name: name || email || `Staff ${index + 1}`,
    email,
    phone: String(row.phone || row.phoneNumber || '').trim(),
    role: role || team,
    team,
    specialty: String(row.specialty || role || '').trim(),
    status: String(row.status || 'active').trim() || 'active',
    importedAt: row.importedAt || new Date().toISOString(),
  };
}

const TEAM_COLORS = ['#e53935', '#212121', '#455a64', '#039be5', '#00897b', '#6d4c41', '#5e35b1'];

/**
 * Build shifts rota teams from company roster (not a global role list).
 * Groups staff by team (fallback: role).
 */
export function mapCompanyRosterToShiftTeams(accountKey) {
  const staff = getCompanyRosterStaff(accountKey);
  if (!staff.length) return [];

  const byTeam = new Map();

  staff.forEach((member) => {
    const teamLabel = String(member.team || member.role || 'General').trim() || 'General';
    if (!byTeam.has(teamLabel)) byTeam.set(teamLabel, []);
    byTeam.get(teamLabel).push(member);
  });

  return Array.from(byTeam.entries()).map(([label, members], teamIndex) => {
    const teamId = `company-${slugify(label)}-${teamIndex}`;
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
        name: member.name,
        email: member.email,
        role: member.role || label,
        roleCode: badgeFromLabel(member.role || label),
        phone: member.phone,
        specialty: member.specialty,
        fromCompanyRoster: true,
        isVacant: false,
        isPast: false,
      })),
      fromCompanyRoster: true,
    };
  });
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'team';
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
