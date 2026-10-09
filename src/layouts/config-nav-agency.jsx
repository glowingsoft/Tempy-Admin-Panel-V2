import { paths } from 'src/routes/paths';

import { NAV_ICONS } from './nav-icons';

export const navDataAgency = [
  {
    items: [
      { title: 'Dashboard', path: paths.dashboard.agency.root, icon: NAV_ICONS.dashboard },
      { title: 'Branches', path: paths.dashboard.agency.branches, icon: NAV_ICONS.branches, deep: true },
      { title: 'Shifts', countKey: 'shifts', path: paths.dashboard.agency.shifts, icon: NAV_ICONS.calendar },
      { title: 'Staff', path: paths.dashboard.agency.staff, icon: NAV_ICONS.user },
      { title: 'Chat', countKey: 'chat', path: paths.dashboard.agency.messages, icon: NAV_ICONS.chat },
      { title: 'Payments', path: paths.dashboard.agency.payments, icon: NAV_ICONS.banking },
      { title: 'Jobs', countKey: 'jobs', path: paths.dashboard.jobs.find, icon: NAV_ICONS.job },
      { title: 'Bids', countKey: 'bids', path: paths.dashboard.agency.bids, icon: NAV_ICONS.order },
      { title: 'Agreed rates', countKey: 'agreedRates', path: paths.dashboard.agency.agreedRates, icon: NAV_ICONS.contract },
      { title: 'Contracts', countKey: 'contracts', path: paths.dashboard.agency.contracts, icon: NAV_ICONS.contract },
      { title: 'Earnings', path: paths.dashboard.agency.earnings, icon: NAV_ICONS.analytics },
      {
        title: 'Help & Info',
        path: paths.dashboard.agency.faqs,
        icon: NAV_ICONS.faqs,
        deep: true,
        children: [
          { title: 'FAQs', path: paths.dashboard.agency.faqs },
          { title: 'Support', path: paths.dashboard.agency.support },
          { title: 'Terms and Conditions', path: paths.dashboard.agency.terms },
          { title: 'About Us', path: paths.dashboard.agency.aboutUs },
          { title: 'Privacy Policy', path: paths.dashboard.agency.privacyPolicy },
          { title: 'Contact Us', path: paths.dashboard.agency.contactUs },
        ],
      },
    ],
  },
];
