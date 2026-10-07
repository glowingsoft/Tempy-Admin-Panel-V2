import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';

import { paths } from 'src/routes/paths';

import { useTabs } from 'src/hooks/use-tabs';

import { getDashboardRootPath } from 'src/auth/utils/dashboard-path-utils';
import { resolveDashboardRole } from 'src/auth/utils/role-module-redirect';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { AccountGeneral } from '../account-general';
import { AccountChangePassword } from '../account-change-password';
import { isStaffMemberAccount } from 'src/sections/staff-member/profile/staff-member-profile-store';
import { StaffMemberProfessionalForm } from 'src/sections/staff-member/profile/staff-member-professional-form';
import { StaffMemberCertificatesForm } from 'src/sections/staff-member/profile/staff-member-certificates-form';
import { isSupplierRole } from 'src/sections/job-roles/supplier-job-roles-utils';
import { SupplierJobRolesForm } from 'src/sections/job-roles/supplier-job-roles-form';

// ----------------------------------------------------------------------

const BASE_TABS = [
  { value: 'general', label: 'General', icon: <Iconify icon="solar:user-id-bold" width={24} /> },
  {
    value: 'changePassword',
    label: 'Change Password',
    icon: <Iconify icon="ic:round-vpn-key" width={24} />,
  },
];

const STAFF_TABS = [
  {
    value: 'professional',
    label: 'Professional',
    icon: <Iconify icon="solar:shield-check-bold" width={24} />,
  },
  {
    value: 'certificates',
    label: 'Certificates',
    icon: <Iconify icon="solar:diploma-bold" width={24} />,
  },
];

const JOB_TYPES_TAB = {
  value: 'jobTypes',
  label: 'My job types',
  icon: <Iconify icon="solar:case-round-bold" width={24} />,
};

const DEEP_LINK_TABS = ['certificates', 'professional', JOB_TYPES_TAB.value];

// ----------------------------------------------------------------------

export function AccountView() {
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const tabs = useTabs(DEEP_LINK_TABS.includes(requestedTab) ? requestedTab : 'general');
  const { user } = useSelector((state) => state.user);
  const staffProfile = isStaffMemberAccount(user);
  const dashboardRole = resolveDashboardRole(user);
  const supplierProfile = isSupplierRole(dashboardRole);
  const tabItems = [
    ...BASE_TABS.slice(0, 1),
    ...(staffProfile ? STAFF_TABS : []),
    ...(supplierProfile ? [JOB_TYPES_TAB] : []),
    ...BASE_TABS.slice(1),
  ];
  // A deep-linked tab this account doesn't have (e.g. ?tab=jobTypes for a customer) falls back to General.
  const activeTab = tabItems.some((tab) => tab.value === tabs.value) ? tabs.value : 'general';
  const dashboardHref = getDashboardRootPath(
    user?.permission,
    user?.accountState?.accountType || user?.accountType
  );

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Profile"
        links={[{ name: 'Dashboard', href: dashboardHref || paths.dashboard.root }, { name: 'Profile' }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Tabs value={activeTab} onChange={tabs.onChange} sx={{ mb: { xs: 3, md: 5 } }}>
        {tabItems.map((tab) => (
          <Tab key={tab.value} label={tab.label} icon={tab.icon} value={tab.value} />
        ))}
      </Tabs>

      {activeTab === 'general' && <AccountGeneral />}

      {activeTab === 'professional' && staffProfile && <StaffMemberProfessionalForm />}

      {activeTab === 'certificates' && staffProfile && <StaffMemberCertificatesForm />}

      {activeTab === JOB_TYPES_TAB.value && supplierProfile && (
        <SupplierJobRolesForm role={dashboardRole} />
      )}

      {activeTab === 'changePassword' && <AccountChangePassword />}
    </DashboardContent>
  );
}
