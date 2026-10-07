import { createApi } from "@reduxjs/toolkit/query/react";
import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from "../baseQuery";

const ADMIN_ACCESS_TOKEN = import.meta.env.VITE_ADMIN_ACCESS_TOKEN;

const AUTH_ROUTES_BY_USER_TYPE = {
  admin: API_ROUTES.AUTH,
  careHome: API_ROUTES.AUTH.CARE_HOME,
  hospital: API_ROUTES.AUTH.HOSPITAL,
  localAuthority: API_ROUTES.AUTH.LOCAL_AUTHORITY,
  user: API_ROUTES.AUTH.USER,
  agency: API_ROUTES.AUTH.AGENCY,
  homeCareCompany: API_ROUTES.AUTH.HOME_CARE_COMPANY,
  nurse: API_ROUTES.AUTH.NURSE,
  
};

const getRoleAuthRoutes = (userType) =>
  AUTH_ROUTES_BY_USER_TYPE[userType] || API_ROUTES.AUTH;

const getAdminPanelHeaders = () => {
  if (!ADMIN_ACCESS_TOKEN) return undefined;

  return {
    'x-admin-access-token': ADMIN_ACCESS_TOKEN,
  };
};


export const authApi = createApi({
  reducerPath: "auth",
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: ['profile'],
  endpoints: (builder) => ({

    login: builder.mutation({
      query: (login) => ({
        url: getRoleAuthRoutes(login.userType).LOGIN,
        method: "POST",
        body: login,
        headers: getAdminPanelHeaders(),
      }),
    }),

    adminLogin: builder.mutation({
      query: (login) => ({
        url: API_ROUTES.AUTH.LOGIN,
        method: "POST",
        body: login,
        headers: getAdminPanelHeaders(),
      }),
    }),

    registerCareHome: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.AUTH.CARE_HOME.REGISTER,
        method: 'POST',
        body,
        headers: getAdminPanelHeaders(),
      }),
    }),

    registerHospital: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.AUTH.HOSPITAL.REGISTER,
        method: 'POST',
        body,
        headers: getAdminPanelHeaders(),
      }),
    }),

    registerLocalAuthority: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.AUTH.LOCAL_AUTHORITY.REGISTER,
        method: 'POST',
        body,
        headers: getAdminPanelHeaders(),
      }),
    }),

    registerUser: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.AUTH.USER.REGISTER,
        method: 'POST',
        body,
        headers: getAdminPanelHeaders(),
      }),
    }),

    registerAgency: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.AUTH.AGENCY.REGISTER,
        method: 'POST',
        body,
        headers: getAdminPanelHeaders(),
      }),
    }),

    registerHomeCareCompany: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.AUTH.HOME_CARE_COMPANY.REGISTER,
        method: 'POST',
        body,
        headers: getAdminPanelHeaders(),
      }),
    }),

    registerNurse: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.AUTH.NURSE.REGISTER,
        method: 'POST',
        body,
        headers: getAdminPanelHeaders(),
      }),
    }),

    verifyEmailOtp: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.AUTH.VERIFY_OTP_EMAIL,
        method: 'POST',
        body,
        headers: getAdminPanelHeaders(),
      }),
    }),

    /** POST /admin/auth/verify-otp/email */
    adminVerifyEmailOtp: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.AUTH.ADMIN.VERIFY_OTP_EMAIL,
        method: 'POST',
        body,
        headers: getAdminPanelHeaders(),
      }),
    }),

    resendEmailOtp: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.AUTH.RESEND_OTP_EMAIL,
        method: 'POST',
        body,
        headers: getAdminPanelHeaders(),
      }),
    }),

    /** POST /admin/auth/resend-otp/email */
    adminResendEmailOtp: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.AUTH.ADMIN.RESEND_OTP_EMAIL,
        method: 'POST',
        body,
        headers: getAdminPanelHeaders(),
      }),
    }),

    forgotPassword: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.AUTH.FORGOT_PASSWORD,
        method: 'POST',
        body,
        headers: getAdminPanelHeaders(),
      }),
    }),

    resetPassword: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.AUTH.RESET_PASSWORD,
        method: 'POST',
        body,
        headers: getAdminPanelHeaders(),
      }),
    }),

    /** POST /admin/auth/reset-password — body: { email, newPassword, resetToken } */
    adminResetPassword: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.AUTH.ADMIN.RESET_PASSWORD,
        method: 'POST',
        body,
        headers: getAdminPanelHeaders(),
      }),
    }),

    socialAuth: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.AUTH.SOCIAL_AUTH,
        method: 'POST',
        body,
        headers: getAdminPanelHeaders(),
      }),
    }),

    /**
     * POST /auth/check-email-exists
     * Body: { email }
     * Response: { message, data: { exists: boolean } }
     */
    checkEmailExists: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.AUTH.CHECK_EMAIL_EXISTS,
        method: 'POST',
        body,
        headers: getAdminPanelHeaders(),
      }),
    }),

    /** POST /auth/logout — body: { deviceId } */
    logout: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.AUTH.LOGOUT,
        method: 'POST',
        body,
      }),
    }),

    /** DELETE /auth/delete-account */
    deleteAccount: builder.mutation({
      query: () => ({
        url: API_ROUTES.AUTH.DELETE_ACCOUNT,
        method: 'DELETE',
      }),
    }),

    /** POST /auth/change-password — body: { oldPassword, newPassword } */
    changePassword: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.AUTH.CHANGE_PASSWORD,
        method: 'POST',
        body,
      }),
    }),

    /** POST /admin/auth/change-password — body: { oldPassword, newPassword } */
    adminChangePassword: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.AUTH.ADMIN.CHANGE_PASSWORD,
        method: 'POST',
        body,
      }),
    }),
  })
});

export const {
  useLoginMutation,
  useAdminLoginMutation,
  useRegisterCareHomeMutation,
  useRegisterHospitalMutation,
  useRegisterLocalAuthorityMutation,
  useRegisterUserMutation,
  useRegisterAgencyMutation,
  useRegisterHomeCareCompanyMutation,
  useRegisterNurseMutation,
  useVerifyEmailOtpMutation,
  useAdminVerifyEmailOtpMutation,
  useResendEmailOtpMutation,
  useAdminResendEmailOtpMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useAdminResetPasswordMutation,
  useSocialAuthMutation,
  useCheckEmailExistsMutation,
  useLogoutMutation,
  useDeleteAccountMutation,
  useChangePasswordMutation,
  useAdminChangePasswordMutation,
} = authApi;
