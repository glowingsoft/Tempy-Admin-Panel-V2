import { createRoleDashboardPage } from 'src/pages/dashboard/create-role-page';
import { HomeCareCompanyDashboardView } from 'src/sections/home-care-company/dashboard/view/home-care-company-dashboard-view';

export default createRoleDashboardPage({
  title: 'Home Care Company Dashboard',
  allowedPermission: 7,
  allowedAccountType: 'home_care_company',
  DashboardView: HomeCareCompanyDashboardView,
});
