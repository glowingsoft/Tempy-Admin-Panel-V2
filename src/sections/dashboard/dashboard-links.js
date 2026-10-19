import { paths } from 'src/routes/paths';


function normalizeTitle(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}


function typeKey(value) {
  return normalizeTitle(value).replace(/[\s/_-]/g, '');
}

export function withDashboardLinks(dashboard = {}, linkMap = {}) {
  const statsByTitle = linkMap.stats || {};
  const breakdownsByTitle = linkMap.breakdowns || {};
  const userTypePaths = linkMap.userTypes || {};

  return {
    ...dashboard,
    stats: (dashboard.stats || []).map((stat) => {
      const key = normalizeTitle(stat.title);
      return {
        ...stat,
        href: stat.href || statsByTitle[key],
      };
    }),
    extraStats: (dashboard.extraStats || []).map((stat) => {
      const key = normalizeTitle(stat.title);
      return {
        ...stat,
        href: stat.href || statsByTitle[key] || linkMap.extraStats?.[key],
      };
    }),
    breakdowns: (dashboard.breakdowns || []).map((item) => {
      const key = normalizeTitle(item.title);
      return {
        ...item,
        href: item.href || breakdownsByTitle[key],
      };
    }),
    usersByType: (dashboard.usersByType || []).map((item) => ({
      ...item,
      href:
        item.href ||
        userTypePaths[typeKey(item.userType)] ||
        userTypePaths[typeKey(item.label)],
    })),
  };
}


const careHome = paths.dashboard;
const agency = paths.dashboard.agency;
const hospital = paths.dashboard.hospital;
const localAuthority = paths.dashboard.localAuthority;
const individual = paths.dashboard.individualHomeCare;
const hcc = paths.dashboard.homeCareCompany;
const staffMember = paths.dashboard.staffMember;
const admin = paths.adminDashboard;

function createdJobsFilterHref(base, query) {
  if (!base) return '';
  return query ? `${base}?${query}` : base;
}

function buildCustomerLinkMap({ shifts, staff, jobsCreated, jobsBids, jobsPost, branches }) {
  const created = jobsCreated || jobsPost;
  return {
    stats: {
      'total jobs': created,
      'active jobs': createdJobsFilterHref(created, 'filter=active'),
      'total bookings': shifts,
      'active staff': staff,
      locations: branches,
      'pending jobs': createdJobsFilterHref(created, 'filter=pending'),
      'completed jobs': createdJobsFilterHref(created, 'filter=completed'),
      'pending bids': createdJobsFilterHref(created, 'filter=pending'),
    },
    breakdowns: {
      'jobs by status': jobsCreated || jobsPost,
      'bookings by status': shifts,
      'staff by status': staff,
      'bids by status': jobsBids,
      'locations by status': branches,
    },
  };
}

function buildSupplierLinkMap({ shifts, staff, jobs, bids }) {
  return {
    stats: {
      'new jobs': jobs,
      'active bookings': shifts,
      'total staff': staff,
      'active staff': staff,
      'total bookings': shifts,
      'active jobs': jobs,
      'pending bids': bids,
    },
    breakdowns: {
      'jobs by status': jobs,
      'bookings by status': shifts,
      'staff by status': staff,
      'bids by status': bids,
    },
  };
}

export const DASHBOARD_LINK_MAPS = {
  careHome: buildCustomerLinkMap({
    shifts: careHome.shifts,
    staff: careHome.staff.root,
    jobsCreated: careHome.jobs.created,
    jobsBids: careHome.jobs.bids,
    jobsPost: careHome.jobs.post,
    branches: careHome.branches,
  }),

  hospital: buildCustomerLinkMap({
    shifts: hospital.shifts,
    staff: hospital.staff,
    jobsCreated: hospital.jobs.created,
    jobsBids: hospital.jobs.bids,
    jobsPost: hospital.jobs.post,
    branches: hospital.branches,
  }),

  localAuthority: buildCustomerLinkMap({
    shifts: localAuthority.shifts,
    staff: localAuthority.staff,
    jobsCreated: localAuthority.jobs.created,
    jobsBids: localAuthority.jobs.bids,
    jobsPost: localAuthority.jobs.post,
    branches: localAuthority.branches,
  }),

  individualHomeCare: {
    stats: {
      'total jobs': individual.jobs.created,
      'active jobs': createdJobsFilterHref(individual.jobs.created, 'filter=active'),
      'total bookings': individual.shifts,
      'active staff': individual.staff,
      locations: individual.locations || individual.branches,
      'pending jobs': createdJobsFilterHref(individual.jobs.created, 'filter=pending'),
      'completed jobs': createdJobsFilterHref(individual.jobs.created, 'filter=completed'),
      'pending bids': createdJobsFilterHref(individual.jobs.created, 'filter=pending'),
    },
    breakdowns: {
      'jobs by status': individual.jobs.created,
      'bookings by status': individual.shifts,
      'staff by status': individual.staff,
      'bids by status': individual.jobs.bids,
      'locations by status': individual.locations || individual.branches,
    },
  },

  agency: buildSupplierLinkMap({
    shifts: agency.shifts,
    staff: agency.staff,
    jobs: paths.dashboard.jobs.find,
    bids: agency.bids,
  }),

  homeCareCompany: buildSupplierLinkMap({
    shifts: hcc.shifts,
    staff: hcc.staff,
    jobs: hcc.jobs,
    bids: hcc.bids,
  }),

  staffMember: {
    stats: {
      'new jobs': staffMember.jobs,
      'jobs to bid on': staffMember.jobs,
      'active bookings': staffMember.shifts,
      'confirmed shifts': staffMember.shifts,
      'active jobs': staffMember.jobs,
      'pending bids': staffMember.bids,
      'total bookings': staffMember.shifts,
    },
    breakdowns: {
      'jobs by status': staffMember.jobs,
      'bookings by status': staffMember.shifts,
      'bids by status': staffMember.bids,
    },
  },

  admin: {
    stats: {
      'active jobs': admin.jobTypes,
    },
    extraStats: {
      'active agencies': admin.agencies,
      'active home care companies': admin.homeCareCompanies,
      'total jobs': admin.jobTypes,
      'total bookings': admin.transactions,
      'permanent hires': admin.recruitment,
      'open allegations': admin.allegations,
    },
    breakdowns: {
      users: admin.careHomes,
      jobs: admin.jobTypes,
      bookings: admin.transactions,
      staff: admin.staffMembers,
    },
    userTypes: {
      carehome: admin.careHomes,
      hospital: admin.hospitals,
      localauthority: admin.localAuthority,
      user: admin.individualHomeCare,
      individual: admin.individualHomeCare,
      agency: admin.agencies,
      homecarecompany: admin.homeCareCompanies,
      nurse: admin.staffMembers,
    },
  },
};
