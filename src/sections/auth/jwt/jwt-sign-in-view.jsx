import { z as zod } from 'zod';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';

import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';

import { Logo } from 'src/components/logo';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Field, Form } from 'src/components/hook-form';
import { AppButton } from 'src/components/app-button';

import { setUser } from 'src/store/slices/userSlice';
import { setSession } from 'src/auth/context/jwt/utils';
import { resetAccountScopedState } from 'src/store/reset-role-api-caches';

import { CONFIG } from 'src/config-global';

import { handleApiError } from 'src/store/handleApiError';
import {
  useLoginMutation,
  useAdminLoginMutation,
  useSocialAuthMutation,
  useResendEmailOtpMutation,
} from 'src/store/Reducer/auth';

import {
  extractSignupOtp,
  isEmailVerificationPendingMessage,
  loadPreferredAuthRole,
  savePendingEmailVerification,
  savePreferredAuthRole,
} from './auth-flow-utils';
import {
  buildLoginPayload,
  normalizeLoginResponse,
  API_USER_TYPE_PERMISSION,
  ROLE_TO_API_USER_TYPE,
} from './auth-api-utils';
import { getAuthRoleOption, ADMIN_LOGIN_EMAIL } from './auth-role-options';
import { AuthSocialProviders } from './auth-social-providers';
import {
  authenticateWithGoogleSocial,
} from './social-auth-flow';
import { getPostLoginPath } from 'src/auth/utils/get-post-login-path';
import {
  PENDING_LOGIN_MESSAGE,
  canAccountLogin,
  getLoginBlockMessage,
} from 'src/sections/admin/shared/admin-account-status';

const SignInSchema = zod.object({
  email: zod
    .string()
    .trim()
    .min(1, { message: 'Email is required!' })
    .email({ message: 'Email must be a valid email address!' }),
  password: zod
    .string()
    .min(1, { message: 'Password is required!' })
    .min(6, { message: 'Password must be at least 6 characters!' }),
});

const ADMIN_PUBLIC_LOGIN_MESSAGE =
  'Admin accounts can only sign in from the admin login page.';

function isAdminIdentity({ email, user } = {}) {
  const normalizedEmail = String(email || user?.email || '')
    .trim()
    .toLowerCase();
  const userType = String(user?.accountState?.userType || user?.userType || '').toLowerCase();
  const accountType = String(user?.accountState?.accountType || user?.accountType || '').toLowerCase();
  const role = String(user?.role || user?.accountState?.role || '').toLowerCase();

  return (
    normalizedEmail === ADMIN_LOGIN_EMAIL ||
    userType === 'admin' ||
    accountType === 'admin' ||
    role === 'admin' ||
    Number(user?.permission) === API_USER_TYPE_PERMISSION.admin
  );
}

function resolveSignInRole({ isAdminMode, locationState }) {
  if (isAdminMode) return 'admin';

  const candidate = locationState?.role || loadPreferredAuthRole() || '';
  const option = getAuthRoleOption(candidate);

  if (option?.hasDashboard && option.value !== 'admin') {
    return option.value;
  }

  return '';
}

export function JwtSignInView({ mode = 'public' }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const location = useLocation();
  const isAdminMode = mode === 'admin';

  const password = useBoolean();

  const [loginError, setLoginError] = useState('');
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const [socialLoading, setSocialLoading] = useState(null);
  const [login] = useLoginMutation();
  const [adminLogin] = useAdminLoginMutation();
  const [socialAuth] = useSocialAuthMutation();
  const [resendEmailOtp, { isLoading: isStartingVerify }] = useResendEmailOtpMutation();

  const defaultValues = useMemo(
    () => ({
      email: isAdminMode ? ADMIN_LOGIN_EMAIL : location.state?.email || '',
      password: '',
    }),
    [isAdminMode, location.state?.email]
  );

  const methods = useForm({
    resolver: zodResolver(SignInSchema),
    defaultValues,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const {
    reset,
    setValue,
    getValues,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (isAdminMode) {
      setValue('email', ADMIN_LOGIN_EMAIL, { shouldValidate: true });
      setValue('password', '', { shouldValidate: false });
      return;
    }

    if (location.state?.email) {
      setValue('email', location.state.email, { shouldValidate: true });
    }
  }, [isAdminMode, location.state?.email, setValue]);

  const goTo = useCallback(
    (permission, selectedRoleValue, accountType) => {
      const returnTo = new URLSearchParams(location.search).get('returnTo') || '';
      const safeReturnTo =
        returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '';

      router.push(safeReturnTo || getPostLoginPath(permission, accountType || selectedRoleValue));
    },
    [location.search, router]
  );

  const completeLogin = useCallback(
    async (data) => {
      setLoginError('');
      setNeedsEmailVerification(false);

      const role = resolveSignInRole({
        isAdminMode,
        locationState: location.state,
      });
      const roleOption = getAuthRoleOption(role);
      const userType =
        (isAdminMode ? 'admin' : ROLE_TO_API_USER_TYPE[role] || roleOption?.apiUserType) || '';

      if (roleOption && !roleOption.hasDashboard) {
        toast.info(`${roleOption.label} dashboard is coming soon.`);
        return null;
      }

      const signInEmail = isAdminMode ? ADMIN_LOGIN_EMAIL : data.email;

      if (!isAdminMode && isAdminIdentity({ email: signInEmail })) {
        setLoginError(ADMIN_PUBLIC_LOGIN_MESSAGE);
        toast.error(ADMIN_PUBLIC_LOGIN_MESSAGE);
        return null;
      }

      try {
        const payload = buildLoginPayload({
          email: signInEmail,
          password: data.password,
          userType,
        });

        const response = await (isAdminMode ? adminLogin(payload) : login(payload)).unwrap();

        const user = normalizeLoginResponse(response, { fallbackUserType: userType });

        if (!isAdminMode && isAdminIdentity({ email: signInEmail, user })) {
          setLoginError(ADMIN_PUBLIC_LOGIN_MESSAGE);
          toast.error(ADMIN_PUBLIC_LOGIN_MESSAGE);
          return null;
        }

        if (!user?.token) {
          const message = 'Login failed: No authentication token received';
          setLoginError(message);
          toast.error(message);
          return null;
        }

        if (!canAccountLogin(user?.accountState?.status)) {
          const blockMessage =
            getLoginBlockMessage(user?.accountState?.status) || PENDING_LOGIN_MESSAGE;
          setLoginError(blockMessage);
          toast.error(blockMessage);
          if (isEmailVerificationPendingMessage(blockMessage)) {
            setNeedsEmailVerification(true);
          }
          return null;
        }

        await setSession(user.token);
        resetAccountScopedState(dispatch);
        dispatch(setUser(user));
        savePreferredAuthRole(user.accountState?.accountType || role);
        goTo(user.permission, role, user.accountState?.accountType);
        reset();
        return user;
      } catch (error) {
        const message = handleApiError(error);
        setLoginError(message);
        toast.error(message);
        if (isEmailVerificationPendingMessage(message)) {
          setNeedsEmailVerification(true);
        }
        return null;
      }
    },
    [adminLogin, dispatch, goTo, isAdminMode, location.state, login, reset]
  );

  const onSubmit = handleSubmit(async (data) => {
    await completeLogin(data);
  });

  const handleSocialSignIn = async () => {
    const clientId = String(CONFIG.google.clientId || '').trim();

    if (!clientId) {
      const message =
        'Google Client ID missing. Add VITE_GOOGLE_CLIENT_ID in .env, then restart the dev server.';
      setLoginError(message);
      toast.error(message);
      return;
    }

    const storedRole = resolveSignInRole({
      isAdminMode,
      locationState: location.state,
    });

    try {
      setSocialLoading('google');
      setLoginError('');
      setNeedsEmailVerification(false);

      const { user } = await authenticateWithGoogleSocial({
        socialAuthMutation: socialAuth,
        purpose: 'login',
      });

      if (!user?.token) {
        throw new Error('Login failed: No authentication token received.');
      }

      if (!isAdminMode && isAdminIdentity({ user })) {
        setLoginError(ADMIN_PUBLIC_LOGIN_MESSAGE);
        toast.error(ADMIN_PUBLIC_LOGIN_MESSAGE);
        return;
      }

      if (!canAccountLogin(user.accountState?.status)) {
        const blockMessage =
          getLoginBlockMessage(user.accountState?.status) || PENDING_LOGIN_MESSAGE;
        setLoginError(blockMessage);
        toast.error(blockMessage);
        if (isEmailVerificationPendingMessage(blockMessage)) {
          setNeedsEmailVerification(true);
        }
        return;
      }

      await setSession(user.token);
      resetAccountScopedState(dispatch);
      dispatch(setUser(user));
      const accountType = user.accountState?.accountType || storedRole;
      savePreferredAuthRole(accountType);
      toast.success('Signed in with Google');
      goTo(user.permission, accountType, accountType);
      reset();
    } catch (error) {
      console.error(error);
      const message = handleApiError(error);
      setLoginError(message);
      if (isEmailVerificationPendingMessage(message)) {
        setNeedsEmailVerification(true);
      }
      toast.error(message);
    } finally {
      setSocialLoading(null);
    }
  };

  const handleStartEmailVerify = useCallback(async () => {
    const email = String(getValues('email') || '')
      .trim()
      .toLowerCase();

    if (!email) {
      toast.error('Enter your email first, then tap Verify.');
      return;
    }

    const role = resolveSignInRole({
      isAdminMode,
      locationState: location.state,
    });
    const verifyRole = role === 'care_home' ? 'staff_member' : role;

    try {
      const response = await resendEmailOtp({ email }).unwrap();
      const otpFromServer = extractSignupOtp(response);

      savePendingEmailVerification({
        email,
        devOtp: otpFromServer,
        role: verifyRole,
        fromLogin: true,
      });

      toast.success(response?.message || 'Verification code sent to your email.');
      router.push(paths.auth.jwt.verifyEmail, {
        state: {
          email,
          role: verifyRole,
          fromLogin: true,
          devOtp: otpFromServer,
        },
      });
    } catch (error) {
      savePendingEmailVerification({
        email,
        role: verifyRole,
        fromLogin: true,
      });
      toast.error(handleApiError(error));
      router.push(paths.auth.jwt.verifyEmail, {
        state: { email, role: verifyRole, fromLogin: true },
      });
    }
  }, [getValues, isAdminMode, location.state, resendEmailOtp, router]);

  const renderLogo = (
    <Stack alignItems="center" sx={{ mb: 1.75 }}>
      <Logo width={84} height={68} />
    </Stack>
  );

  const renderHead = (
    <Stack alignItems="center" spacing={2} sx={{ mb: 2.25 }}>
      <Typography variant="h5">{isAdminMode ? 'Admin Login' : 'Login'}</Typography>
    </Stack>
  );

  const renderFormFields = (
    <Stack spacing={2}>
      <Field.Text
        name="email"
        label="Email"
        InputLabelProps={{ shrink: true }}
        disabled={isAdminMode}
        InputProps={isAdminMode ? { readOnly: true } : undefined}
      />

      <Stack spacing={1}>
        <Field.Text
          name="password"
          label="Password"
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

        <Link
          component={RouterLink}
          href={isAdminMode ? paths.auth.jwt.adminForgetPassword : paths.auth.jwt.forgetPassword}
          variant="body2"
          color="primary"
          sx={{ alignSelf: 'flex-end' }}
        >
          {isAdminMode ? 'Change password' : 'Forgot password?'}
        </Link>
      </Stack>
    </Stack>
  );

  const renderActions = (
    <Stack spacing={1.5} sx={{ mt: 2.25 }}>
      <AppButton fullWidth type="submit" loading={isSubmitting} loadingIndicator="Logging in...">
        Log in
      </AppButton>

      {!!loginError && (
        <Stack spacing={1.25} alignItems="center">
          <Typography variant="body2" sx={{ color: 'error.main', textAlign: 'center' }}>
            {loginError}
          </Typography>

          {needsEmailVerification && !isAdminMode ? (
            <AppButton
              fullWidth
              type="button"
              color="primary"
              variant="outlined"
              loading={isStartingVerify}
              loadingIndicator="Sending code..."
              onClick={handleStartEmailVerify}
            >
              Verify
            </AppButton>
          ) : null}
        </Stack>
      )}

      {!isAdminMode && (
        <>
          <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
            {`Don't have an account?`}
          </Typography>

          <Link
            component={RouterLink}
            href={paths.auth.jwt.signUp}
            variant="subtitle2"
            color="primary"
            sx={{ alignSelf: 'center' }}
          >
            Sign up
          </Link>

          <AuthSocialProviders
            embedded
            dividerLabel="Or continue with"
            googleLabel="Continue with Google"
            onGoogleClick={handleSocialSignIn}
            loadingProvider={socialLoading}
          />
        </>
      )}
    </Stack>
  );

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      {renderLogo}

      {renderHead}

      {renderFormFields}
      {renderActions}
    </Form>
  );
}
