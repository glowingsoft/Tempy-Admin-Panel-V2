import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { Iconify } from 'src/components/iconify';

import { TEMPY_PURPLE_END, TEMPY_PURPLE_START, TEMPY_SOFT_BG } from './tempy-theme';


const TRUST_ITEMS = [
  {
    icon: 'solar:star-bold',
    iconColor: '#ffc107',
    bgColor: '#fff8e1',
    topLabel: 'Google Reviews',
    rating: '4.8/5',
    subLabel: 'from 5,200+ reviews',
    extra: null,
  },
  {
    icon: 'solar:shield-check-bold',
    iconColor: TEMPY_PURPLE_START,
    bgColor: TEMPY_SOFT_BG,
    topLabel: 'CQC-Registered',
    rating: 'Compliant',
    subLabel: 'Care Quality Commission',
    extra: null,
  },
  {
    icon: 'solar:verified-check-bold',
    iconColor: '#2196f3',
    bgColor: '#e3f2fd',
    topLabel: 'Trustpilot',
    rating: '4.7/5',
    subLabel: 'from 20,000+ reviews',
    extra: null,
  },
];

export function TempyTrust() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        py: { xs: 5, md: 6 },
        borderTop: '1px solid',
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: alpha(theme.palette.grey[500], 0.03),
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          divider={<Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />}
          spacing={{ xs: 4, sm: 0 }}
          justifyContent="space-around"
          alignItems="center"
        >
          {TRUST_ITEMS.map((item) => (
            <Stack key={item.topLabel} alignItems="center" spacing={1.5} sx={{ flex: 1, px: 2 }}>
              {/* Icon badge */}
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 2,
                  bgcolor: item.bgColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Iconify icon={item.icon} sx={{ width: 28, height: 28, color: item.iconColor }} />
              </Box>

              {/* Star row */}
              <Stack direction="row" spacing={0.4}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Iconify
                    key={s}
                    icon="solar:star-bold"
                    sx={{ width: 16, height: 16, color: '#ffc107' }}
                  />
                ))}
              </Stack>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1 }}>
                  {item.rating}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: 'text.disabled', fontWeight: 500, display: 'block', mt: 0.25 }}
                >
                  {item.topLabel}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: 11 }}>
                  {item.subLabel}
                </Typography>
              </Box>
            </Stack>
          ))}
        </Stack>

        {/* Bottom badge strip */}
        <Stack
          direction="row"
          flexWrap="wrap"
          justifyContent="center"
          gap={2}
          sx={{ mt: 5 }}
        >
          {[
            { icon: 'solar:shield-bold', label: 'DBS Checked Staff', color: '#1565c0' },
            { icon: 'solar:lock-bold', label: 'GDPR Compliant', color: '#6a1b9a' },
            { icon: 'solar:hospital-bold', label: 'NHS Compatible', color: TEMPY_PURPLE_END },
            { icon: 'solar:document-bold', label: 'Fully Insured', color: '#e65100' },
          ].map((badge) => (
            <Stack
              key={badge.label}
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{
                px: 2.5,
                py: 1,
                borderRadius: 10,
                border: '1px solid',
                borderColor: alpha(badge.color, 0.2),
                bgcolor: alpha(badge.color, 0.06),
              }}
            >
              <Iconify icon={badge.icon} sx={{ width: 16, height: 16, color: badge.color }} />
              <Typography variant="body2" sx={{ fontWeight: 600, color: badge.color, fontSize: 13 }}>
                {badge.label}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}
