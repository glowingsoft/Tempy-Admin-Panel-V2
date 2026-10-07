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
import { AppButton } from 'src/components/app-button';
import { Field, Form } from 'src/components/hook-form';
import { toast } from 'src/components/snackbar';

import { handleApiError } from 'src/store/handleApiError';
import {
  useAdminResendEmailOtpMutation,
  useAdminVerifyEmailOtpMutation,
  useForgotPasswordMutation,
  useVerifyEmailOtpMutation,
} from 'src/store/Reducer/auth';

import {
  applyServerOtpToForm,
  extractResetToken,
  extractSignupOtp,
  resolveOtpForScreen,
} from './auth-flow-utils';
import { OtpPreviewAlert } from './otp-preview-alert';

// ----------------------------------------------------------------------

export const OtpVerifySchema = zod.object({
  otp: zod
    .string()
    .min(4, { message: 'OTP is required!' })
    .max(6, { message: 'OTP must be 4-6 digits!' })
    .regex(/^[0-9]+$/, { message: 'OTP must contain only digits!' }),
});

// ----------------------------------------------------------------------

export function JwtVerifyPasswordView() {
  const router = useRouter();
  const { state } = useLocation();
  const [isResending, setIsResending] = useState(false);
  const [forgotPassword] = useForgotPasswordMutation();
  const [verifyEmailOtp] = useVerifyEmailOtpMutation();
  const [adminVerifyEmailOtp] = useAdminVerifyEmailOtpMutation();
  const [adminResendEmailOtp] = useAdminResendEmailOtpMutation();

  const email = state?.email || '';
  const isAdmin = Boolean(state?.isAdmin);
  const forgetPasswordPath = isAdmin
    ? paths.auth.jwt.adminForgetPassword
    : paths.auth.jwt.forgetPassword;
  const signInPath = isAdmin ? paths.auth.jwt.adminSignIn : paths.auth.jwt.signIn;

  const previewOtp = resolveOtpForScreen(state?.devOtp);
  const [devOtp, setDevOtp] = useState(previewOtp);
  const [resetToken, setResetToken] = useState(state?.resetToken || '');

  const methods = useForm({
    resolver: zodResolver(OtpVerifySchema),
    defaultValues: { otp: previewOtp },
  });

  const {
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (previewOtp) {
      setDevOtp(previewOtp);
      setValue('otp', previewOtp, { shouldValidate: true });
    }
  }, [previewOtp, setValue]);

  const onSubmit = handleSubmit(async (data) => {
    if (!email) {
      toast.error('Email is missing. Start forgot password again.');
      router.replace(forgetPasswordPath);
      return;
    }

    const otp = data.otp.trim();
    const payload = {
      email: email.trim().toLowerCase(),
      otp,
    };

    try {
      // Admin: POST /admin/auth/verify-otp/email
      const response = await (isAdmin ? adminVerifyEmailOtp(payload) : verifyEmailOtp(payload)).unwrap();

      router.push(paths.auth.jwt.resetPassword, {
        state: {
          email,
          isAdmin,
          resetToken: extractResetToken(response) || resetToken || otp,
        },
      });
    } catch (error) {
      toast.error(handleApiError(error));
    }
  });

  const handleResendOtp = async () => {
    if (!email) {
      toast.error('Email is missing. Start forgot password again.');
      router.push(forgetPasswordPath);
      return;
    }

    const payload = { email: email.trim().toLowerCase() };

    try {
      setIsResending(true);
      // Admin: POST /admin/auth/resend-otp/email
      const response = await (isAdmin
        ? adminResendEmailOtp(payload)
        : forgotPassword(payload)
      ).unwrap();
      const nextResetToken = extractResetToken(response);

      if (nextResetToken) {
        setResetToken(nextResetToken);
      }

      const visibleOtp = applyServerOtpToForm({
        otp: extractSignupOtp(response),
        setDevOtp,
        setValue,
      });

      toast.success(
        visibleOtp ? 'OTP resent (preview shown below).' : response?.message || 'OTP resent to your email.'
      );
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setIsResending(false);
    }
  };

  const renderLogo = (
    <Stack alignItems="center" sx={{ mb: 3 }}>
      <Logo width={84} height={68} />
    </Stack>
  );

  const renderHead = (
    <Stack spacing={1} sx={{ mb: 4, textAlign: 'center' }}>
      <Typography variant="h5" fontWeight={700}>
        Verify OTP
      </Typography>

      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {email ? (
          <>
            We sent a code to{' '}
            <Typography component="span" variant="body2" fontWeight={600} color="text.primary">
              {email}
            </Typography>
            . Enter it below to reset your password.
          </>
        ) : (
          'Enter the code from your email to reset your password.'
        )}
      </Typography>
    </Stack>
  );

  const renderForm = (
    <Stack spacing={3}>
      <OtpPreviewAlert otp={devOtp} />

      <Field.Text
        name="otp"
        label="OTP"
        placeholder="Enter OTP"
        InputLabelProps={{ shrink: true }}
        inputProps={{ maxLength: 6, inputMode: 'numeric', pattern: '[0-9]*' }}
      />

      <AppButton fullWidth type="submit" loading={isSubmitting} loadingIndicator="Verifying...">
        Verify
      </AppButton>
    </Stack>
  );

  const renderResend = (
    <Stack spacing={1.5} alignItems="center" sx={{ mt: 3 }}>
      <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center">
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {`Didn't receive the OTP?`}
        </Typography>
        <Link
          component="button"
          type="button"
          variant="subtitle2"
          disabled={isResending}
          onClick={handleResendOtp}
          sx={{ cursor: isResending ? 'default' : 'pointer' }}
        >
          {isResending ? 'Sending...' : 'Resend'}
        </Link>
      </Stack>

      <Link component={RouterLink} href={signInPath} variant="caption" color="text.secondary">
        Back to login
      </Link>
    </Stack>
  );

  return (
    <>
      {renderLogo}
      {renderHead}

      <Form methods={methods} onSubmit={onSubmit}>
        {renderForm}
      </Form>

      {renderResend}
    </>
  );
}
