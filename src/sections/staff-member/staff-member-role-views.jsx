import { MessagesView } from 'src/sections/messaging';
import { AgencyPaymentsView } from 'src/sections/agency/payments/view/agency-payments-view';
import { AgencyJobsView } from 'src/sections/agency/jobs/view/agency-jobs-view';
import { AgencyBidsView } from 'src/sections/agency/bids/view/agency-bids-view';
import { AgencyEarningsView } from 'src/sections/agency/earnings/view/agency-earnings-view';

export { StaffMemberShiftsView } from './shifts/view';

// ----------------------------------------------------------------------


export function StaffMemberMessagesView() {
  return <MessagesView />;
}

export function StaffMemberPaymentsView() {
  return <AgencyPaymentsView />;
}

export function StaffMemberJobsView() {
  return <AgencyJobsView mode="staffMember" />;
}

export function StaffMemberBidsView() {
  return <AgencyBidsView mode="staffMember" />;
}

export function StaffMemberEarningsView() {
  return <AgencyEarningsView role="nurse" />;
}

export { StaffMemberReviewsView } from './reviews/view/staff-member-reviews-view';
