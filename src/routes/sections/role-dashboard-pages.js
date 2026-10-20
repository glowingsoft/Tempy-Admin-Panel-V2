import { createRolePage } from 'src/pages/dashboard/create-role-page';
import { SupplierAgreedRatesView } from 'src/sections/supplier-relationship/view/agreed-rates-view';
import { MessagesView } from 'src/sections/messaging';

import {
  HospitalShiftsView,
  HospitalStaffView,
  HospitalPaymentsView,
  HospitalEarningsView,
  HospitalComplianceView,
  HospitalPostJobView,
  HospitalCreatedJobsView,
  HospitalCreatedJobDetailsView,
  HospitalJobBidsView,
} from 'src/sections/hospital/hospital-role-views';

import {
  LocalAuthorityShiftsView,
  LocalAuthorityStaffView,
  LocalAuthorityPaymentsView,
  LocalAuthorityEarningsView,
  LocalAuthorityComplianceView,
  LocalAuthorityPostJobView,
  LocalAuthorityCreatedJobsView,
  LocalAuthorityCreatedJobDetailsView,
  LocalAuthorityJobBidsView,
} from 'src/sections/local-authority/local-authority-role-views';

import {
  IndividualHomeCareShiftsView,
  IndividualHomeCareStaffView,
  IndividualHomeCarePaymentsView,
  IndividualHomeCareEarningsView,
  IndividualHomeCareComplianceView,
  IndividualHomeCarePostJobView,
  IndividualHomeCareCreatedJobsView,
  IndividualHomeCareCreatedJobDetailsView,
  IndividualHomeCareJobBidsView,
  IndividualHomeCareAgreedRatesView,
} from 'src/sections/individual-home-care/individual-home-care-role-views';

import {
  HomeCareCompanyShiftsView,
  HomeCareCompanyStaffView,
  HomeCareCompanyPaymentsView,
  HomeCareCompanyJobsView,
  HomeCareCompanyBidsView,
  HomeCareCompanyEarningsView,
  HomeCareCompanyAgreedRatesView,
} from 'src/sections/home-care-company/home-care-company-role-views';

import {
  StaffMemberShiftsView,
  StaffMemberPaymentsView,
  StaffMemberJobsView,
  StaffMemberBidsView,
  StaffMemberEarningsView,
  StaffMemberReviewsView,
} from 'src/sections/staff-member/staff-member-role-views';

// ----------------------------------------------------------------------

export const HospitalShiftsPage = createRolePage({
  title: 'Shifts',
  allowedPermission: 4,
  allowedAccountType: 'hospital_nhs',
  View: HospitalShiftsView,
});

export const HospitalStaffPage = createRolePage({
  title: 'Staff',
  allowedPermission: 4,
  allowedAccountType: 'hospital_nhs',
  View: HospitalStaffView,
});

export const HospitalMessagesPage = createRolePage({
  title: 'Messages',
  allowedPermission: 4,
  allowedAccountType: 'hospital_nhs',
  View: MessagesView,
});

export const HospitalPaymentsPage = createRolePage({
  title: 'Payments',
  allowedPermission: 4,
  allowedAccountType: 'hospital_nhs',
  View: HospitalPaymentsView,
});

export const HospitalEarningsPage = createRolePage({
  title: 'Earnings',
  allowedPermission: 4,
  allowedAccountType: 'hospital_nhs',
  View: HospitalEarningsView,
});

export const HospitalCompliancePage = createRolePage({
  title: 'Compliance',
  allowedPermission: 4,
  allowedAccountType: 'hospital_nhs',
  View: HospitalComplianceView,
});

export const HospitalPostJobPage = createRolePage({
  title: 'Post Job',
  allowedPermission: 4,
  allowedAccountType: 'hospital_nhs',
  View: HospitalPostJobView,
});

export const HospitalCreatedJobsPage = createRolePage({
  title: 'Created Jobs',
  allowedPermission: 4,
  allowedAccountType: 'hospital_nhs',
  View: HospitalCreatedJobsView,
});

export const HospitalCreatedJobDetailsPage = createRolePage({
  title: 'Job Details',
  allowedPermission: 4,
  allowedAccountType: 'hospital_nhs',
  View: HospitalCreatedJobDetailsView,
});

export const HospitalJobBidsPage = createRolePage({
  title: 'Job Bids',
  allowedPermission: 4,
  allowedAccountType: 'hospital_nhs',
  View: HospitalJobBidsView,
});

export const LocalAuthorityShiftsPage = createRolePage({
  title: 'Shifts',
  allowedPermission: 5,
  allowedAccountType: 'local_authority',
  View: LocalAuthorityShiftsView,
});

export const LocalAuthorityStaffPage = createRolePage({
  title: 'Staff',
  allowedPermission: 5,
  allowedAccountType: 'local_authority',
  View: LocalAuthorityStaffView,
});

export const LocalAuthorityMessagesPage = createRolePage({
  title: 'Messages',
  allowedPermission: 5,
  allowedAccountType: 'local_authority',
  View: MessagesView,
});

export const LocalAuthorityPaymentsPage = createRolePage({
  title: 'Payments',
  allowedPermission: 5,
  allowedAccountType: 'local_authority',
  View: LocalAuthorityPaymentsView,
});

export const LocalAuthorityEarningsPage = createRolePage({
  title: 'Earnings',
  allowedPermission: 5,
  allowedAccountType: 'local_authority',
  View: LocalAuthorityEarningsView,
});

export const LocalAuthorityCompliancePage = createRolePage({
  title: 'Compliance',
  allowedPermission: 5,
  allowedAccountType: 'local_authority',
  View: LocalAuthorityComplianceView,
});

export const LocalAuthorityPostJobPage = createRolePage({
  title: 'Post Job',
  allowedPermission: 5,
  allowedAccountType: 'local_authority',
  View: LocalAuthorityPostJobView,
});

export const LocalAuthorityCreatedJobsPage = createRolePage({
  title: 'Created Jobs',
  allowedPermission: 5,
  allowedAccountType: 'local_authority',
  View: LocalAuthorityCreatedJobsView,
});

export const LocalAuthorityCreatedJobDetailsPage = createRolePage({
  title: 'Job Details',
  allowedPermission: 5,
  allowedAccountType: 'local_authority',
  View: LocalAuthorityCreatedJobDetailsView,
});

export const LocalAuthorityJobBidsPage = createRolePage({
  title: 'Job Bids',
  allowedPermission: 5,
  allowedAccountType: 'local_authority',
  View: LocalAuthorityJobBidsView,
});

export const IndividualHomeCareShiftsPage = createRolePage({
  title: 'Shifts',
  allowedPermission: 6,
  allowedAccountType: 'individual_home_care',
  View: IndividualHomeCareShiftsView,
});

export const IndividualHomeCareStaffPage = createRolePage({
  title: 'Staff',
  allowedPermission: 6,
  allowedAccountType: 'individual_home_care',
  View: IndividualHomeCareStaffView,
});

export const IndividualHomeCareMessagesPage = createRolePage({
  title: 'Messages',
  allowedPermission: 6,
  allowedAccountType: 'individual_home_care',
  View: MessagesView,
});

export const IndividualHomeCarePaymentsPage = createRolePage({
  title: 'Payments',
  allowedPermission: 6,
  allowedAccountType: 'individual_home_care',
  View: IndividualHomeCarePaymentsView,
});

export const IndividualHomeCareEarningsPage = createRolePage({
  title: 'Earnings',
  allowedPermission: 6,
  allowedAccountType: 'individual_home_care',
  View: IndividualHomeCareEarningsView,
});

export const IndividualHomeCareCompliancePage = createRolePage({
  title: 'Compliance',
  allowedPermission: 6,
  allowedAccountType: 'individual_home_care',
  View: IndividualHomeCareComplianceView,
});

export const IndividualHomeCarePostJobPage = createRolePage({
  title: 'Post Job',
  allowedPermission: 6,
  allowedAccountType: 'individual_home_care',
  View: IndividualHomeCarePostJobView,
});

export const IndividualHomeCareCreatedJobsPage = createRolePage({
  title: 'Created Jobs',
  allowedPermission: 6,
  allowedAccountType: 'individual_home_care',
  View: IndividualHomeCareCreatedJobsView,
});

export const IndividualHomeCareCreatedJobDetailsPage = createRolePage({
  title: 'Job Details',
  allowedPermission: 6,
  allowedAccountType: 'individual_home_care',
  View: IndividualHomeCareCreatedJobDetailsView,
});

export const IndividualHomeCareJobBidsPage = createRolePage({
  title: 'Job Bids',
  allowedPermission: 6,
  allowedAccountType: 'individual_home_care',
  View: IndividualHomeCareJobBidsView,
});

export const IndividualHomeCareAgreedRatesPage = createRolePage({
  title: 'Agreed rates',
  allowedPermission: 6,
  allowedAccountType: 'individual_home_care',
  View: IndividualHomeCareAgreedRatesView,
});

export const HomeCareCompanyShiftsPage = createRolePage({
  title: 'Shifts',
  allowedPermission: 7,
  allowedAccountType: 'home_care_company',
  View: HomeCareCompanyShiftsView,
});

export const HomeCareCompanyStaffPage = createRolePage({
  title: 'Staff',
  allowedPermission: 7,
  allowedAccountType: 'home_care_company',
  View: HomeCareCompanyStaffView,
});

export const HomeCareCompanyMessagesPage = createRolePage({
  title: 'Messages',
  allowedPermission: 7,
  allowedAccountType: 'home_care_company',
  View: MessagesView,
});

export const HomeCareCompanyPaymentsPage = createRolePage({
  title: 'Payments',
  allowedPermission: 7,
  allowedAccountType: 'home_care_company',
  View: HomeCareCompanyPaymentsView,
});

export const HomeCareCompanyJobsPage = createRolePage({
  title: 'Jobs',
  allowedPermission: 7,
  allowedAccountType: 'home_care_company',
  View: HomeCareCompanyJobsView,
});

export const HomeCareCompanyBidsPage = createRolePage({
  title: 'Bids',
  allowedPermission: 7,
  allowedAccountType: 'home_care_company',
  View: HomeCareCompanyBidsView,
});

export const AgencyAgreedRatesPage = createRolePage({
  title: 'Agreed rates',
  allowedPermission: 3,
  allowedAccountType: 'agency',
  View: SupplierAgreedRatesView,
});

export const StaffMemberAgreedRatesPage = createRolePage({
  title: 'Agreed rates',
  allowedPermission: 8,
  allowedAccountType: 'staff_member',
  View: SupplierAgreedRatesView,
});

export const HomeCareCompanyAgreedRatesPage = createRolePage({
  title: 'Agreed rates',
  allowedPermission: 7,
  allowedAccountType: 'home_care_company',
  View: HomeCareCompanyAgreedRatesView,
});

export const HomeCareCompanyEarningsPage = createRolePage({
  title: 'Earnings',
  allowedPermission: 7,
  allowedAccountType: 'home_care_company',
  View: HomeCareCompanyEarningsView,
});

export const StaffMemberShiftsPage = createRolePage({
  title: 'Shifts',
  allowedPermission: 8,
  allowedAccountType: 'staff_member',
  View: StaffMemberShiftsView,
});

export const StaffMemberMessagesPage = createRolePage({
  title: 'Messages',
  allowedPermission: 8,
  allowedAccountType: 'staff_member',
  View: MessagesView,
});

export const StaffMemberPaymentsPage = createRolePage({
  title: 'Payments',
  allowedPermission: 8,
  allowedAccountType: 'staff_member',
  View: StaffMemberPaymentsView,
});

export const StaffMemberJobsPage = createRolePage({
  title: 'Jobs',
  allowedPermission: 8,
  allowedAccountType: 'staff_member',
  View: StaffMemberJobsView,
});

export const StaffMemberBidsPage = createRolePage({
  title: 'Bids',
  allowedPermission: 8,
  allowedAccountType: 'staff_member',
  View: StaffMemberBidsView,
});

export const StaffMemberEarningsPage = createRolePage({
  title: 'Earnings',
  allowedPermission: 8,
  allowedAccountType: 'staff_member',
  View: StaffMemberEarningsView,
});

export const StaffMemberReviewsPage = createRolePage({
  title: 'Reviews',
  allowedPermission: 8,
  allowedAccountType: 'staff_member',
  View: StaffMemberReviewsView,
});
