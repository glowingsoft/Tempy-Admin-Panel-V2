import { createRoleDashboardPage } from 'src/pages/dashboard/create-role-page';
import { HospitalDashboardView } from 'src/sections/hospital/dashboard/view/hospital-dashboard-view';

export default createRoleDashboardPage({
  title: 'Hospital Dashboard',
  allowedPermission: 4,
  allowedAccountType: 'hospital_nhs',
  DashboardView: HospitalDashboardView,
});
