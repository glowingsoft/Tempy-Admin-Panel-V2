/**
 * Individual (Home Care) rota — one logged-in client, only their own shifts row.
 * Demo user mirrors admin mock: Sarah Mitchell · Elderly Care · individual@gmail.com
 */

import { ADMIN_INDIVIDUAL_HOME_CARE_LIST } from 'src/_mock/_admin-list-config';
import { buildSelfOnlyTeams, getUserDisplayName, getUserEmail } from 'src/components/shifts/self-only-rota';

export const INDIVIDUAL_HOME_CARE_USER = {
  id: 'ihc-001',
  name: 'Sarah Mitchell',
  email: 'individual@gmail.com',
  careType: 'Elderly Care',
  location: 'Bristol, UK',
};

const SELF_STAFF_ID = 101;

function resolveCareProfile(user) {
  const email = getUserEmail(user);
  const fromAdmin = ADMIN_INDIVIDUAL_HOME_CARE_LIST.find(
    (item) => item.email?.toLowerCase() === email
  );

  const name = getUserDisplayName(user) || fromAdmin?.name || INDIVIDUAL_HOME_CARE_USER.name;
  const careType =
    user?.basicInfo?.careType ||
    fromAdmin?.careType ||
    INDIVIDUAL_HOME_CARE_USER.careType;
  const location =
    user?.basicInfo?.location ||
    fromAdmin?.location ||
    INDIVIDUAL_HOME_CARE_USER.location;

  return { name, email: email || INDIVIDUAL_HOME_CARE_USER.email, careType, location };
}

/** @deprecated Prefer buildIndividualHomeCareRotaConfig(user) for the logged-in client. */
export const INDIVIDUAL_HOME_CARE_LOCATIONS = [
  { id: 'my-home', label: `${INDIVIDUAL_HOME_CARE_USER.name} — Home` },
];

/** @deprecated Prefer buildIndividualHomeCareRotaConfig(user). */
export const INDIVIDUAL_HOME_CARE_TEAMS = buildSelfOnlyTeams(
  { basicInfo: { name: INDIVIDUAL_HOME_CARE_USER.name, email: INDIVIDUAL_HOME_CARE_USER.email } },
  {
    id: SELF_STAFF_ID,
    role: 'Client',
    label: INDIVIDUAL_HOME_CARE_USER.careType,
    badge: 'EC',
  }
);

export const INDIVIDUAL_HOME_CARE_ROTA_CONFIG = {
  key: 'individual-home-care',
  teams: INDIVIDUAL_HOME_CARE_TEAMS,
  locations: INDIVIDUAL_HOME_CARE_LOCATIONS,
  defaultLocationId: 'my-home',
  jobTypeLabels: [INDIVIDUAL_HOME_CARE_USER.careType],
  jobTypesStorageKey: 'individual-home-care-job-types',
  jobsStorageKey: 'individual-home-care-jobs',
};

/** Rota for the currently logged-in individual (customer) — only their shifts. */
export function buildIndividualHomeCareRotaConfig(user) {
  const profile = resolveCareProfile(user);
  const teams = buildSelfOnlyTeams(
    { basicInfo: { name: profile.name, email: profile.email } },
    {
      id: SELF_STAFF_ID,
      role: 'Client',
      label: profile.careType,
      badge: 'ME',
    }
  );

  return {
    key: `individual-home-care-${profile.email || 'default'}`,
    teams,
    locations: [{ id: 'my-home', label: `${profile.name} — Home` }],
    defaultLocationId: 'my-home',
    jobTypeLabels: [profile.careType],
    jobTypesStorageKey: 'individual-home-care-job-types',
    jobsStorageKey: 'individual-home-care-jobs',
  };
}
