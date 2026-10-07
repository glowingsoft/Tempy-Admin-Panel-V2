import { createRolePage } from 'src/pages/dashboard/create-role-page';
import { StaffMemberReviewsView } from 'src/sections/staff-member/reviews/view/staff-member-reviews-view';

export default createRolePage({
  title: 'Reviews',
  allowedPermission: 8,
  allowedAccountType: 'staff_member',
  View: StaffMemberReviewsView,
});
