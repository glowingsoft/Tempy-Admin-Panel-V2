/**
 * Individual (Home Care) rota config — storage keys + logged-in user only (no demo names).
 */

import { buildSelfOnlyTeams, getUserDisplayName, getUserEmail } from 'src/components/shifts/self-only-rota';

const SELF_STAFF_ID = 101;

export const INDIVIDUAL_HOME_CARE_ROTA_CONFIG = {
  key: 'individual-home-care',
  jobTypeLabels: [],
  jobTypesStorageKey: 'individual-home-care-job-types',
  jobsStorageKey: 'individual-home-care-jobs',
};

/** Rota for the currently logged-in individual (customer) — only their shifts. */
export function buildIndividualHomeCareRotaConfig(user) {
  const name = getUserDisplayName(user);
  const email = getUserEmail(user);
  const careType = String(user?.basicInfo?.careType || '').trim();

  const teams = buildSelfOnlyTeams(
    { basicInfo: { name, email } },
    {
      id: SELF_STAFF_ID,
      role: 'Client',
      label: careType || 'Client',
      badge: 'ME',
    }
  );

  return {
    key: `individual-home-care-${email || 'default'}`,
    teams,
    locations: [{ id: 'my-home', label: `${name} — Home` }],
    defaultLocationId: 'my-home',
    jobTypeLabels: careType ? [careType] : [],
    jobTypesStorageKey: INDIVIDUAL_HOME_CARE_ROTA_CONFIG.jobTypesStorageKey,
    jobsStorageKey: INDIVIDUAL_HOME_CARE_ROTA_CONFIG.jobsStorageKey,
  };
}
