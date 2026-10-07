import { createRoleDashboardPage } from 'src/pages/dashboard/create-role-page';
import { StaffMemberDashboardView } from 'src/sections/staff-member/dashboard/view/staff-member-dashboard-view';

export default createRoleDashboardPage({
  title: 'Staff Member Dashboard',
  allowedPermission: 8,
  allowedAccountType: 'staff_member',
  DashboardView: StaffMemberDashboardView,
});
