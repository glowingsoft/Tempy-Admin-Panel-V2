import { paths } from 'src/routes/paths';

import { NAV_ICONS } from './nav-icons';

export const navDataLocalAuthority = [
  {
    items: [
      { title: 'Dashboard', path: paths.dashboard.localAuthority.root, icon: NAV_ICONS.dashboard },
      { title: 'Locations', path: paths.dashboard.localAuthority.branches, icon: NAV_ICONS.branches, deep: true },
      { title: 'Shifts', countKey: 'shifts', path: paths.dashboard.localAuthority.shifts, icon: NAV_ICONS.calendar },
      { title: 'Staff', path: paths.dashboard.localAuthority.staff, icon: NAV_ICONS.user },
      { title: 'Chat', countKey: 'chat', path: paths.dashboard.localAuthority.messages, icon: NAV_ICONS.chat },
      {
        title: 'Jobs',
        path: paths.dashboard.localAuthority.jobs.created,
        icon: NAV_ICONS.job,
        deep: true,
        children: [
          { title: 'Created Jobs', path: paths.dashboard.localAuthority.jobs.created },
          { title: 'Job Bids', countKey: 'jobBids', path: paths.dashboard.localAuthority.jobs.bids },
          { title: 'Contracts', countKey: 'contracts', path: paths.dashboard.localAuthority.jobs.contracts },
        ],
      },
      { title: 'Compliance', path: paths.dashboard.localAuthority.compliance, icon: NAV_ICONS.lock },
      { title: 'Payments', path: paths.dashboard.localAuthority.payments, icon: NAV_ICONS.banking },
      {
        title: 'Help & Info',
        path: paths.dashboard.localAuthority.faqs,
        icon: NAV_ICONS.faqs,
        deep: true,
        children: [
          { title: 'FAQs', path: paths.dashboard.localAuthority.faqs },
          { title: 'Support', path: paths.dashboard.localAuthority.support },
          { title: 'Terms and Conditions', path: paths.dashboard.localAuthority.terms },
          { title: 'About Us', path: paths.dashboard.localAuthority.aboutUs },
          { title: 'Privacy Policy', path: paths.dashboard.localAuthority.privacyPolicy },
          { title: 'Contact Us', path: paths.dashboard.localAuthority.contactUs },
        ],
      },
    ],
  },
];
