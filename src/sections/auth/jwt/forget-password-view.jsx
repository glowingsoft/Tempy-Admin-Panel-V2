import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z as zod } from 'zod';

import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { RouterLink } from 'src/routes/components';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

import { Logo } from 'src/components/logo';
import { AppButton } from 'src/components/app-button';
import { Iconify } from 'src/components/iconify';
import { Field, Form } from 'src/components/hook-form';
import { toast } from 'src/components/snackbar';

import { handleApiError } from 'src/store/handleApiError';
import {
  useAdminResendEmailOtpMutation,
  useForgotPasswordMutation,
} from 'src/store/Reducer/auth';

import {
  extractResetToken,
  extractSignupOtp,
  resolveOtpForScreen,
} from './auth-flow-utils';
import { ADMIN_LOGIN_EMAIL } from './auth-role-options';

// ----------------------------------------------------------------------

export const ForgetPasswordSchema = zod.object({
  email: zod
    .string()
    .trim()
    .min(1, { message: 'Email is required!' })
    .email({ message: 'Email must be a valid email address!' }),
});

// ----------------------------------------------------------------------

export function JwtForgetPasswordView({ mode = 'public' }) {
  const router = useRouter();
  const isAdminMode = mode === 'admin';
  const signInPath = isAdminMode ? paths.auth.jwt.adminSignIn : paths.auth.jwt.signIn;

  const [errorMsg, setErrorMsg] = useState('');
  const [forgotPassword] = useForgotPasswordMutation();
  const [adminResendEmailOtp] = useAdminResendEmailOtpMutation();

  const methods = useForm({
    resolver: zodResolver(ForgetPasswordSchema),
    defaultValues: { email: isAdminMode ? ADMIN_LOGIN_EMAIL : '' },
  });

  const {
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (isAdminMode) {
      setValue('email', ADMIN_LOGIN_EMAIL, { shouldValidate: true });
    }
  }, [isAdminMode, setValue]);

  const onSubmit = handleSubmit(async (data) => {
    setErrorMsg('');

    const email = (isAdminMode ? ADMIN_LOGIN_EMAIL : data.email).trim().toLowerCase();

    try {
      // Admin: POST /admin/auth/resend-otp/email | Public: POST /auth/forgot-password
      // Let the auth API own the error text (no FE hard-coded "email not found" copy).
      const response = await (isAdminMode
        ? adminResendEmailOtp({ email })
        : forgotPassword({ email })
      ).unwrap();
      const otpFromServer = extractSignupOtp(response);
      const resetToken = extractResetToken(response);

      toast.success(response?.message || 'OTP sent to your email.');
      router.push(paths.auth.jwt.verifyPassword, {
        state: {
          email,
          isAdmin: isAdminMode,
          devOtp: resolveOtpForScreen(otpFromServer),
          resetToken,
        },
      });
    } catch (error) {
      const message = handleApiError(error);
      setErrorMsg(message);
      toast.error(message);
    }
  });

  const renderLogo = (
    <Stack alignItems="center" sx={{ mb: 2.5 }}>
      <Logo width={84} height={68} />
    </Stack>
  );

  const renderForm = (
    <Stack spacing={2.5}>
      {!!errorMsg && (
        <Alert severity="error" onClose={() => setErrorMsg('')}>
          {errorMsg}
        </Alert>
      )}

      <Field.Text
        autoFocus={!isAdminMode}
        name="email"
        label="Email address"
        placeholder="carlos.rivera@example.com"
        InputLabelProps={{ shrink: true }}
        disabled={isAdminMode}
        InputProps={isAdminMode ? { readOnly: true } : undefined}
      />

      <AppButton fullWidth type="submit" loading={isSubmitting} loadingIndicator="Send request...">
        Send request
      </AppButton>

      <Link
        component={RouterLink}
        href={signInPath}
        color="inherit"
        variant="subtitle2"
        sx={{ gap: 0.5, alignSelf: 'center', alignItems: 'center', display: 'inline-flex' }}
      >
        <Iconify width={16} icon="eva:arrow-ios-back-fill" />
        Return to sign in
      </Link>
    </Stack>
  );

  const renderMobileHead = (
    <Stack
      spacing={1}
      sx={{
        mb: 2.5,
        textAlign: 'center',
        display: { xs: 'flex', md: 'none' },
      }}
    >
      <Typography variant="h5">{isAdminMode ? 'Change password' : 'Forgot password?'}</Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {isAdminMode
          ? 'We will send an OTP to the admin email so you can set a new password.'
          : `Please enter the email address associated with your account and we'll email you a link to reset your password.`}
      </Typography>
    </Stack>
  );

  return (
    <>
      {renderLogo}
      {renderMobileHead}

      <Form methods={methods} onSubmit={onSubmit}>
        {renderForm}
      </Form>
    </>
  );
}
