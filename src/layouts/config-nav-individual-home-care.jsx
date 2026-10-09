import { paths } from 'src/routes/paths';

import { NAV_ICONS } from './nav-icons';

export const navDataIndividualHomeCare = [
  {
    items: [
      { title: 'Dashboard', path: paths.dashboard.individualHomeCare.root, icon: NAV_ICONS.dashboard },
      { title: 'Locations', path: paths.dashboard.individualHomeCare.locations, icon: NAV_ICONS.branches, deep: true },
      { title: 'Shifts', countKey: 'shifts', path: paths.dashboard.individualHomeCare.shifts, icon: NAV_ICONS.calendar },
      { title: 'Staff', path: paths.dashboard.individualHomeCare.staff, icon: NAV_ICONS.user },
      { title: 'Chat', countKey: 'chat', path: paths.dashboard.individualHomeCare.messages, icon: NAV_ICONS.chat },
      {
        title: 'Jobs',
        path: paths.dashboard.individualHomeCare.jobs.created,
        icon: NAV_ICONS.job,
        deep: true,
        children: [
          { title: 'Created Jobs', path: paths.dashboard.individualHomeCare.jobs.created },
          { title: 'Job Bids', countKey: 'jobBids', path: paths.dashboard.individualHomeCare.jobs.bids },
          { title: 'Agreed rates', countKey: 'agreedRates', path: paths.dashboard.individualHomeCare.jobs.agreedRates },
        ],
      },
      { title: 'Contracts', countKey: 'contracts', path: paths.dashboard.individualHomeCare.contracts, icon: NAV_ICONS.contract },
      { title: 'Compliance', path: paths.dashboard.individualHomeCare.compliance, icon: NAV_ICONS.lock },
      { title: 'Payments', path: paths.dashboard.individualHomeCare.payments, icon: NAV_ICONS.banking },
      {
        title: 'Help & Info',
        path: paths.dashboard.individualHomeCare.faqs,
        icon: NAV_ICONS.faqs,
        deep: true,
        children: [
          { title: 'FAQs', path: paths.dashboard.individualHomeCare.faqs },
          { title: 'Support', path: paths.dashboard.individualHomeCare.support },
          { title: 'Terms and Conditions', path: paths.dashboard.individualHomeCare.terms },
          { title: 'About Us', path: paths.dashboard.individualHomeCare.aboutUs },
          { title: 'Privacy Policy', path: paths.dashboard.individualHomeCare.privacyPolicy },
          { title: 'Contact Us', path: paths.dashboard.individualHomeCare.contactUs },
        ],
      },
    ],
  },
];
