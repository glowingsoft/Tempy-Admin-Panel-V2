import { paths } from 'src/routes/paths';

import { NAV_ICONS } from './nav-icons';


export const navDataCareHome = [
  {
    items: [
      { title: 'Book a shift', countKey: 'shifts', path: paths.dashboard.shifts, icon: NAV_ICONS.calendar },
      { title: 'Dashboard', path: paths.dashboard.root, icon: NAV_ICONS.dashboard },
      { title: 'Locations', path: paths.dashboard.branches, icon: NAV_ICONS.branches, deep: true },
      { title: 'Staff', path: paths.dashboard.staff.root, icon: NAV_ICONS.user },
      {
        title: 'Jobs',
        path: paths.dashboard.jobs.root,
        icon: NAV_ICONS.job,
        deep: true,
        children: [
          { title: 'Created Jobs', path: paths.dashboard.jobs.created },
          { title: 'Job Bids', countKey: 'jobBids', path: paths.dashboard.jobs.bids },
          { title: 'Agreed rates', countKey: 'agreedRates', path: paths.dashboard.jobs.agreedRates },
        ],
      },
      { title: 'Chat', countKey: 'chat', path: paths.dashboard.messages, icon: NAV_ICONS.chat },
      { title: 'Contracts', countKey: 'contracts', path: paths.dashboard.contracts, icon: NAV_ICONS.contract },
      { title: 'Permanent hires', countKey: 'permanentHires', path: paths.dashboard.permanentHires, icon: NAV_ICONS.user },
      { title: 'Compliance', path: paths.dashboard.compliance, icon: NAV_ICONS.lock },
      { title: 'Payments', path: paths.dashboard.payments, icon: NAV_ICONS.banking },
      {
        title: 'Help & Info',
        path: paths.dashboard.faqs,
        icon: NAV_ICONS.faqs,
        deep: true,
        children: [
          { title: 'FAQs', path: paths.dashboard.faqs },
          { title: 'Support', path: paths.dashboard.support },
          { title: 'Terms and Conditions', path: paths.dashboard.terms },
          { title: 'About Us', path: paths.dashboard.aboutUs },
          { title: 'Privacy Policy', path: paths.dashboard.privacyPolicy },
          { title: 'Contact Us', path: paths.dashboard.contactUs },
        ],
      },
    ],
  },
];
