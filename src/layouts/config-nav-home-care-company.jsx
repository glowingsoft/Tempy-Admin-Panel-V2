import { paths } from 'src/routes/paths';

import { NAV_ICONS } from './nav-icons';

export const navDataHomeCareCompany = [
  {
    items: [
      { title: 'Dashboard', path: paths.dashboard.homeCareCompany.root, icon: NAV_ICONS.dashboard },
      { title: 'Locations', path: paths.dashboard.homeCareCompany.branches, icon: NAV_ICONS.branches, deep: true },
      { title: 'Shifts', countKey: 'shifts', path: paths.dashboard.homeCareCompany.shifts, icon: NAV_ICONS.calendar },
      { title: 'Staff', path: paths.dashboard.homeCareCompany.staff, icon: NAV_ICONS.user },
      { title: 'Chat', countKey: 'chat', path: paths.dashboard.homeCareCompany.messages, icon: NAV_ICONS.chat },
      { title: 'Payments', path: paths.dashboard.homeCareCompany.payments, icon: NAV_ICONS.banking },
      { title: 'Jobs', countKey: 'jobs', path: paths.dashboard.homeCareCompany.jobs, icon: NAV_ICONS.job },
      { title: 'Bids', countKey: 'bids', path: paths.dashboard.homeCareCompany.bids, icon: NAV_ICONS.order },
      { title: 'Agreed rates', countKey: 'agreedRates', path: paths.dashboard.homeCareCompany.agreedRates, icon: NAV_ICONS.contract },
      { title: 'Contracts', countKey: 'contracts', path: paths.dashboard.homeCareCompany.contracts, icon: NAV_ICONS.contract },
      { title: 'Earnings', path: paths.dashboard.homeCareCompany.earnings, icon: NAV_ICONS.analytics },
      {
        title: 'Help & Info',
        path: paths.dashboard.homeCareCompany.faqs,
        icon: NAV_ICONS.faqs,
        deep: true,
        children: [
          { title: 'FAQs', path: paths.dashboard.homeCareCompany.faqs },
          { title: 'Support', path: paths.dashboard.homeCareCompany.support },
          { title: 'Terms and Conditions', path: paths.dashboard.homeCareCompany.terms },
          { title: 'About Us', path: paths.dashboard.homeCareCompany.aboutUs },
          { title: 'Privacy Policy', path: paths.dashboard.homeCareCompany.privacyPolicy },
          { title: 'Contact Us', path: paths.dashboard.homeCareCompany.contactUs },
        ],
      },
    ],
  },
];
