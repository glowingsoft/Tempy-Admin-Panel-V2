import { paths } from 'src/routes/paths';

export function getBranchesNav(pathname = '') {
  const p = String(pathname || '');

  if (p.includes('/agency/')) {
    return {
      list: paths.dashboard.agency.branches,
      details: (id) => `${paths.dashboard.agency.branches}/${id}`,
      dashboard: paths.dashboard.agency.root,
      shifts: paths.dashboard.agency.shifts,
      jobs: paths.dashboard.jobs.find,
      postJob: '',
      noun: 'Branch',
      nounPlural: 'Branches',
    };
  }

  if (p.includes('/hospital/')) {
    return {
      list: paths.dashboard.hospital.branches,
      details: (id) => `${paths.dashboard.hospital.branches}/${id}`,
      dashboard: paths.dashboard.hospital.root,
      shifts: paths.dashboard.hospital.shifts,
      jobs: paths.dashboard.hospital.jobs.created,
      postJob: paths.dashboard.hospital.jobs.post,
      noun: 'Branch',
      nounPlural: 'Branches',
    };
  }

  if (p.includes('/local-authority/')) {
    return {
      list: paths.dashboard.localAuthority.branches,
      details: (id) => `${paths.dashboard.localAuthority.branches}/${id}`,
      dashboard: paths.dashboard.localAuthority.root,
      shifts: paths.dashboard.localAuthority.shifts,
      jobs: paths.dashboard.localAuthority.jobs.created,
      postJob: paths.dashboard.localAuthority.jobs.post,
      noun: 'Branch',
      nounPlural: 'Branches',
    };
  }

  if (p.includes('/individual-home-care/')) {
    return {
      list: paths.dashboard.individualHomeCare.locations,
      details: (id) => `${paths.dashboard.individualHomeCare.locations}/${id}`,
      dashboard: paths.dashboard.individualHomeCare.root,
      shifts: paths.dashboard.individualHomeCare.shifts,
      jobs: paths.dashboard.individualHomeCare.jobs.created,
      postJob: paths.dashboard.individualHomeCare.jobs.post,
      noun: 'Location',
      nounPlural: 'Locations',
    };
  }

  if (p.includes('/home-care-company/')) {
    return {
      list: paths.dashboard.homeCareCompany.branches,
      details: (id) => `${paths.dashboard.homeCareCompany.branches}/${id}`,
      dashboard: paths.dashboard.homeCareCompany.root,
      shifts: paths.dashboard.homeCareCompany.shifts,
      jobs: paths.dashboard.homeCareCompany.jobs,
      postJob: '',
      noun: 'Branch',
      nounPlural: 'Branches',
    };
  }

  return {
    list: paths.dashboard.branches,
    details: (id) => `${paths.dashboard.branches}/${id}`,
    dashboard: paths.dashboard.root,
    shifts: paths.dashboard.shifts,
    jobs: paths.dashboard.jobs.created,
    postJob: paths.dashboard.jobs.post,
    noun: 'Branch',
    nounPlural: 'Branches',
  };
}
