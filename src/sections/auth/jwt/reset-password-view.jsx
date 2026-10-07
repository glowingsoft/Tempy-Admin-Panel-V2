import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z as zod } from 'zod';
import { useLocation } from 'react-router-dom';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

import { Logo } from 'src/components/logo';
import { AppButton } from 'src/components/app-button';
import { Field, Form } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';
import { useBoolean } from 'src/hooks/use-boolean';

import { handleApiError } from 'src/store/handleApiError';
import {
  useAdminResetPasswordMutation,
  useResetPasswordMutation,
} from 'src/store/Reducer/auth';

import { ADMIN_LOGIN_EMAIL } from './auth-role-options';

// ----------------------------------------------------------------------

const PASSWORD_REQUIREMENTS_MESSAGE =
  'Password must be at least 8 characters and include 1 uppercase letter, 1 number, and 1 special character (e.g. !@#$%).';

function isStrongPassword(value) {
  return (
    typeof value === 'string' &&
    value.length >= 8 &&
    /[A-Z]/.test(value) &&
    /[0-9]/.test(value) &&
    /[^A-Za-z0-9]/.test(value)
  );
}

export const ResetPasswordSchema = zod
  .object({
    newPassword: zod
      .string()
      .min(1, { message: 'New password is required!' })
      .refine(isStrongPassword, { message: PASSWORD_REQUIREMENTS_MESSAGE }),
    confirmPassword: zod.string().min(1, { message: 'Please confirm your new password!' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match!',
    path: ['confirmPassword'],
  });

// ----------------------------------------------------------------------

export function JwtResetPasswordView() {
  const router = useRouter();
  const { state } = useLocation();
  const [resetPassword] = useResetPasswordMutation();
  const [adminResetPassword] = useAdminResetPasswordMutation();

  const newPassword = useBoolean();
  const confirmPassword = useBoolean();
  const isAdmin = Boolean(state?.isAdmin);
  const email = isAdmin ? ADMIN_LOGIN_EMAIL : state?.email || '';
  const resetToken = state?.resetToken || '';
  const forgetPasswordPath = isAdmin
    ? paths.auth.jwt.adminForgetPassword
    : paths.auth.jwt.forgetPassword;
  const signInPath = isAdmin ? paths.auth.jwt.adminSignIn : paths.auth.jwt.signIn;

  const defaultValues = {
    newPassword: '',
    confirmPassword: '',
  };

  const methods = useForm({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    if (!email || !resetToken) {
      toast.error('Password reset session is missing. Please request a new OTP.');
      router.replace(forgetPasswordPath);
      return;
    }

    const payload = {
      email: email.trim().toLowerCase(),
      newPassword: data.newPassword,
      resetToken,
    };

    try {
      const response = await (isAdmin ? adminResetPassword(payload) : resetPassword(payload)).unwrap();

      toast.success(response?.message || 'Password reset successfully. Please sign in.');
      router.replace(signInPath, { state: { email } });
    } catch (error) {
      toast.error(handleApiError(error));
    }
  });

  const renderHead = (
    <Stack
      spacing={1}
      sx={{ mb: 4, textAlign: 'center', display: { xs: 'flex', md: 'none' } }}
    >
      <Typography variant="h5" fontWeight={700}>
        Reset your password
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        Please enter your new password and confirm it below.
      </Typography>
    </Stack>
  );

  const renderLogo = (
    <Stack alignItems="center" sx={{ mb: 3 }}>
      <Logo width={84} height={68} />
    </Stack>
  );

  const renderForm = (
    <Stack spacing={3}>
      <Field.Text
        name="newPassword"
        label="New Password"
        placeholder="Enter your new password"
        type={newPassword.value ? 'text' : 'password'}
        InputLabelProps={{ shrink: true }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={newPassword.onToggle} edge="end">
                <Iconify icon={newPassword.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <Field.Text
        name="confirmPassword"
        label="Confirm Password"
        placeholder="Re-enter your new password"
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

      <AppButton fullWidth type="submit" loading={isSubmitting} loadingIndicator="Resetting...">
        Reset Password
      </AppButton>
    </Stack>
  );

  return (
    <>
      {renderLogo}
      {renderHead}
      <Form methods={methods} onSubmit={onSubmit}>
        {renderForm}
      </Form>
    </>
  );
}
