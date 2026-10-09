import { z as zod } from 'zod';
import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isValidPhoneNumber } from 'react-phone-number-input/input';
import { useLocation } from 'react-router-dom';

import { useDispatch } from 'react-redux';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import Grid from '@mui/material/Unstable_Grid2';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';

import { Logo } from 'src/components/logo';
import { AppButton } from 'src/components/app-button';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

import { CONFIG } from 'src/config-global';
import { handleApiError } from 'src/store/handleApiError';
import {
  useCheckEmailExistsMutation,
  useRegisterAgencyMutation,
  useRegisterCareHomeMutation,
  useRegisterHomeCareCompanyMutation,
  useRegisterHospitalMutation,
  useRegisterLocalAuthorityMutation,
  useRegisterNurseMutation,
  useRegisterUserMutation,
  useResendEmailOtpMutation,
  useSocialAuthMutation,
  useVerifyEmailOtpMutation,
} from 'src/store/Reducer/auth';
import { setUser } from 'src/store/slices/userSlice';
import { resetAccountScopedState } from 'src/store/reset-role-api-caches';
import { setSession } from 'src/auth/context/jwt/utils';
import { getPostLoginPath } from 'src/auth/utils/get-post-login-path';
import {
  PENDING_LOGIN_MESSAGE,
  canAccountLogin,
  getLoginBlockMessage,
} from 'src/sections/admin/shared/admin-account-status';
import {
  buildCareHomeRegisterPayload,
  buildIndividualHomeCareRegisterPayload,
  buildNurseRegisterPayload,
  buildSupplierRegisterPayload,
  SUPPLIER_BUSINESS_TYPE_OPTIONS,
} from './care-home-register-utils';
import {
  applyServerOtpToForm,
  clearPendingEmailVerification,
  extractSignupOtp,
  savePendingEmailVerification,
  savePreferredAuthRole,
} from './auth-flow-utils';
import { parseEmailExistsResponse } from './auth-api-utils';
import { OtpPreviewAlert } from './otp-preview-alert';
import {
  AUTH_SIGNUP_ROLE_OPTIONS,
  AUTH_SIGNUP_ROLE_VALUES,
  getAuthRoleOption,
  isIndividualHomeCareSignupRole,
  isOrganizationCustomerSignupRole,
  isOrganizationSupplierSignupRole,
  isStaffMemberSignupRole,
} from './auth-role-options';
import { AuthRoleSelect } from './auth-role-select';
import { AuthSocialProviders } from './auth-social-providers';
import {
  authenticateWithGoogleSocial,
} from './social-auth-flow';
import { ROLE_TO_API_USER_TYPE } from './auth-api-utils';

const BUSINESS_TYPES = SUPPLIER_BUSINESS_TYPE_OPTIONS;

/** Demo signup: skip API and walk through OTP → documents for client preview */
const DEMO_SIGNUP_FLOW = false;
const DEMO_SIGNUP_OTP = '123456';

const GENDER_OPTIONS = ['Male', 'Female', 'Other'];

const INDIVIDUAL_DOCUMENT_FIELDS = [
  {
    name: 'governmentId',
    title: 'Government Issued ID',
    description: 'Upload government issued id.',
  },
  {
    name: 'nursingDegree',
    title: 'Nursing Degree / Diploma',
    description: 'Upload nursing degree / diploma',
  },
  {
    name: 'certifications',
    title: 'Certifications (BLS, ACLS, First Aid)',
    description: 'Upload certifications (BLS, ACLS, First Aid)',
  },
];

export const SignUpSchema = zod
  .object({
    role: zod
      .string()
      .min(1, { message: 'Please select a role' })
      .refine((value) => AUTH_SIGNUP_ROLE_VALUES.includes(value), {
        message: 'Please select a role',
      }),
    companyLogo: zod.any().optional(),
    companyName: zod.string().trim().optional(),
    registrationNumber: zod.string().trim().optional(),
    contactName: zod.string().trim().optional(),
    email: zod
      .string()
      .trim()
      .min(1, { message: 'Email is required!' })
      .email({ message: 'Email must be a valid email address!' }),
    careHomeType: zod.string().optional(),
    businessType: zod.string().optional(),
    address: zod.string().trim().optional(),
    city: zod.string().trim().min(1, { message: 'City is required!' }),
    country: zod.string().trim().min(1, { message: 'Country is required!' }),
    postalCode: zod.string().trim().min(1, { message: 'Postal code is required!' }),
    dob: zod.any().optional(),
    gender: zod.string().optional(),
    taxNumber: zod.string().optional(),
    phoneNumber: schemaHelper.phoneNumber({ isValidPhoneNumber }),
    password: zod
      .string()
      .min(1, { message: 'Password is required!' })
      .refine(
        (value) =>
          value.length >= 8 &&
          /[A-Z]/.test(value) &&
          /[0-9]/.test(value) &&
          /[^A-Za-z0-9]/.test(value),
        {
          message:
            'Password must be at least 8 characters and include 1 uppercase letter, 1 number, and 1 special character (e.g. !@#$%).',
        }
      ),
    confirmPassword: zod.string().optional(),
    documents: zod.array(zod.any()).optional(),
    governmentId: zod.array(zod.any()).optional(),
    nursingDegree: zod.array(zod.any()).optional(),
    certifications: zod.array(zod.any()).optional(),
    otp: zod.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.confirmPassword?.trim()) {
      ctx.addIssue({
        code: zod.ZodIssueCode.custom,
        message: 'Confirm password is required!',
        path: ['confirmPassword'],
      });
    } else if (data.confirmPassword !== data.password) {
      ctx.addIssue({
        code: zod.ZodIssueCode.custom,
        message: 'Passwords do not match!',
        path: ['confirmPassword'],
      });
    }

    if (isOrganizationCustomerSignupRole(data.role)) {
      if (!data.companyName?.trim()) {
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          message: 'Company/Organization name is required!',
          path: ['companyName'],
        });
      }

      if (!data.contactName?.trim()) {
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          message: 'Contact name is required!',
          path: ['contactName'],
        });
      }

      if (!data.address?.trim()) {
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          message: 'Address is required!',
          path: ['address'],
        });
      }

      if (!data.registrationNumber?.trim()) {
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          message: 'Registration number is required!',
          path: ['registrationNumber'],
        });
      } else if (data.registrationNumber.trim().length < 3) {
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          message: 'Registration number must be at least 3 characters!',
          path: ['registrationNumber'],
        });
      }
    }

    if (isIndividualHomeCareSignupRole(data.role) || isStaffMemberSignupRole(data.role)) {
      if (!data.contactName?.trim()) {
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          message: 'Full name is required!',
          path: ['contactName'],
        });
      }

      if (!data.address?.trim()) {
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          message: 'Address is required!',
          path: ['address'],
        });
      }

      // Gender required for individual home care (customer); optional for nurses (supplier)
      if (isIndividualHomeCareSignupRole(data.role) && !data.gender?.trim()) {
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          message: 'Gender is required!',
          path: ['gender'],
        });
      }

      if (isStaffMemberSignupRole(data.role) && !data.taxNumber?.trim()) {
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          message: 'Tax number is required!',
          path: ['taxNumber'],
        });
      }
    }

    if (isOrganizationSupplierSignupRole(data.role)) {
      if (!data.companyName?.trim()) {
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          message: 'Company/Organization name is required!',
          path: ['companyName'],
        });
      }

      if (!data.contactName?.trim()) {
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          message: 'Contact name is required!',
          path: ['contactName'],
        });
      }

      if (!data.address?.trim()) {
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          message: 'Address is required!',
          path: ['address'],
        });
      }

      // Business type is agency-only (not home care company)
      if (data.role === 'agency' && !data.businessType) {
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          message: 'Business type is required!',
          path: ['businessType'],
        });
      }

      if (!data.registrationNumber?.trim()) {
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          message: 'Registration number is required!',
          path: ['registrationNumber'],
        });
      } else if (data.registrationNumber.trim().length < 3) {
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          message: 'Registration number must be at least 3 characters!',
          path: ['registrationNumber'],
        });
      }
    }
  });


const defaultValues = {
  role: '',
  companyLogo: null,
  companyName: '',
  registrationNumber: '',
  contactName: '',
  email: '',
  careHomeType: 'residentialCareHome',
  businessType: '',
  address: '',
  city: '',
  country: '',
  postalCode: '',
  dob: null,
  gender: '',
  phoneNumber: '',
  password: '',
  confirmPassword: '',
  taxNumber: '',
  documents: [],
  governmentId: [],
  nursingDegree: [],
  certifications: [],
  otp: '',
};

export function JwtSignUpView() {
  const router = useRouter();
  const location = useLocation();
  const dispatch = useDispatch();

  const password = useBoolean();
  const confirmPassword = useBoolean();

  const [errorMsg, setErrorMsg] = useState('');
  const [socialLoading, setSocialLoading] = useState(null);
  const [linkedSocialProfile, setLinkedSocialProfile] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [devOtp, setDevOtp] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerCareHome] = useRegisterCareHomeMutation();
  const [registerHospital] = useRegisterHospitalMutation();
  const [registerLocalAuthority] = useRegisterLocalAuthorityMutation();
  const [registerUser] = useRegisterUserMutation();
  const [registerAgency] = useRegisterAgencyMutation();
  const [registerHomeCareCompany] = useRegisterHomeCareCompanyMutation();
  const [registerNurse] = useRegisterNurseMutation();
  const [checkEmailExists] = useCheckEmailExistsMutation();
  const [verifyEmailOtp, { isLoading: isVerifyingOtp }] = useVerifyEmailOtpMutation();
  const [resendEmailOtp, { isLoading: isResendingOtp }] = useResendEmailOtpMutation();
  const [socialAuth] = useSocialAuthMutation();

  const methods = useForm({
    resolver: zodResolver(SignUpSchema),
    defaultValues,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const {
    watch,
    getValues,
    setValue,
    trigger,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const role = watch('role');
  const documents = watch('documents');
  const hasDocumentStep =
    isOrganizationCustomerSignupRole(role) ||
    isIndividualHomeCareSignupRole(role) ||
    isStaffMemberSignupRole(role);

  useEffect(() => {
    setActiveStep(0);
    setDevOtp('');
    setValue('otp', '');
    if (role !== 'agency') {
      setValue('businessType', '');
    }
  }, [role, setValue]);

  const getStepOneFields = useCallback(() => {
    if (isOrganizationCustomerSignupRole(role)) {
      return [
        'companyName',
        'registrationNumber',
        'address',
        'city',
        'country',
        'postalCode',
        'contactName',
        'phoneNumber',
        'email',
        'password',
        'confirmPassword',
      ];
    }

    if (isIndividualHomeCareSignupRole(role) || isStaffMemberSignupRole(role)) {
      return [
        'contactName',
        'address',
        'city',
        'country',
        'postalCode',
        'phoneNumber',
        ...(isIndividualHomeCareSignupRole(role) ? ['gender'] : []),
        ...(isStaffMemberSignupRole(role) ? ['taxNumber'] : []),
        'email',
        'password',
        'confirmPassword',
      ];
    }

    return [
      'companyName',
      ...(role === 'agency' ? ['businessType'] : []),
      'registrationNumber',
      'address',
      'city',
      'country',
      'postalCode',
      'contactName',
      'phoneNumber',
      'email',
      'password',
      'confirmPassword',
    ];
  }, [role]);

  const handleBackStep = useCallback(() => {
    setErrorMsg('');
    setActiveStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const applySocialProfile = useCallback(
    (profile) => {
      if (!profile?.email) return;

      setValue('email', profile.email, { shouldValidate: true });

      const fullName =
        profile.name || [profile.firstName, profile.lastName].filter(Boolean).join(' ');

      if (fullName) {
        setValue('contactName', fullName, { shouldValidate: true });
      }
    },
    [setValue]
  );

  const buildSignupSocialAuth = useCallback(
    () =>
      linkedSocialProfile
        ? {
          provider: linkedSocialProfile.provider,
          socialId: linkedSocialProfile.socialId,
          profileIcon: linkedSocialProfile.profileIcon,
        }
        : undefined,
    [linkedSocialProfile]
  );

  const ensureEmailAvailableForSignup = useCallback(
    async (email) => {
      const normalized = String(email || '')
        .trim()
        .toLowerCase();
      if (!normalized) return true;

      try {
        const response = await checkEmailExists({ email: normalized }).unwrap();
        const exists = parseEmailExistsResponse(response);

        if (exists === true) {
          // Prefer backend message when present; otherwise let register API return the error text
          const message =
            (typeof response?.message === 'string' && response.message.trim()) ||
            (typeof response?.data?.message === 'string' && response.data.message.trim()) ||
            '';

          if (message) {
            setErrorMsg(message);
            toast.error(message);
            return false;
          }
        }

        // exists === false/null, or exists without message → register validates duplicates
        return true;
      } catch {
        // Don't block signup if check API fails — register will still catch duplicates
        return true;
      }
    },
    [checkEmailExists]
  );

  const registerAccount = useCallback(async () => {
    const data = getValues();
    const roleOption = getAuthRoleOption(data.role);

    if (!roleOption || roleOption.value === 'admin') {
      throw new Error('This role cannot sign up from here.');
    }

    const socialAuth = buildSignupSocialAuth();
    const registerMutations = {
      care_home: registerCareHome,
      hospital_nhs: registerHospital,
      local_authority: registerLocalAuthority,
      individual_home_care: registerUser,
      agency: registerAgency,
      home_care_company: registerHomeCareCompany,
      staff_member: registerNurse,
    };
    const registerMutation = registerMutations[data.role];

    if (!registerMutation) {
      throw new Error('Unsupported role for registration.');
    }

    let payload;

    if (isOrganizationCustomerSignupRole(data.role)) {
      payload = buildCareHomeRegisterPayload(data, {
        userType: roleOption.apiUserType,
        socialAuth,
      });
    } else if (isIndividualHomeCareSignupRole(data.role)) {
      payload = buildIndividualHomeCareRegisterPayload(data, {
        userType: roleOption.apiUserType,
        socialAuth,
      });
    } else if (isStaffMemberSignupRole(data.role)) {
      payload = buildNurseRegisterPayload(data, {
        userType: roleOption.apiUserType,
        socialAuth,
      });
    } else if (isOrganizationSupplierSignupRole(data.role)) {
      payload = buildSupplierRegisterPayload(data, {
        userType: roleOption.apiUserType,
        socialAuth,
      });
    }

    if (!payload) {
      throw new Error('Unsupported role for registration.');
    }

    return registerMutation(payload).unwrap();
  }, [
    buildSignupSocialAuth,
    getValues,
    registerAgency,
    registerCareHome,
    registerHomeCareCompany,
    registerHospital,
    registerLocalAuthority,
    registerNurse,
    registerUser,
  ]);

  const handleNextStep = useCallback(async () => {
    setErrorMsg('');
    const isValid = await trigger(getStepOneFields());
    if (!isValid) {
      toast.error('Please complete the required fields before continuing.');
      return;
    }

    setIsRegistering(true);

    try {
      if (DEMO_SIGNUP_FLOW) {
        await new Promise((resolve) => setTimeout(resolve, 600));

        const email = getValues('email').trim().toLowerCase();

        applyServerOtpToForm({ otp: DEMO_SIGNUP_OTP, setDevOtp, setValue });
        const role = getValues('role');
        savePendingEmailVerification({ email, devOtp: DEMO_SIGNUP_OTP, role });
        setActiveStep(1);
        return;
      }

      const email = getValues('email').trim().toLowerCase();
      const canContinue = await ensureEmailAvailableForSignup(email);
      if (!canContinue) return;

      const response = await registerAccount();
      const role = getValues('role');
      const otpFromServer = extractSignupOtp(response);
      const visibleOtp = applyServerOtpToForm({ otp: otpFromServer, setDevOtp, setValue });

      savePendingEmailVerification({ email, devOtp: otpFromServer, role });

      toast.success(
        visibleOtp
          ? 'Account created! Enter the OTP on the next screen.'
          : 'Account created! Check your email for the OTP.'
      );

      setActiveStep(1);
    } catch (error) {
      console.error(error);
      const message = handleApiError(error);
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setIsRegistering(false);
    }
  }, [ensureEmailAvailableForSignup, getStepOneFields, getValues, registerAccount, setValue, trigger]);

  const handleVerifyOtp = useCallback(async () => {
    setErrorMsg('');

    const otp = getValues('otp')?.trim() || '';
    const email = getValues('email')?.trim().toLowerCase() || '';

    if (!/^[0-9]{4,6}$/.test(otp)) {
      setErrorMsg('Please enter a valid 4-6 digit OTP.');
      return;
    }

    try {
      if (DEMO_SIGNUP_FLOW) {
        if (otp !== DEMO_SIGNUP_OTP) {
          setErrorMsg(`Invalid OTP. OTP is ${DEMO_SIGNUP_OTP}.`);
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 400));
        clearPendingEmailVerification();
        toast.success('Email verified! Upload your documents to finish.');
        setActiveStep(2);
        return;
      }

      const response = await verifyEmailOtp({ email, otp }).unwrap();

      clearPendingEmailVerification();
      toast.success(response?.message || 'Email verified! Upload your documents to finish.');
      setActiveStep(2);
    } catch (error) {
      console.error(error);
      const message = handleApiError(error);
      setErrorMsg(message);
      toast.error(message);
    }
  }, [getValues, verifyEmailOtp]);

  const handleResendOtp = useCallback(async () => {
    setErrorMsg('');

    const email = getValues('email')?.trim().toLowerCase() || '';

    if (!email) {
      setErrorMsg('Email is required to resend OTP.');
      return;
    }

    try {
      if (DEMO_SIGNUP_FLOW) {
        applyServerOtpToForm({ otp: DEMO_SIGNUP_OTP, setDevOtp, setValue });
        toast.success('OTP resent.');
        return;
      }

      const response = await resendEmailOtp({ email }).unwrap();
      const otpFromServer = extractSignupOtp(response);

      applyServerOtpToForm({ otp: otpFromServer, setDevOtp, setValue });
      savePendingEmailVerification({
        email,
        devOtp: otpFromServer,
        role: getValues('role'),
      });

      toast.success(response?.message || 'OTP resent to your email.');
    } catch (error) {
      console.error(error);
      const message = handleApiError(error);
      setErrorMsg(message);
      toast.error(message);
    }
  }, [getValues, resendEmailOtp, setValue]);

  useEffect(() => {
    const googleProfile = location.state?.googleProfile;
    if (googleProfile) {
      applySocialProfile(googleProfile);
      setLinkedSocialProfile({
        provider: 'google',
        socialId: googleProfile.socialId,
        profileIcon: googleProfile.profileIcon,
        email: googleProfile.email,
      });
      toast.info('Google account linked. Complete the remaining details to sign up.');
    }
  }, [applySocialProfile, location.state?.googleProfile]);

  const handleRemoveDocument = useCallback(
    (fieldName) => (inputFile) => {
      const current = getValues(fieldName) || [];
      setValue(
        fieldName,
        current.filter((file) => file !== inputFile),
        { shouldValidate: true }
      );
    },
    [getValues, setValue]
  );

  const handleGoogleSignUp = async () => {
    const clientId = String(CONFIG.google.clientId || '').trim();

    if (!clientId) {
      const message =
        'Google Client ID missing. Add VITE_GOOGLE_CLIENT_ID in .env, then restart the dev server.';
      setErrorMsg(message);
      toast.error(message);
      return;
    }

    const selectedRole = getValues('role');
    const roleValid = await trigger('role');
    const roleOption = getAuthRoleOption(selectedRole);

    if (!roleValid || !selectedRole || !roleOption || roleOption.value === 'admin') {
      const message = 'Select a role before continuing with Google.';
      setErrorMsg(message);
      toast.error(message);
      return;
    }

    if (!roleOption.hasDashboard) {
      toast.info(`${roleOption.label} dashboard is coming soon.`);
      return;
    }

    try {
      setSocialLoading('google');
      setErrorMsg('');

      const formValues = getValues();
      const { profile, user } = await authenticateWithGoogleSocial({
        socialAuthMutation: socialAuth,
        role: selectedRole,
        userType: ROLE_TO_API_USER_TYPE[selectedRole] || roleOption.apiUserType,
        location: {
          address: formValues.address,
          city: formValues.city,
          country: formValues.country,
          postalCode: formValues.postalCode,
        },
      });

      if (user?.token) {
        if (!canAccountLogin(user.accountState?.status)) {
          const message = getLoginBlockMessage(user.accountState?.status) || PENDING_LOGIN_MESSAGE;
          setErrorMsg(message);
          toast.error(message);
          return;
        }

        await setSession(user.token);
        resetAccountScopedState(dispatch);
        dispatch(setUser(user));
        savePreferredAuthRole(user.accountState?.accountType || selectedRole);
        toast.success('Signed in with Google');
        router.push(
          getPostLoginPath(user.permission, user.accountState?.accountType || selectedRole)
        );
        return;
      }

      applySocialProfile(profile);
      setLinkedSocialProfile({
        provider: 'google',
        socialId: profile.socialId,
        profileIcon: profile.profileIcon,
        email: profile.email,
      });
      toast.info('Google account linked. Please complete all required fields and sign up.');
    } catch (error) {
      console.error(error);

      const linkedProfile = error?.socialProfile;
      if (linkedProfile?.email) {
        applySocialProfile(linkedProfile);
        setLinkedSocialProfile({
          provider: 'google',
          socialId: linkedProfile.socialId,
          profileIcon: linkedProfile.profileIcon,
          email: linkedProfile.email,
        });
        toast.info('Google account linked. Please complete all required fields and sign up.');
        return;
      }

      const message = handleApiError(error);
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setSocialLoading(null);
    }
  };

  const onSubmit = handleSubmit(
    async (data) => {
      setErrorMsg('');

      const roleOption = getAuthRoleOption(data.role);

      if (!roleOption || roleOption.value === 'admin') {
        setErrorMsg('This role cannot sign up from here.');
        return;
      }

      try {
        if (hasDocumentStep) {
          if (activeStep !== 2) {
            return;
          }

          savePreferredAuthRole(data.role);
          toast.success('Sign up complete! You can now log in.');
          router.push(paths.auth.jwt.signIn, {
            state: { email: data.email.trim().toLowerCase(), role: data.role },
          });
          return;
        }

        if (isOrganizationSupplierSignupRole(data.role)) {
          const email = data.email.trim().toLowerCase();
          const canContinue = await ensureEmailAvailableForSignup(email);
          if (!canContinue) return;

          const response = await registerAccount();
          const otpFromServer = extractSignupOtp(response);

          savePendingEmailVerification({ email, devOtp: otpFromServer, role: data.role });
          toast.success(`${roleOption.label} account created! Please verify your email.`);
          router.push(paths.auth.jwt.verifyEmail, {
            state: {
              email,
              devOtp: otpFromServer,
              role: data.role,
            },
          });
          return;
        }
      } catch (error) {
        console.error(error);
        const message = handleApiError(error);
        setErrorMsg(message);
        toast.error(message);
      }
    },
    (errors) => {
      const firstError = Object.values(errors).find((error) => error?.message);
      const message = firstError?.message || 'Please complete all required fields.';

      setErrorMsg(message);
      toast.error(message);

      if (activeStep > 0) {
        setActiveStep(0);
      }
    }
  );

  const renderLogo = (
    <Stack alignItems="center" sx={{ mb: 3 }}>
      <Logo width={90} height={73} />
    </Stack>
  );

  const renderHead = (
    <Stack alignItems="center" spacing={2} sx={{ mb: hasDocumentStep ? 1.5 : 3 }}>
      <Typography variant="h4">Sign up</Typography>
      {(isIndividualHomeCareSignupRole(role) || isStaffMemberSignupRole(role)) && activeStep === 0 && (
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: -1 }}>
          Create your account
        </Typography>
      )}

      {activeStep === 0 && (
        <>
          <Stack spacing={1} sx={{ width: 1 }}>
            <AuthRoleSelect
              name="role"
              label="Select Role"
              options={AUTH_SIGNUP_ROLE_OPTIONS}
              placeholder="Select role"
              helperText="Choose your role first. Google sign-up uses this account type."
            />
          </Stack>

          <Box sx={{ display: 'flex', justifyContent: 'center', width: 1, pt: 0.5 }}>
            <Field.UploadAvatar
              name="companyLogo"
              sx={{
                width: 120,
                height: 120,
              }}
            />
          </Box>
        </>
      )}

      {hasDocumentStep && activeStep > 0 && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: 'center', mt: -0.5, mb: 2 }}
        >
          Step {activeStep} of 2 — {activeStep === 1 ? 'Verify email' : 'Documents'}
        </Typography>
      )}
    </Stack>
  );

  const renderPasswordField = (
    <Grid xs={12} sm={6}>
      <Field.Text
        name="password"
        label="Password"
        placeholder="8+ chars, uppercase, number & special char"

        type={password.value ? 'text' : 'password'}
        InputLabelProps={{ shrink: true }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={password.onToggle} edge="end">
                <Iconify icon={password.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
    </Grid>
  );

  const renderConfirmPasswordField = (
    <Grid xs={12} sm={6}>
      <Field.Text
        name="confirmPassword"
        label="Confirm Password"
        placeholder="Re-enter your password"
        type={confirmPassword.value ? 'text' : 'password'}
        InputLabelProps={{ shrink: true }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={confirmPassword.onToggle} edge="end">
                <Iconify icon={confirmPassword.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
    </Grid>
  );

  /** Shared by every role so Email / Password / Phone sit right after the name field. */
  const renderAccountFields = (
    <>
      <Grid xs={12} sm={6}>
        <Field.Text name="email" label="Email Address" InputLabelProps={{ shrink: true }} />
      </Grid>

      {renderPasswordField}

      {renderConfirmPasswordField}

      <Grid xs={12} sm={6}>
        <Field.Phone name="phoneNumber" label="Phone Number" />
      </Grid>
    </>
  );

  const renderCareHomeFields = (
    <Grid container spacing={2.5}>
      <Grid xs={12} sm={6}>
        <Field.Text
          name="companyName"
          label="Company/Organization Name"
          InputLabelProps={{ shrink: true }}
        />
      </Grid>

      {renderAccountFields}

      <Grid xs={12} sm={6}>
        <Field.Text
          name="registrationNumber"
          label="Registration Number"
          InputLabelProps={{ shrink: true }}
        />
      </Grid>

      <Grid xs={12} sm={6}>
        <Field.GoogleAddress name="address" label="Address" InputLabelProps={{ shrink: true }} />
      </Grid>

      <Grid xs={12} sm={6}>
        <Field.Text name="city" label="City" InputLabelProps={{ shrink: true }} />
      </Grid>

      <Grid xs={12} sm={6}>
        <Field.Text name="country" label="Country" InputLabelProps={{ shrink: true }} />
      </Grid>

      <Grid xs={12} sm={6}>
        <Field.Text
          name="postalCode"
          label="Postal code"
          InputLabelProps={{ shrink: true }}
        />
      </Grid>

      <Grid xs={12} sm={6}>
        <Field.Text name="contactName" label="Name of Contact" InputLabelProps={{ shrink: true }} />
      </Grid>
    </Grid>
  );

  const renderIndividualHomeCareFields = (
    <Grid container spacing={2.5}>
      <Grid xs={12} sm={6}>
        <Field.Text name="contactName" label="Full Name" InputLabelProps={{ shrink: true }} />
      </Grid>

      {renderAccountFields}

      <Grid xs={12} sm={6}>
        <Field.Select
          name="gender"
          label={
            isStaffMemberSignupRole(role) ? 'Gender (optional)' : 'Gender'
          }
          InputLabelProps={{ shrink: true }}
        >
          <MenuItem value="">Select gender</MenuItem>
          {GENDER_OPTIONS.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Field.Select>
      </Grid>

      <Grid xs={12} sm={6}>
        <Field.Text
          name="taxNumber"
          label={
            isStaffMemberSignupRole(role)
              ? 'National Insurance / Tax Number'
              : 'National Insurance / Tax Number (optional)'
          }
          InputLabelProps={{ shrink: true }}
        />
      </Grid>

      <Grid xs={12} sm={6}>
        <Field.GoogleAddress name="address" label="Address" InputLabelProps={{ shrink: true }} />
      </Grid>

      <Grid xs={12} sm={6}>
        <Field.Text name="city" label="City" InputLabelProps={{ shrink: true }} />
      </Grid>

      <Grid xs={12} sm={6}>
        <Field.Text name="country" label="Country" InputLabelProps={{ shrink: true }} />
      </Grid>

      <Grid xs={12} sm={6}>
        <Field.Text
          name="postalCode"
          label="Postal code"
          InputLabelProps={{ shrink: true }}
        />
      </Grid>

      <Grid xs={12} sm={6}>
        <Field.DatePicker name="dob" label="Date of birth (optional)" />
      </Grid>
    </Grid>
  );

  const renderAgencyFields = (
    <Grid container spacing={2.5}>
      <Grid xs={12} sm={6}>
        <Field.Text
          name="companyName"
          label="Company/Organization Name"
          InputLabelProps={{ shrink: true }}
        />
      </Grid>

      {renderAccountFields}

      <Grid xs={12} sm={6}>
        <Field.Text
          name="registrationNumber"
          label="Registration Number"
          InputLabelProps={{ shrink: true }}
        />
      </Grid>

      {role === 'agency' ? (
        <Grid xs={12} sm={6}>
          <Field.Select name="businessType" label="Business Type" InputLabelProps={{ shrink: true }}>
            <MenuItem value="">Select type</MenuItem>
            {BUSINESS_TYPES.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </Field.Select>
        </Grid>
      ) : null}

      <Grid xs={12} sm={6}>
        <Field.GoogleAddress name="address" label="Address" InputLabelProps={{ shrink: true }} />
      </Grid>

      <Grid xs={12} sm={6}>
        <Field.Text name="city" label="City" InputLabelProps={{ shrink: true }} />
      </Grid>

      <Grid xs={12} sm={6}>
        <Field.Text name="country" label="Country" InputLabelProps={{ shrink: true }} />
      </Grid>

      <Grid xs={12} sm={6}>
        <Field.Text
          name="postalCode"
          label="Postal code"
          InputLabelProps={{ shrink: true }}
        />
      </Grid>

      <Grid xs={12} sm={6}>
        <Field.Text name="contactName" label="Name of Contact" InputLabelProps={{ shrink: true }} />
      </Grid>
    </Grid>
  );

  const renderFormFields =
    isIndividualHomeCareSignupRole(role) || isStaffMemberSignupRole(role)
      ? renderIndividualHomeCareFields
      : isOrganizationCustomerSignupRole(role)
        ? renderCareHomeFields
        : renderAgencyFields;

  const renderOtpStep = (
    <Stack spacing={2.5} sx={{ mt: 1 }}>
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
        Enter the OTP sent to{' '}
        <Typography component="span" variant="body2" fontWeight={600} color="text.primary">
          {watch('email')}
        </Typography>
      </Typography>

      <OtpPreviewAlert otp={devOtp} />

      <Field.Text
        name="otp"
        label="OTP"
        placeholder="Enter OTP"
        InputLabelProps={{ shrink: true }}
        inputProps={{ maxLength: 6, inputMode: 'numeric', pattern: '[0-9]*' }}
      />

      <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center">
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {`Didn't receive the OTP?`}
        </Typography>
        <Link
          component="button"
          type="button"
          variant="subtitle2"
          disabled={isResendingOtp}
          onClick={handleResendOtp}
          sx={{ cursor: isResendingOtp ? 'default' : 'pointer' }}
        >
          {isResendingOtp ? 'Sending...' : 'Resend OTP'}
        </Link>
      </Stack>
    </Stack>
  );

  const renderIndividualDocuments = (
    <Stack spacing={2} sx={{ mt: 1 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
        Documents Required
      </Typography>
      <Typography variant="body2" color="text.secondary">
        You can upload these now or skip and complete later.
      </Typography>

      {INDIVIDUAL_DOCUMENT_FIELDS.map((item) => (
        <Card
          key={item.name}
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 2,
            borderColor: 'divider',
            boxShadow: (theme) => theme.customShadows?.z1,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {item.title}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            {item.description}
          </Typography>

          <Field.Upload
            multiple
            thumbnail
            name={item.name}
            maxSize={5242880}
            onRemove={handleRemoveDocument(item.name)}
            sx={{
              '& .upload-placeholder': {
                borderStyle: 'dashed',
              },
            }}
          />
        </Card>
      ))}
    </Stack>
  );

  const renderBusinessDocuments = (
    <Stack spacing={1.5} sx={{ mt: 1 }}>
      <Typography variant="subtitle2">Business Verification Documents (optional)</Typography>
      <Typography variant="body2" color="text.secondary">
        Upload verification documents for your business, then complete signup.
      </Typography>

      <Field.Upload
        multiple
        thumbnail
        name="documents"
        maxSize={5242880}
        onRemove={(inputFile) =>
          setValue(
            'documents',
            (documents || []).filter((file) => file !== inputFile),
            { shouldValidate: true }
          )
        }
        onRemoveAll={() => setValue('documents', [], { shouldValidate: true })}
      />
    </Stack>
  );

  const renderStepActions = (
    <Stack spacing={2} sx={{ mt: 4 }}>
      {hasDocumentStep && activeStep === 0 && (
        <AppButton fullWidth type="button" loading={isRegistering} loadingIndicator="Creating account..." onClick={handleNextStep}>
          Next
        </AppButton>
      )}

      {hasDocumentStep && activeStep === 1 && (
        <>
          <AppButton
            fullWidth
            type="button"
            loading={isVerifyingOtp}
            loadingIndicator="Verifying..."
            onClick={handleVerifyOtp}
          >
            Verify OTP
          </AppButton>

          <AppButton fullWidth type="button" variant="outlined" color="inherit" onClick={handleBackStep}>
            Back
          </AppButton>
        </>
      )}

      {hasDocumentStep && activeStep === 2 && (
        <>
          <AppButton
            fullWidth
            type="submit"
            loading={isSubmitting}
            loadingIndicator="Completing signup..."
          >
            Complete sign up
          </AppButton>

          <AppButton fullWidth type="button" variant="outlined" color="inherit" onClick={handleBackStep}>
            Back
          </AppButton>
        </>
      )}

      {!hasDocumentStep && (
        <AppButton
          fullWidth
          type="submit"
          loading={isSubmitting}
          loadingIndicator="Signing up..."
        >
          Sign up
        </AppButton>
      )}

      <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
        Already have an account?
      </Typography>

      <Link
        component={RouterLink}
        href={paths.auth.jwt.signIn}
        variant="subtitle2"
        color="primary"
        sx={{ alignSelf: 'center' }}
      >
        Log in
      </Link>

      {activeStep === 0 && (
        <AuthSocialProviders
          embedded
          dividerLabel="Or sign up with"
          googleLabel="Continue with Google"
          onGoogleClick={handleGoogleSignUp}
          loadingProvider={socialLoading}
          disabled={!role}
        />
      )}
    </Stack>
  );

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      {renderLogo}

      {renderHead}

      {!!errorMsg && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMsg}
        </Alert>
      )}

      {!!linkedSocialProfile && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Google account connected for <strong>{linkedSocialProfile.email}</strong>. Complete the
          form below to finish signup.
        </Alert>
      )}

      {(!hasDocumentStep || activeStep === 0) && renderFormFields}

      {hasDocumentStep && activeStep === 1 && renderOtpStep}
      {hasDocumentStep && activeStep === 2 && isOrganizationCustomerSignupRole(role) && renderBusinessDocuments}
      {hasDocumentStep &&
        activeStep === 2 &&
        (isIndividualHomeCareSignupRole(role) || isStaffMemberSignupRole(role)) &&
        renderIndividualDocuments}

      {renderStepActions}
    </Form>
  );
}
