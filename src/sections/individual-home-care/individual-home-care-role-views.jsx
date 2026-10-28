import { ShiftsView } from 'src/sections/care-home/shifts/view/shifts-view';
import { MessagesView } from 'src/sections/messaging';
import { CareHomeComplianceView } from 'src/sections/care-home/compliance/view/care-home-compliance-view';
import { paths } from 'src/routes/paths';

import { AddJobView } from 'src/sections/care-home/jobs/view/add-job-view';
import { CreatedJobsView } from 'src/sections/care-home/jobs/view/created-jobs-view';
import { CreatedJobDetailsView } from 'src/sections/care-home/jobs/view/created-job-details-view';
import { JobBidsView } from 'src/sections/care-home/jobs/view/job-bids-view';
import { SupplierAgreedRatesView } from 'src/sections/supplier-relationship/view/agreed-rates-view';
import { StaffListView } from 'src/sections/staff/view/staff-list-view';
import { StaffProvider } from 'src/sections/staff/context/staff-provider';
import { AgencyPaymentsView } from 'src/sections/agency/payments/view/agency-payments-view';
import { AgencyEarningsView } from 'src/sections/agency/earnings/view/agency-earnings-view';


export function IndividualHomeCareShiftsView() {
  return (
    <ShiftsView
      enableBookingCalendar
      apiRole="user"
      rotaConfig={{
        key: 'individual-home-care',
      }}
    />
  );
}

export function IndividualHomeCareStaffView() {
  return (
    <StaffProvider>
      <StaffListView />
    </StaffProvider>
  );
}

export function IndividualHomeCareMessagesView() {
  return <MessagesView />;
}

export function IndividualHomeCarePaymentsView() {
  return <AgencyPaymentsView />;
}

export function IndividualHomeCareEarningsView() {
  return <AgencyEarningsView role="user" />;
}

export function IndividualHomeCareComplianceView() {
  return <CareHomeComplianceView />;
}

export function IndividualHomeCarePostJobView() {
  return (
    <AddJobView mode="user" redirectPath={paths.dashboard.individualHomeCare.jobs.created} />
  );
}

export function IndividualHomeCareCreatedJobsView() {
  return <CreatedJobsView mode="user" />;
}

export function IndividualHomeCareCreatedJobDetailsView() {
  return <CreatedJobDetailsView />;
}

export function IndividualHomeCareJobBidsView() {
  return <JobBidsView mode="user" />;
}

export function IndividualHomeCareAgreedRatesView() {
  return <SupplierAgreedRatesView />;
}
