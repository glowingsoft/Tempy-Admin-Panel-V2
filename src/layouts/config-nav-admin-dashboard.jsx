import { paths } from 'src/routes/paths';

import { NAV_ICONS } from './nav-icons';

// ----------------------------------------------------------------------

export const navDataAdmin = [
  {
    subheader: 'Platform',
    items: [
      { title: 'Dashboard', path: paths.adminDashboard.root, icon: NAV_ICONS.dashboardAlt },
      { title: 'Job Types', path: paths.adminDashboard.jobTypes, icon: NAV_ICONS.jobTypes },
      { title: 'Permanent hire', path: paths.adminDashboard.recruitment, icon: NAV_ICONS.recruitment },
      { title: 'Allegations', path: paths.adminDashboard.allegations, icon: NAV_ICONS.allegations },
      { title: 'Payouts', path: paths.adminDashboard.transactions, icon: NAV_ICONS.transactions },
    ],
  },
  {
    subheader: 'Customers',
    items: [
      { title: 'Care Home', path: paths.adminDashboard.careHomes, icon: NAV_ICONS.careHome },
      { title: 'Hospitals/NHS', path: paths.adminDashboard.hospitals, icon: NAV_ICONS.hospital },
      { title: 'Local Authority', path: paths.adminDashboard.localAuthority, icon: NAV_ICONS.localAuthority },
      {
        title: 'Individual (Home Care)',
        path: paths.adminDashboard.individualHomeCare,
        icon: NAV_ICONS.individual,
      },
    ],
  },
  {
    subheader: 'Suppliers',
    items: [
      { title: 'Agency/Supplier', path: paths.adminDashboard.agencies, icon: NAV_ICONS.agency },
      {
        title: 'Home Care Company',
        path: paths.adminDashboard.homeCareCompanies,
        icon: NAV_ICONS.homeCareCompany,
      },
      {
        title: 'Individual (Staff Member)',
        path: paths.adminDashboard.staffMembers,
        icon: NAV_ICONS.staffMember,
      },
    ],
  },
  {
    subheader: 'Content',
    items: [
      { title: "Faq's", path: paths.adminDashboard.content.faqs, icon: NAV_ICONS.faqs },
      { title: 'Support', path: paths.adminDashboard.content.support, icon: NAV_ICONS.support },
      { title: 'About Us', path: paths.adminDashboard.content.about, icon: NAV_ICONS.about },
      { title: 'Privacy Policy', path: paths.adminDashboard.content.privacy, icon: NAV_ICONS.privacy },
      { title: 'Terms of Service', path: paths.adminDashboard.content.terms, icon: NAV_ICONS.terms },
    ],
  },
];
