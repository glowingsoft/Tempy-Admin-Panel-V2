import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Card from '@mui/material/Card';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';

import { useBoolean } from 'src/hooks/use-boolean';
import { useViewOnly } from 'src/hooks/use-view-only';
import { useSelector } from 'react-redux';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';
import { handleApiError } from 'src/store/handleApiError';
import {
  useAdminChangePasswordMutation,
  useChangePasswordMutation,
} from 'src/store/Reducer/auth';

export const ChangePassWordSchema = zod
  .object({
    oldPassword: zod
      .string()
      .min(1, { message: 'Password is required!' })
      .min(6, { message: 'Password must be at least 6 characters!' }),
    newPassword: zod
      .string()
      .min(1, { message: 'New password is required!' })
      .min(6, { message: 'Password must be at least 6 characters!' }),
    confirmNewPassword: zod.string().min(1, { message: 'Confirm password is required!' }),
  })
  .refine((data) => data.oldPassword !== data.newPassword, {
    message: 'New password must be different than old password',
    path: ['newPassword'],
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match!',
    path: ['confirmNewPassword'],
  });

// ----------------------------------------------------------------------

export function AccountChangePassword() {
  const viewOnly = useViewOnly();
  const password = useBoolean();
  const { user } = useSelector((state) => state.user);
  const isAdmin = user?.permission === 1 || user?.accountState?.accountType === 'admin';

  const [changePassword, { isLoading }] = useChangePasswordMutation();
  const [adminChangePassword, { isLoading: isAdminLoading }] = useAdminChangePasswordMutation();

  const defaultValues = { oldPassword: '', newPassword: '', confirmNewPassword: '' };

  const methods = useForm({
    mode: 'onBlur',
    resolver: zodResolver(ChangePassWordSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    const payload = {
      oldPassword: data.oldPassword,
      newPassword: data.newPassword,
    };

    try {
      // Admin: POST /admin/auth/change-password
      await (isAdmin ? adminChangePassword(payload) : changePassword(payload)).unwrap();
      reset();
      toast.success('Password changed successfully');
    } catch (error) {
      toast.error(handleApiError(error));
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Card sx={{ p: 3, gap: 3, display: 'flex', flexDirection: 'column' }}>
        <Field.Text
          name="oldPassword"
          type={password.value ? 'text' : 'password'}
          label="Old password"
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

        <Field.Text
          name="newPassword"
          label="New password"
          type={password.value ? 'text' : 'password'}
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

        <Field.Text
          name="confirmNewPassword"
          type={password.value ? 'text' : 'password'}
          label="Confirm new password"
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

        <LoadingButton
          type="submit"
          variant="contained"
          loading={isSubmitting || isLoading || isAdminLoading}
          // Admin viewing the account cannot change its password.
          sx={{ ml: 'auto', display: viewOnly ? 'none' : 'inline-flex' }}
        >
          Save changes
        </LoadingButton>
      </Card>
    </Form>
  );
}
