import { ShiftsView } from 'src/sections/care-home/shifts/view/shifts-view';
import { MessagesView } from 'src/sections/messaging';
import { CareHomeComplianceView } from 'src/sections/care-home/compliance/view/care-home-compliance-view';
import { paths } from 'src/routes/paths';

import { AddJobView } from 'src/sections/care-home/jobs/view/add-job-view';
import { CreatedJobsView } from 'src/sections/care-home/jobs/view/created-jobs-view';
import { CreatedJobDetailsView } from 'src/sections/care-home/jobs/view/created-job-details-view';
import { JobBidsView } from 'src/sections/care-home/jobs/view/job-bids-view';
import { StaffListView } from 'src/sections/staff/view/staff-list-view';
import { StaffProvider } from 'src/sections/staff/context/staff-provider';
import { AgencyPaymentsView } from 'src/sections/agency/payments/view/agency-payments-view';
import { AgencyEarningsView } from 'src/sections/agency/earnings/view/agency-earnings-view';

// ----------------------------------------------------------------------

export function HospitalShiftsView() {
  return <ShiftsView enableBookingCalendar apiRole="hospital" />;
}

export function HospitalStaffView() {
  return (
    <StaffProvider>
      <StaffListView />
    </StaffProvider>
  );
}

export function HospitalMessagesView() {
  return <MessagesView />;
}

export function HospitalPaymentsView() {
  return <AgencyPaymentsView />;
}

export function HospitalEarningsView() {
  return <AgencyEarningsView role="hospital" />;
}

export function HospitalComplianceView() {
  return <CareHomeComplianceView />;
}

export function HospitalPostJobView() {
  return <AddJobView mode="hospital" redirectPath={paths.dashboard.hospital.jobs.created} />;
}

export function HospitalCreatedJobsView() {
  return <CreatedJobsView mode="hospital" />;
}

export function HospitalCreatedJobDetailsView() {
  return <CreatedJobDetailsView />;
}

export function HospitalJobBidsView() {
  return <JobBidsView mode="hospital" />;
}

