import { CONFIG } from 'src/config-global';

import { Iconify } from 'src/components/iconify';
import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const svgIcon = (name) => <SvgColor src={`${CONFIG.site.basePath}/assets/icons/navbar/${name}.svg`} />;

const ify = (name) => <Iconify icon={name} width={24} />;

/**
 * Shared sidebar icons. Prefer these over ad-hoc navbar SVGs so each
 * item maps to what it actually is (and missing files like ic-invoice
 * do not render as a blank square).
 */
export const NAV_ICONS = {
  dashboard: svgIcon('ic-dashboard'),
  dashboardAlt: svgIcon('ic-dashboard-2'),
  calendar: svgIcon('ic-calendar'),
  user: svgIcon('ic-user'),
  chat: svgIcon('ic-chat'),
  job: svgIcon('ic-job'),
  lock: svgIcon('ic-lock'),
  faqs: svgIcon('ic-faqs'),
  terms: svgIcon('ic-file'),
  privacy: svgIcon('ic-lock'),
  contact: svgIcon('ic-contact'),
  branches: svgIcon('ic-booking'),
  banking: svgIcon('ic-banking'),
  order: svgIcon('ic-order'),
  analytics: svgIcon('ic-analytics'),
  invoice: ify('solar:bill-list-bold'),
  support: ify('solar:chat-round-call-bold'),
  about: ify('solar:info-circle-bold'),
  transport: ify('solar:bus-bold'),
  contract: ify('solar:document-text-bold'),
  jobTypes: ify('solar:clipboard-list-bold'),
  careHome: ify('solar:home-smile-bold'),
  hospital: ify('solar:hospital-bold'),
  localAuthority: ify('solar:map-point-bold'),
  individual: ify('solar:heart-bold'),
  agency: ify('solar:case-round-bold'),
  homeCareCompany: ify('solar:home-angle-2-bold'),
  staffMember: ify('solar:user-id-bold'),
  helpCenter: ify('solar:question-circle-bold'),
  star: ify('solar:star-bold'),
  transactions: svgIcon('ic-banking'),
  payouts: ify('solar:wallet-money-bold'),
  recruitment: ify('solar:user-check-rounded-bold'),
  allegations: ify('solar:danger-triangle-bold'),
};
