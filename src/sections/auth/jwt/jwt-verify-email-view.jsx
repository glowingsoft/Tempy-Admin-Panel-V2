import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z as zod } from 'zod';
import { useLocation } from 'react-router-dom';

import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Logo } from 'src/components/logo';
import { toast } from 'src/components/snackbar';
import { AppButton } from 'src/components/app-button';
import { Field, Form } from 'src/components/hook-form';

import { handleApiError } from 'src/store/handleApiError';
import {
  useResendEmailOtpMutation,
  useVerifyEmailOtpMutation,
} from 'src/store/Reducer/auth';

import {
  applyServerOtpToForm,
  clearPendingEmailVerification,
  extractSignupOtp,
  resolveOtpForScreen,
  resolveEmailVerificationContext,
  savePendingEmailVerification,
  savePreferredAuthRole,
} from './auth-flow-utils';
import { OtpPreviewAlert } from './otp-preview-alert';

// ----------------------------------------------------------------------

const EmailOtpVerifySchema = zod.object({
  email: zod
    .string()
    .trim()
    .min(1, { message: 'Email is required!' })
    .email({ message: 'Email must be a valid email address!' }),
  otp: zod
    .string()
    .min(4, { message: 'OTP is required!' })
    .max(6, { message: 'OTP must be 4-6 digits!' })
    .regex(/^[0-9]+$/, { message: 'OTP must contain only digits!' }),
});

// ----------------------------------------------------------------------

export function JwtVerifyEmailView() {
  const router = useRouter();
  const { state } = useLocation();

  const {
    email: signupEmail,
    devOtp: initialDevOtp,
    role: signupRole,
    fromLogin,
  } = resolveEmailVerificationContext(state);

  const previewOtp = resolveOtpForScreen(initialDevOtp);
  const [devOtp, setDevOtp] = useState(previewOtp);
  const [verifyEmailOtp] = useVerifyEmailOtpMutation();
  const [resendEmailOtp, { isLoading: isResendingOtp }] = useResendEmailOtpMutation();

  const methods = useForm({
    resolver: zodResolver(EmailOtpVerifySchema),
    defaultValues: {
      email: signupEmail,
      otp: previewOtp,
    },
  });

  const {
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (!signupEmail) {
      toast.error(fromLogin ? 'Enter your email on the login page first.' : 'Please complete sign up first.');
      router.replace(fromLogin ? paths.auth.jwt.signIn : paths.auth.jwt.signUp);
      return;
    }

    setValue('email', signupEmail, { shouldValidate: true });

    if (previewOtp) {
      setDevOtp(previewOtp);
      setValue('otp', previewOtp, { shouldValidate: true });
    }
  }, [fromLogin, previewOtp, router, setValue, signupEmail]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const response = await verifyEmailOtp({
        email: data.email.trim().toLowerCase(),
        otp: data.otp.trim(),
      }).unwrap();

      if (signupRole) {
        savePreferredAuthRole(signupRole);
      }
      clearPendingEmailVerification();
      toast.success(
        fromLogin
          ? response?.message ||
              'Email verified. An admin will review your account. You can log in after approval.'
          : response?.message || 'Email verified! You can now log in.'
      );
      router.replace(paths.auth.jwt.signIn, {
        state: { email: data.email.trim().toLowerCase(), role: signupRole || undefined },
      });
    } catch (error) {
      toast.error(handleApiError(error));
    }
  });

  const handleResendOtp = async () => {
    const email = signupEmail?.trim().toLowerCase();
    if (!email) {
      toast.error('Email is missing.');
      return;
    }

    try {
      const response = await resendEmailOtp({ email }).unwrap();
      const otpFromServer = extractSignupOtp(response);

      const visibleOtp = applyServerOtpToForm({ otp: otpFromServer, setDevOtp, setValue });
      savePendingEmailVerification({
        email,
        devOtp: otpFromServer,
        role: signupRole,
        fromLogin,
      });

      toast.success(
        visibleOtp ? 'OTP resent (preview shown below).' : response?.message || 'OTP resent to your email.'
      );
    } catch (error) {
      toast.error(handleApiError(error));
    }
  };

  if (!signupEmail) {
    return null;
  }

  const renderLogo = (
    <Stack alignItems="center" sx={{ mb: 3 }}>
      <Logo width={84} height={68} />
    </Stack>
  );

  const renderHead = (
    <Stack spacing={1} sx={{ mb: 3, textAlign: 'center' }}>
      <Typography variant="h5" fontWeight={700}>
        Verify your email
      </Typography>

      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {fromLogin ? (
          <>
            Enter the OTP sent to{' '}
            <Typography component="span" variant="body2" fontWeight={600} color="text.primary">
              {signupEmail}
            </Typography>
            . After verification an admin must approve your account before you can log in.
          </>
        ) : (
          <>
            Step 2 of 2 — enter the OTP for{' '}
            <Typography component="span" variant="body2" fontWeight={600} color="text.primary">
              {signupEmail}
            </Typography>
          </>
        )}
      </Typography>
    </Stack>
  );

  const renderDevOtp = <OtpPreviewAlert otp={devOtp} sx={{ mb: 3 }} />;

  const renderForm = (
    <Stack spacing={3}>
      <Field.Text
        name="otp"
        label="OTP"
        placeholder="Enter OTP"
        InputLabelProps={{ shrink: true }}
        inputProps={{ maxLength: 6, inputMode: 'numeric', pattern: '[0-9]*' }}
      />

      <AppButton fullWidth type="submit" loading={isSubmitting} loadingIndicator="Verifying...">
        Verify {fromLogin ? 'email' : '& continue to login'}
      </AppButton>
    </Stack>
  );

  const renderFooter = (
    <Stack spacing={1.5} alignItems="center" sx={{ mt: 3 }}>
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

      <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
        {fromLogin
          ? 'After verification, wait for admin approval before logging in.'
          : 'After verification you will be taken to login automatically.'}
      </Typography>

      <Link
        component={RouterLink}
        href={fromLogin ? paths.auth.jwt.signIn : paths.auth.jwt.signUp}
        variant="subtitle2"
      >
        {fromLogin ? 'Back to login' : 'Start over (sign up again)'}
      </Link>
    </Stack>
  );

  return (
    <>
      {renderLogo}
      {renderHead}
      {renderDevOtp}

      <Form methods={methods} onSubmit={onSubmit}>
        {renderForm}
      </Form>

      {renderFooter}
    </>
  );
}
