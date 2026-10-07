import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import LoadingButton from '@mui/lab/LoadingButton';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Unstable_Grid2';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { getDashboardRootPath } from 'src/auth/utils/dashboard-path-utils';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';

import {
  buildContactUsPayload,
  resolveSettingsAccountKey,
  validateContactUsPayload,
} from 'src/sections/dashboard-settings/dashboard-settings-api-utils';

import { useCreateContactUsMutation } from 'src/store/Reducer/dashboard-settings-api';

import {
  BRAND_GRADIENT,
  BRAND_GRADIENT_BUTTON,
  BRAND_GRADIENT_BUTTON_HOVER,
  BRAND_SOFT_BG,
} from 'src/theme/brand-gradient';
import { varAlpha } from 'src/theme/styles';
import { useViewOnly } from 'src/hooks/use-view-only';


const FIELD_SX = {
  '& .MuiOutlinedInput-root': {
    bgcolor: 'background.paper',
    borderRadius: 1.5,
  },
};

function FieldIcon({ icon }) {
  return (
    <InputAdornment position="start">
      <Iconify icon={icon} width={20} sx={{ color: 'text.disabled' }} />
    </InputAdornment>
  );
}

function getDefaultContactForm(user) {
  return {
    name: String(user?.basicInfo?.name || user?.name || user?.displayName || '').trim(),
    email: String(user?.basicInfo?.email || user?.email || '').trim(),
    phoneNumber: '',
    subject: '',
    message: '',
  };
}

export function DashboardContactView() {
  // Admin viewing this account cannot send messages as it.
  const viewOnly = useViewOnly();
  const { user } = useSelector((state) => state.user);
  const accountType = user?.accountState?.accountType;
  const permission = user?.permission;
  const accountKey = useMemo(() => resolveSettingsAccountKey(user), [user]);
  const dashboardRoot = getDashboardRootPath(permission, accountType);

  const [form, setForm] = useState(() => getDefaultContactForm(user));
  const [createContactUs, { isLoading: isSubmitting }] = useCreateContactUsMutation();

  useEffect(() => {
    setForm((prev) => {
      if (prev.name || prev.email || prev.subject || prev.message) return prev;
      return getDefaultContactForm(user);
    });
  }, [user]);

  const handleChange = useCallback((field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      if (!accountKey) {
        toast.error('Unable to resolve contact route for this account');
        return;
      }

      const payload = buildContactUsPayload(form);
      const validationError = validateContactUsPayload(payload);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      try {
        const response = await createContactUs({ accountKey, ...payload }).unwrap();
        toast.success(response?.message || 'Message sent successfully');
        setForm((prev) => ({
          ...prev,
          phoneNumber: '',
          subject: '',
          message: '',
        }));
      } catch (err) {
        toast.error(err?.data?.message || err?.error || 'Failed to send message');
      }
    },
    [accountKey, createContactUs, form]
  );

  const fieldsDisabled = isSubmitting || !accountKey;

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, pb: 5, pt: 3 }}>
      <CustomBreadcrumbs
        heading="Contact Us"
        links={[
          { name: 'Dashboard', href: dashboardRoot || paths.dashboard.root },
          { name: 'Contact Us' },
        ]}
        sx={{ mb: { xs: 2.5, md: 3 } }}
      />

      <Card
        component="form"
        onSubmit={handleSubmit}
        sx={{
          width: 1,
          overflow: 'hidden',
          border: (theme) => `1px solid ${theme.vars.palette.divider}`,
          boxShadow: (theme) => theme.customShadows?.card || theme.shadows[8],
        }}
      >
        <Box
          sx={{
            px: { xs: 2.5, md: 4 },
            py: { xs: 2.5, md: 3.5 },
            background: BRAND_GRADIENT,
            color: 'common.white',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              right: { xs: -40, md: 24 },
              top: { xs: -20, md: -16 },
              width: 180,
              height: 180,
              borderRadius: '50%',
              bgcolor: varAlpha('255 255 255', 0.1),
            }}
          />
          <Stack direction="row" spacing={2} alignItems="center" sx={{ position: 'relative' }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                flexShrink: 0,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: varAlpha('255 255 255', 0.18),
                border: `1px solid ${varAlpha('255 255 255', 0.28)}`,
              }}
            >
              <Iconify icon="solar:chat-round-dots-bold" width={28} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                We’d love to hear from you
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.88 }}>
                Send a message and the Tempy team will get back to you as soon as possible.
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Box
          sx={{
            px: { xs: 2.5, md: 4 },
            py: { xs: 3, md: 4 },
            bgcolor: BRAND_SOFT_BG,
          }}
        >
          <Grid container spacing={2.5}>
            <Grid xs={12} md={6}>
              <TextField
                label="Name"
                value={form.name}
                onChange={handleChange('name')}
                fullWidth
                required
                disabled={fieldsDisabled}
                sx={FIELD_SX}
                InputProps={{
                  startAdornment: <FieldIcon icon="solar:user-bold" />,
                }}
              />
            </Grid>

            <Grid xs={12} md={6}>
              <TextField
                label="Email"
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                fullWidth
                required
                disabled={fieldsDisabled}
                sx={FIELD_SX}
                InputProps={{
                  startAdornment: <FieldIcon icon="solar:letter-bold" />,
                }}
              />
            </Grid>

            <Grid xs={12} md={6}>
              <TextField
                label="Phone number (optional)"
                value={form.phoneNumber}
                onChange={handleChange('phoneNumber')}
                fullWidth
                disabled={fieldsDisabled}
                sx={FIELD_SX}
                InputProps={{
                  startAdornment: <FieldIcon icon="solar:phone-bold" />,
                }}
              />
            </Grid>

            <Grid xs={12} md={6}>
              <TextField
                label="Subject"
                value={form.subject}
                onChange={handleChange('subject')}
                fullWidth
                required
                disabled={fieldsDisabled}
                sx={FIELD_SX}
                InputProps={{
                  startAdornment: <FieldIcon icon="solar:document-text-bold" />,
                }}
              />
            </Grid>

            <Grid xs={12}>
              <TextField
                label="Message"
                value={form.message}
                onChange={handleChange('message')}
                fullWidth
                required
                multiline
                minRows={6}
                disabled={fieldsDisabled}
                sx={FIELD_SX}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                      <Iconify icon="solar:pen-bold" width={20} sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid xs={12}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                alignItems={{ xs: 'stretch', sm: 'center' }}
                justifyContent="space-between"
              >
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Typical reply time is within 1–2 business days.
                </Typography>

                <LoadingButton
                  type="submit"
                  variant="contained"
                  size="large"
                  loading={isSubmitting}
                  disabled={!accountKey}
                  style={viewOnly ? { display: 'none' } : undefined}
                  startIcon={<Iconify icon="solar:plain-bold" />}
                  sx={{
                    minWidth: 200,
                    py: 1.25,
                    fontWeight: 700,
                    color: 'common.white',
                    background: BRAND_GRADIENT_BUTTON,
                    boxShadow: `0 8px 20px ${varAlpha('10 117 135', 0.28)}`,
                    '&:hover': {
                      background: BRAND_GRADIENT_BUTTON_HOVER,
                    },
                  }}
                >
                  Send message
                </LoadingButton>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </Card>
    </Box>
  );
}
