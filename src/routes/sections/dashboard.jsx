import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { CONFIG } from 'src/config-global';
import { DashboardLayout } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';

import { AuthGuard } from 'src/auth/guard';
import ProtectedRoute from 'src/auth/guard/custom-auth-guard';
import { DASHBOARD_USER_PERMISSIONS } from 'src/auth/utils/dashboard-path-utils';

import {
  HospitalShiftsPage,
  HospitalStaffPage,
  HospitalMessagesPage,
  HospitalPaymentsPage,
  HospitalEarningsPage,
  HospitalCompliancePage,
  HospitalPostJobPage,
  HospitalCreatedJobsPage,
  HospitalCreatedJobDetailsPage,
  HospitalJobBidsPage,
  LocalAuthorityShiftsPage,
  LocalAuthorityStaffPage,
  LocalAuthorityMessagesPage,
  LocalAuthorityPaymentsPage,
  LocalAuthorityEarningsPage,
  LocalAuthorityCompliancePage,
  LocalAuthorityPostJobPage,
  LocalAuthorityCreatedJobsPage,
  LocalAuthorityCreatedJobDetailsPage,
  LocalAuthorityJobBidsPage,
  IndividualHomeCareShiftsPage,
  IndividualHomeCareStaffPage,
  IndividualHomeCareMessagesPage,
  IndividualHomeCarePaymentsPage,
  IndividualHomeCareEarningsPage,
  IndividualHomeCareCompliancePage,
  IndividualHomeCarePostJobPage,
  IndividualHomeCareCreatedJobsPage,
  IndividualHomeCareCreatedJobDetailsPage,
  IndividualHomeCareJobBidsPage,
  IndividualHomeCareAgreedRatesPage,
  HomeCareCompanyShiftsPage,
  HomeCareCompanyStaffPage,
  HomeCareCompanyMessagesPage,
  HomeCareCompanyPaymentsPage,
  HomeCareCompanyJobsPage,
  HomeCareCompanyBidsPage,
  HomeCareCompanyAgreedRatesPage,
  AgencyAgreedRatesPage,
  StaffMemberAgreedRatesPage,
  HomeCareCompanyEarningsPage,
  StaffMemberShiftsPage,
  StaffMemberMessagesPage,
  StaffMemberPaymentsPage,
  StaffMemberJobsPage,
  StaffMemberBidsPage,
  StaffMemberEarningsPage,
} from './role-dashboard-pages';


const IndexPage = lazy(() => import('src/pages/dashboard'));
const OverviewEcommercePage = lazy(() => import('src/pages/dashboard/ecommerce'));
const OverviewAnalyticsPage = lazy(() => import('src/pages/dashboard/analytics'));
const OverviewBankingPage = lazy(() => import('src/pages/dashboard/active-routes/banking'));
const OverviewBookingPage = lazy(() => import('src/pages/dashboard/booking'));
const OverviewFilePage = lazy(() => import('src/pages/dashboard/file'));
const OverviewCoursePage = lazy(() => import('src/pages/dashboard/course'));
const OverviewSamplePage = lazy(() => import('src/pages/dashboard/sample'));

const WalletsPage = lazy(() => import('src/pages/dashboard/active-routes/wallets'));
const SamplePage = lazy(() => import('src/pages/dashboard/active-routes/sample'));
const TransactionsPage = lazy(() => import('src/pages/dashboard/active-routes/transactions'));
const OverviewIncomeCategoryPage = lazy(() => import('src/pages/dashboard/active-routes/income'));
const OverviewExpenseCategoryPage = lazy(() => import('src/pages/dashboard/active-routes/expense'));

const ProductDetailsPage = lazy(() => import('src/pages/dashboard/product/details'));
const ProductListPage = lazy(() => import('src/pages/dashboard/product/list'));
const ProductCreatePage = lazy(() => import('src/pages/dashboard/product/new'));
const ProductEditPage = lazy(() => import('src/pages/dashboard/product/edit'));
const OrderListPage = lazy(() => import('src/pages/dashboard/order/list'));
const OrderDetailsPage = lazy(() => import('src/pages/dashboard/order/details'));
const UserProfilePage = lazy(() => import('src/pages/dashboard/user/profile'));
const UserCardsPage = lazy(() => import('src/pages/dashboard/user/cards'));
const UserListPage = lazy(() => import('src/pages/dashboard/user/list'));
const UserAccountPage = lazy(() => import('src/pages/dashboard/user/account'));
const UserCreatePage = lazy(() => import('src/pages/dashboard/user/new'));
const UserEditPage = lazy(() => import('src/pages/dashboard/user/edit'));
const BlogPostsPage = lazy(() => import('src/pages/dashboard/post/list'));
const BlogPostPage = lazy(() => import('src/pages/dashboard/post/details'));
const BlogNewPostPage = lazy(() => import('src/pages/dashboard/post/new'));
const BlogEditPostPage = lazy(() => import('src/pages/dashboard/post/edit'));
const JobDetailsPage = lazy(() => import('src/pages/dashboard/job/details'));
const JobListPage = lazy(() => import('src/pages/dashboard/job/list'));
const JobCreatePage = lazy(() => import('src/pages/dashboard/job/new'));
const JobEditPage = lazy(() => import('src/pages/dashboard/job/edit'));
const TourDetailsPage = lazy(() => import('src/pages/dashboard/tour/details'));
const TourListPage = lazy(() => import('src/pages/dashboard/tour/list'));
const TourCreatePage = lazy(() => import('src/pages/dashboard/tour/new'));
const TourEditPage = lazy(() => import('src/pages/dashboard/tour/edit'));
const FileManagerPage = lazy(() => import('src/pages/dashboard/file-manager'));
const ChatPage = lazy(() => import('src/pages/dashboard/chat'));
const MailPage = lazy(() => import('src/pages/dashboard/mail'));
const CalendarPage = lazy(() => import('src/pages/dashboard/calendar'));
const KanbanPage = lazy(() => import('src/pages/dashboard/kanban'));
const PermissionDeniedPage = lazy(() => import('src/pages/dashboard/permission'));
const ParamsPage = lazy(() => import('src/pages/dashboard/params'));

const DashboardFaqsPage = lazy(() => import('src/pages/dashboard/faqs'));
const DashboardSupportPage = lazy(() => import('src/pages/dashboard/support'));
const DashboardTermsPage = lazy(() => import('src/pages/dashboard/terms'));
const DashboardAboutUsPage = lazy(() => import('src/pages/dashboard/about-us'));
const DashboardPrivacyPolicyPage = lazy(() => import('src/pages/dashboard/privacy-policy'));
const DashboardContactUsPage = lazy(() => import('src/pages/dashboard/contact-us'));
const DashboardBranchesPage = lazy(() => import('src/pages/dashboard/branches'));
const DashboardBranchDetailsPage = lazy(() => import('src/pages/dashboard/branches/details'));
const ShiftsPage = lazy(() => import('src/pages/dashboard/shifts'));
const StaffLayout = lazy(() => import('src/pages/dashboard/staff/layout'));
const StaffListPage = lazy(() => import('src/pages/dashboard/staff'));
const StaffDetailsPage = lazy(() => import('src/pages/dashboard/staff/details'));
const AgencyStaffLayout = lazy(() => import('src/pages/dashboard/agency/staff/layout'));
const AgencyStaffPage = lazy(() => import('src/pages/dashboard/agency/staff'));
const AgencyDashboardPage = lazy(() => import('src/pages/dashboard/agency'));
const AgencyShiftsPage = lazy(() => import('src/pages/dashboard/agency/shifts'));
const AgencyPaymentsPage = lazy(() => import('src/pages/dashboard/agency/payments'));
const AgencyEarningsPage = lazy(() => import('src/pages/dashboard/agency/earnings'));
const AgencyMessagesPage = lazy(() => import('src/pages/dashboard/agency/messages'));
const CareHomeMessagesPage = lazy(() => import('src/pages/dashboard/messages'));
const PaymentsPage = lazy(() => import('src/pages/dashboard/payments'));
const CompliancePage = lazy(() => import('src/pages/dashboard/compliance'));
const EarningsPage = lazy(() => import('src/pages/dashboard/earnings'));
const PostJobPage = lazy(() => import('src/pages/dashboard/jobs/post'));
const CreatedJobsPage = lazy(() => import('src/pages/dashboard/jobs/created'));
const CreatedJobDetailsPage = lazy(() => import('src/pages/dashboard/jobs/created-details'));
const FindJobsPage = lazy(() => import('src/pages/dashboard/jobs/find'));
const AgencyBidsPage = lazy(() => import('src/pages/dashboard/agency/bids'));
const ContractsPage = lazy(() => import('src/pages/dashboard/contracts'));
const PermanentHiresPage = lazy(() => import('src/pages/dashboard/permanent-hires'));
const AgencyStaffShuttlePage = lazy(() => import('src/pages/dashboard/agency/staff-shuttle'));
const JobBidsPage = lazy(() => import('src/pages/dashboard/jobs/bids'));
const AgreedRatesPage = lazy(() => import('src/pages/dashboard/jobs/agreed-rates'));
const JobTypesPage = lazy(() => import('src/pages/dashboard/jobs/job-types'));

const HospitalDashboardPage = lazy(() => import('src/pages/dashboard/hospital'));
const LocalAuthorityDashboardPage = lazy(() => import('src/pages/dashboard/local-authority'));
const IndividualHomeCareDashboardPage = lazy(() => import('src/pages/dashboard/individual-home-care'));
const HomeCareCompanyDashboardPage = lazy(() => import('src/pages/dashboard/home-care-company'));
const StaffMemberDashboardPage = lazy(() => import('src/pages/dashboard/staff-member'));
const StaffMemberReviewsPage = lazy(() => import('src/pages/dashboard/staff-member/reviews'));


const layoutContent = (
  <DashboardLayout>
    <Suspense fallback={<LoadingScreen />}>
      <Outlet />
    </Suspense>
  </DashboardLayout>
);

export const dashboardRoutes = [
  {
    path: 'dashboard',
    element: CONFIG.auth.skip ? <>{layoutContent}</> : <ProtectedRoute requiredPermission={DASHBOARD_USER_PERMISSIONS}>{layoutContent}</ProtectedRoute>,
    children: [
      { element: <IndexPage />, index: true },
      { path: 'shifts', element: <ShiftsPage /> },
      { path: 'faqs', element: <DashboardFaqsPage /> },
      { path: 'support', element: <DashboardSupportPage /> },
      { path: 'terms', element: <DashboardTermsPage /> },
      { path: 'about-us', element: <DashboardAboutUsPage /> },
      { path: 'privacy-policy', element: <DashboardPrivacyPolicyPage /> },
      { path: 'contact-us', element: <DashboardContactUsPage /> },
      { path: 'branches', element: <DashboardBranchesPage /> },
      { path: 'branches/:id', element: <DashboardBranchDetailsPage /> },
      { path: 'contracts', element: <ContractsPage /> },
      { path: 'permanent-hires', element: <PermanentHiresPage /> },
      {
        path: 'staff',
        element: <StaffLayout />,
        children: [
          { element: <StaffListPage />, index: true },
          { path: ':id', element: <StaffDetailsPage /> },
        ],
      },
      {
        path: 'agency',
        children: [
          { element: <AgencyDashboardPage />, index: true },
          { path: 'shifts', element: <AgencyShiftsPage /> },
          { path: 'staff-shuttle', element: <AgencyStaffShuttlePage /> },
          { path: 'payments', element: <AgencyPaymentsPage /> },
          { path: 'earnings', element: <AgencyEarningsPage /> },
          { path: 'messages', element: <AgencyMessagesPage /> },
          { path: 'bids', element: <AgencyBidsPage /> },
          { path: 'contracts', element: <ContractsPage /> },
          { path: 'agreed-rates', element: <AgencyAgreedRatesPage /> },
          { path: 'faqs', element: <DashboardFaqsPage /> },
          { path: 'support', element: <DashboardSupportPage /> },
          { path: 'terms', element: <DashboardTermsPage /> },
          { path: 'about-us', element: <DashboardAboutUsPage /> },
          { path: 'privacy-policy', element: <DashboardPrivacyPolicyPage /> },
          { path: 'contact-us', element: <DashboardContactUsPage /> },
          { path: 'branches', element: <DashboardBranchesPage /> },
          { path: 'branches/:id', element: <DashboardBranchDetailsPage /> },
          {
            path: 'staff',
            element: <AgencyStaffLayout />,
            children: [{ element: <AgencyStaffPage />, index: true }],
          },
        ],
      },
      {
        path: 'hospital',
        children: [
          { element: <HospitalDashboardPage />, index: true },
          { path: 'shifts', element: <HospitalShiftsPage /> },
          { path: 'staff', element: <HospitalStaffPage /> },
          { path: 'messages', element: <HospitalMessagesPage /> },
          { path: 'payments', element: <HospitalPaymentsPage /> },
          { path: 'earnings', element: <HospitalEarningsPage /> },
          { path: 'compliance', element: <HospitalCompliancePage /> },
          { path: 'faqs', element: <DashboardFaqsPage /> },
          { path: 'support', element: <DashboardSupportPage /> },
          { path: 'terms', element: <DashboardTermsPage /> },
          { path: 'about-us', element: <DashboardAboutUsPage /> },
          { path: 'privacy-policy', element: <DashboardPrivacyPolicyPage /> },
          { path: 'contact-us', element: <DashboardContactUsPage /> },
          { path: 'branches', element: <DashboardBranchesPage /> },
          { path: 'branches/:id', element: <DashboardBranchDetailsPage /> },
          { path: 'jobs/post', element: <HospitalPostJobPage /> },
          { path: 'jobs/created', element: <HospitalCreatedJobsPage /> },
          { path: 'jobs/created/:id', element: <HospitalCreatedJobDetailsPage /> },
          { path: 'jobs/bids', element: <HospitalJobBidsPage /> },
        ],
      },
      {
        path: 'local-authority',
        children: [
          { element: <LocalAuthorityDashboardPage />, index: true },
          { path: 'shifts', element: <LocalAuthorityShiftsPage /> },
          { path: 'staff', element: <LocalAuthorityStaffPage /> },
          { path: 'messages', element: <LocalAuthorityMessagesPage /> },
          { path: 'payments', element: <LocalAuthorityPaymentsPage /> },
          { path: 'earnings', element: <LocalAuthorityEarningsPage /> },
          { path: 'compliance', element: <LocalAuthorityCompliancePage /> },
          { path: 'faqs', element: <DashboardFaqsPage /> },
          { path: 'support', element: <DashboardSupportPage /> },
          { path: 'terms', element: <DashboardTermsPage /> },
          { path: 'about-us', element: <DashboardAboutUsPage /> },
          { path: 'privacy-policy', element: <DashboardPrivacyPolicyPage /> },
          { path: 'contact-us', element: <DashboardContactUsPage /> },
          { path: 'branches', element: <DashboardBranchesPage /> },
          { path: 'branches/:id', element: <DashboardBranchDetailsPage /> },
          { path: 'jobs/post', element: <LocalAuthorityPostJobPage /> },
          { path: 'jobs/created', element: <LocalAuthorityCreatedJobsPage /> },
          { path: 'jobs/created/:id', element: <LocalAuthorityCreatedJobDetailsPage /> },
          { path: 'jobs/bids', element: <LocalAuthorityJobBidsPage /> },
        ],
      },
      {
        path: 'individual-home-care',
        children: [
          { element: <IndividualHomeCareDashboardPage />, index: true },
          { path: 'shifts', element: <IndividualHomeCareShiftsPage /> },
          { path: 'staff', element: <IndividualHomeCareStaffPage /> },
          { path: 'messages', element: <IndividualHomeCareMessagesPage /> },
          { path: 'payments', element: <IndividualHomeCarePaymentsPage /> },
          { path: 'earnings', element: <IndividualHomeCareEarningsPage /> },
          { path: 'compliance', element: <IndividualHomeCareCompliancePage /> },
          { path: 'faqs', element: <DashboardFaqsPage /> },
          { path: 'support', element: <DashboardSupportPage /> },
          { path: 'terms', element: <DashboardTermsPage /> },
          { path: 'about-us', element: <DashboardAboutUsPage /> },
          { path: 'privacy-policy', element: <DashboardPrivacyPolicyPage /> },
          { path: 'contact-us', element: <DashboardContactUsPage /> },
          { path: 'locations', element: <DashboardBranchesPage /> },
          { path: 'locations/:id', element: <DashboardBranchDetailsPage /> },
          { path: 'branches', element: <DashboardBranchesPage /> },
          { path: 'branches/:id', element: <DashboardBranchDetailsPage /> },
          { path: 'jobs/post', element: <IndividualHomeCarePostJobPage /> },
          { path: 'jobs/created', element: <IndividualHomeCareCreatedJobsPage /> },
          { path: 'jobs/created/:id', element: <IndividualHomeCareCreatedJobDetailsPage /> },
          { path: 'jobs/bids', element: <IndividualHomeCareJobBidsPage /> },
          { path: 'jobs/agreed-rates', element: <IndividualHomeCareAgreedRatesPage /> },
          { path: 'contracts', element: <ContractsPage /> },
        ],
      },
      {
        path: 'home-care-company',
        children: [
          { element: <HomeCareCompanyDashboardPage />, index: true },
          { path: 'shifts', element: <HomeCareCompanyShiftsPage /> },
          { path: 'staff', element: <HomeCareCompanyStaffPage /> },
          { path: 'messages', element: <HomeCareCompanyMessagesPage /> },
          { path: 'payments', element: <HomeCareCompanyPaymentsPage /> },
          { path: 'jobs', element: <HomeCareCompanyJobsPage /> },
          { path: 'bids', element: <HomeCareCompanyBidsPage /> },
          { path: 'agreed-rates', element: <HomeCareCompanyAgreedRatesPage /> },
          { path: 'contracts', element: <ContractsPage /> },
          { path: 'earnings', element: <HomeCareCompanyEarningsPage /> },
          { path: 'faqs', element: <DashboardFaqsPage /> },
          { path: 'support', element: <DashboardSupportPage /> },
          { path: 'terms', element: <DashboardTermsPage /> },
          { path: 'about-us', element: <DashboardAboutUsPage /> },
          { path: 'privacy-policy', element: <DashboardPrivacyPolicyPage /> },
          { path: 'contact-us', element: <DashboardContactUsPage /> },
          { path: 'branches', element: <DashboardBranchesPage /> },
          { path: 'branches/:id', element: <DashboardBranchDetailsPage /> },
        ],
      },
      {
        path: 'staff-member',
        children: [
          { element: <StaffMemberDashboardPage />, index: true },
          { path: 'shifts', element: <StaffMemberShiftsPage /> },
          { path: 'messages', element: <StaffMemberMessagesPage /> },
          { path: 'payments', element: <StaffMemberPaymentsPage /> },
          { path: 'jobs', element: <StaffMemberJobsPage /> },
          { path: 'bids', element: <StaffMemberBidsPage /> },
          { path: 'reviews', element: <StaffMemberReviewsPage /> },
          { path: 'contracts', element: <ContractsPage /> },
          { path: 'agreed-rates', element: <StaffMemberAgreedRatesPage /> },
          { path: 'permanent-hires', element: <PermanentHiresPage /> },
          { path: 'earnings', element: <StaffMemberEarningsPage /> },
          { path: 'faqs', element: <DashboardFaqsPage /> },
          { path: 'support', element: <DashboardSupportPage /> },
          { path: 'terms', element: <DashboardTermsPage /> },
          { path: 'about-us', element: <DashboardAboutUsPage /> },
          { path: 'privacy-policy', element: <DashboardPrivacyPolicyPage /> },
          { path: 'contact-us', element: <DashboardContactUsPage /> },
        ],
      },
      { path: 'messages', element: <CareHomeMessagesPage /> },
      { path: 'payments', element: <PaymentsPage /> },
      { path: 'compliance', element: <CompliancePage /> },
      { path: 'earnings', element: <EarningsPage /> },
      { path: 'jobs/post', element: <PostJobPage /> },
      { path: 'jobs/created', element: <CreatedJobsPage /> },
      { path: 'jobs/created/:id', element: <CreatedJobDetailsPage /> },
      { path: 'jobs/find', element: <FindJobsPage /> },
      { path: 'jobs/bids', element: <JobBidsPage /> },
      { path: 'jobs/agreed-rates', element: <AgreedRatesPage /> },
      { path: 'jobs/job-types', element: <JobTypesPage /> },
      { path: 'ecommerce', element: <OverviewEcommercePage /> },
      { path: 'analytics', element: <OverviewAnalyticsPage /> },
      { path: 'banking', element: <OverviewBankingPage /> },
      { path: 'booking', element: <OverviewBookingPage /> },
      { path: 'file', element: <OverviewFilePage /> },
      { path: 'course', element: <OverviewCoursePage /> },
      { path: 'profile', element: <UserAccountPage /> },
      { path: 'sample', element: <SamplePage /> },

      {
        path: 'user',
        children: [
          { element: <UserProfilePage />, index: true },
          { path: 'profile', element: <UserProfilePage /> },
          { path: 'cards', element: <UserCardsPage /> },
          { path: 'list', element: <UserListPage /> },
          { path: 'pending-users', element: <UserListPage /> },
          { path: 'new', element: <UserCreatePage /> },
          { path: ':id/edit', element: <UserEditPage /> },
          { path: 'account', element: <UserAccountPage /> },
        ],
      },
      {
        path: 'product',
        children: [
          { element: <ProductListPage />, index: true },
          { path: 'list', element: <ProductListPage /> },
          { path: ':id', element: <ProductDetailsPage /> },
          { path: 'new', element: <ProductCreatePage /> },
          { path: ':id/edit', element: <ProductEditPage /> },
        ],
      },
      {
        path: 'order',
        children: [
          { element: <OrderListPage />, index: true },
          { path: 'list', element: <OrderListPage /> },
          { path: ':id', element: <OrderDetailsPage /> },
        ],
      },
      {
        path: 'post',
        children: [
          { element: <BlogPostsPage />, index: true },
          { path: 'list', element: <BlogPostsPage /> },
          { path: ':title', element: <BlogPostPage /> },
          { path: ':title/edit', element: <BlogEditPostPage /> },
          { path: 'new', element: <BlogNewPostPage /> },
        ],
      },
      {
        path: 'job',
        children: [
          { element: <JobListPage />, index: true },
          { path: 'list', element: <JobListPage /> },
          { path: ':id', element: <JobDetailsPage /> },
          { path: 'new', element: <JobCreatePage /> },
          { path: ':id/edit', element: <JobEditPage /> },
        ],
      },
      {
        path: 'tour',
        children: [
          { element: <TourListPage />, index: true },
          { path: 'list', element: <TourListPage /> },
          { path: ':id', element: <TourDetailsPage /> },
          { path: 'new', element: <TourCreatePage /> },
          { path: ':id/edit', element: <TourEditPage /> },
        ],
      },
      { path: 'file-manager', element: <FileManagerPage /> },
      { path: 'mail', element: <MailPage /> },
      { path: 'chat', element: <ChatPage /> },
      { path: 'calendar', element: <CalendarPage /> },
      { path: 'kanban', element: <KanbanPage /> },
      { path: 'permission', element: <PermissionDeniedPage /> },
      { path: 'params', element: <ParamsPage /> },
    ],
  },
];
