import { createRoleDashboardPage } from 'src/pages/dashboard/create-role-page';
import { IndividualHomeCareDashboardView } from 'src/sections/individual-home-care/dashboard/view/individual-home-care-dashboard-view';

export default createRoleDashboardPage({
  title: 'Individual Home Care Dashboard',
  allowedPermission: 6,
  allowedAccountType: 'individual_home_care',
  DashboardView: IndividualHomeCareDashboardView,
});
