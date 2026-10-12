import { paths } from 'src/routes/paths';

import { NAV_ICONS } from './nav-icons';

export const navDataStaffMember = [
  {
    items: [
      { title: 'Dashboard', path: paths.dashboard.staffMember.root, icon: NAV_ICONS.dashboard },
      { title: 'Shifts', countKey: 'shifts', path: paths.dashboard.staffMember.shifts, icon: NAV_ICONS.calendar },
      { title: 'Chat', countKey: 'chat', path: paths.dashboard.staffMember.messages, icon: NAV_ICONS.chat },
      { title: 'Payments', path: paths.dashboard.staffMember.payments, icon: NAV_ICONS.banking },
      { title: 'Jobs', countKey: 'jobs', path: paths.dashboard.staffMember.jobs, icon: NAV_ICONS.job },
      { title: 'Bids', countKey: 'bids', path: paths.dashboard.staffMember.bids, icon: NAV_ICONS.order },
      { title: 'Agreed rates', countKey: 'agreedRates', path: paths.dashboard.staffMember.agreedRates, icon: NAV_ICONS.contract },
      { title: 'Contracts', countKey: 'contracts', path: paths.dashboard.staffMember.contracts, icon: NAV_ICONS.contract },
      { title: 'Permanent hires', countKey: 'permanentHires', path: paths.dashboard.staffMember.permanentHires, icon: NAV_ICONS.user },
      { title: 'Reviews', countKey: 'reviews', path: paths.dashboard.staffMember.reviews, icon: NAV_ICONS.star },
      { title: 'Earnings', path: paths.dashboard.staffMember.earnings, icon: NAV_ICONS.analytics },
      {
        title: 'Help & Info',
        path: paths.dashboard.staffMember.faqs,
        icon: NAV_ICONS.faqs,
        deep: true,
        children: [
          { title: 'FAQs', path: paths.dashboard.staffMember.faqs },
          { title: 'Support', path: paths.dashboard.staffMember.support },
          { title: 'Terms and Conditions', path: paths.dashboard.staffMember.terms },
          { title: 'About Us', path: paths.dashboard.staffMember.aboutUs },
          { title: 'Privacy Policy', path: paths.dashboard.staffMember.privacyPolicy },
          { title: 'Contact Us', path: paths.dashboard.staffMember.contactUs },
        ],
      },
    ],
  },
];
