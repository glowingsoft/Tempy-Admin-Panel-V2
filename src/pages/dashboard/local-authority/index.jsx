import { createRoleDashboardPage } from 'src/pages/dashboard/create-role-page';
import { LocalAuthorityDashboardView } from 'src/sections/local-authority/dashboard/view/local-authority-dashboard-view';

export default createRoleDashboardPage({
  title: 'Local Authority Dashboard',
  allowedPermission: 5,
  allowedAccountType: 'local_authority',
  DashboardView: LocalAuthorityDashboardView,
});
