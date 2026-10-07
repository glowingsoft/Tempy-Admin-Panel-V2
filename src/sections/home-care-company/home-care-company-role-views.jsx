import { AgencyShiftsView } from 'src/sections/agency/shifts/view/agency-shifts-view';
import { MessagesView } from 'src/sections/messaging';
import { AgencyPaymentsView } from 'src/sections/agency/payments/view/agency-payments-view';
import { AgencyJobsView } from 'src/sections/agency/jobs/view/agency-jobs-view';
import { AgencyBidsView } from 'src/sections/agency/bids/view/agency-bids-view';
import { AgencyEarningsView } from 'src/sections/agency/earnings/view/agency-earnings-view';
import { SupplierAgreedRatesView } from 'src/sections/supplier-relationship/view/agreed-rates-view';
import { HomeCareCompanyStaffListView } from './staff/view/home-care-company-staff-list-view';

// ----------------------------------------------------------------------

export function HomeCareCompanyShiftsView() {
  return <AgencyShiftsView enableAvailabilityApi apiRole="homeCareCompany" />;
}

export function HomeCareCompanyStaffView() {
  return <HomeCareCompanyStaffListView />;
}

export function HomeCareCompanyMessagesView() {
  return <MessagesView />;
}

export function HomeCareCompanyPaymentsView() {
  return <AgencyPaymentsView />;
}

export function HomeCareCompanyJobsView() {
  return <AgencyJobsView mode="homeCareCompany" />;
}

export function HomeCareCompanyBidsView() {
  return <AgencyBidsView mode="homeCareCompany" />;
}

export function HomeCareCompanyEarningsView() {
  return <AgencyEarningsView role="home-care-company" />;
}

export function HomeCareCompanyAgreedRatesView() {
  return <SupplierAgreedRatesView />;
}
