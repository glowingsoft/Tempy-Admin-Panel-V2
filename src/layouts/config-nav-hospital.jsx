import { paths } from 'src/routes/paths';

import { NAV_ICONS } from './nav-icons';


export const navDataHospital = [
  {
    items: [
      { title: 'Book a shift', countKey: 'shifts', path: paths.dashboard.hospital.shifts, icon: NAV_ICONS.calendar },
      { title: 'Dashboard', path: paths.dashboard.hospital.root, icon: NAV_ICONS.dashboard },
      { title: 'Locations', path: paths.dashboard.hospital.branches, icon: NAV_ICONS.branches, deep: true },
      { title: 'Staff', path: paths.dashboard.hospital.staff, icon: NAV_ICONS.user },
      {
        title: 'Jobs',
        path: paths.dashboard.hospital.jobs.created,
        icon: NAV_ICONS.job,
        deep: true,
        children: [
          { title: 'Created Jobs', path: paths.dashboard.hospital.jobs.created },
          { title: 'Job Bids', countKey: 'jobBids', path: paths.dashboard.hospital.jobs.bids },
        ],
      },
      { title: 'Chat', countKey: 'chat', path: paths.dashboard.hospital.messages, icon: NAV_ICONS.chat },
      { title: 'Compliance', path: paths.dashboard.hospital.compliance, icon: NAV_ICONS.lock },
      { title: 'Payments', path: paths.dashboard.hospital.payments, icon: NAV_ICONS.banking },
      {
        title: 'Help & Info',
        path: paths.dashboard.hospital.faqs,
        icon: NAV_ICONS.faqs,
        deep: true,
        children: [
          { title: 'FAQs', path: paths.dashboard.hospital.faqs },
          { title: 'Support', path: paths.dashboard.hospital.support },
          { title: 'Terms and Conditions', path: paths.dashboard.hospital.terms },
          { title: 'About Us', path: paths.dashboard.hospital.aboutUs },
          { title: 'Privacy Policy', path: paths.dashboard.hospital.privacyPolicy },
          { title: 'Contact Us', path: paths.dashboard.hospital.contactUs },
        ],
      },
    ],
  },
];
