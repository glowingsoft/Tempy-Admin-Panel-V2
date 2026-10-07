import { ShiftsView } from 'src/sections/care-home/shifts/view/shifts-view';
import { MessagesView } from 'src/sections/messaging';
import { CareHomeComplianceView } from 'src/sections/care-home/compliance/view/care-home-compliance-view';
import { paths } from 'src/routes/paths';

import { AddJobView } from 'src/sections/care-home/jobs/view/add-job-view';
import { CreatedJobsView } from 'src/sections/care-home/jobs/view/created-jobs-view';
import { CreatedJobDetailsView } from 'src/sections/care-home/jobs/view/created-job-details-view';
import { JobBidsView } from 'src/sections/care-home/jobs/view/job-bids-view';
import { CareHomeInvoiceListView } from 'src/sections/care-home/invoices/view/care-home-invoice-list-view';
import { StaffListView } from 'src/sections/staff/view/staff-list-view';
import { StaffProvider } from 'src/sections/staff/context/staff-provider';
import { AgencyPaymentsView } from 'src/sections/agency/payments/view/agency-payments-view';
import { AgencyEarningsView } from 'src/sections/agency/earnings/view/agency-earnings-view';

// ----------------------------------------------------------------------

export function LocalAuthorityShiftsView() {
  return <ShiftsView enableBookingCalendar apiRole="localAuthority" />;
}

export function LocalAuthorityStaffView() {
  return (
    <StaffProvider>
      <StaffListView />
    </StaffProvider>
  );
}

export function LocalAuthorityMessagesView() {
  return <MessagesView />;
}

export function LocalAuthorityPaymentsView() {
  return <AgencyPaymentsView />;
}

export function LocalAuthorityEarningsView() {
  return <AgencyEarningsView role="local-authority" />;
}

export function LocalAuthorityComplianceView() {
  return <CareHomeComplianceView />;
}

export function LocalAuthorityInvoicesView() {
  return <CareHomeInvoiceListView />;
}

export function LocalAuthorityPostJobView() {
  return (
    <AddJobView mode="localAuthority" redirectPath={paths.dashboard.localAuthority.jobs.created} />
  );
}

export function LocalAuthorityCreatedJobsView() {
  return <CreatedJobsView mode="localAuthority" />;
}

export function LocalAuthorityCreatedJobDetailsView() {
  return <CreatedJobDetailsView />;
}

export function LocalAuthorityJobBidsView() {
  return <JobBidsView mode="localAuthority" />;
}


export { LocalAuthorityContractsView } from './contracts/view/local-authority-contracts-view';
