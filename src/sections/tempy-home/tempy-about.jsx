import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { Iconify } from 'src/components/iconify';
import { renderWithTempyBrand, TempyBrand } from 'src/components/tempy-brand';

import { TEMPY_PURPLE_END, TEMPY_PURPLE_START } from './tempy-theme';
import { TEMPY_SECTION_SCROLL_SX } from './tempy-nav-utils';


const HIGHLIGHTS = [
  {
    icon: 'solar:hospital-bold',
    label: 'Care Homes & Hospitals',
    desc: 'Post shifts and receive bids from verified staffing agencies and freelance carers within minutes.',
  },
  {
    icon: 'solar:user-id-bold',
    label: 'Freelance Healthcare Professionals',
    desc: 'Register your profile, set your availability, and bid on shifts near you — all from your phone.',
  },
  {
    icon: 'solar:buildings-bold',
    label: 'Staffing Agencies',
    desc: 'Manage your workforce, win contracts, and grow your agency through Tempy\'s marketplace.',
  },
];

export function TempyAbout() {
  const theme = useTheme();

  return (
    <Box id="about" sx={{ ...TEMPY_SECTION_SCROLL_SX, py: { xs: 8, md: 12 }, bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 6, md: 10 }} alignItems="center">

          {/* Left: Illustration / Visual */}
          <Box sx={{ flex: 1 }}>
            <Box
              sx={{
                position: 'relative',
                borderRadius: 3,
                overflow: 'hidden',
                bgcolor: alpha(theme.palette.primary.main, 0.06),
                border: '1px solid',
                borderColor: alpha(theme.palette.primary.main, 0.12),
                p: 4,
              }}
            >
              {/* Top badge */}
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    bgcolor: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Iconify icon="solar:health-bold" sx={{ width: 24, height: 24, color: '#fff' }} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                    {renderWithTempyBrand('Tempy Platform')}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    Real-time care staffing marketplace
                  </Typography>
                </Box>
              </Stack>

              {/* Metric cards */}
              <Stack spacing={1.5} sx={{ mb: 3 }}>
                {[
                  { label: 'Active Care Providers', value: '3,400+', color: theme.palette.primary.main, pct: 78 },
                  { label: 'Registered Agencies', value: '1,200+', color: TEMPY_PURPLE_END, pct: 60 },
                  { label: 'Freelance Carers', value: '18,000+', color: theme.palette.warning.main, pct: 90 },
                ].map((item) => (
                  <Box
                    key={item.label}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        {item.label}
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: item.color }}>
                        {item.value}
                      </Typography>
                    </Stack>
                    <Box sx={{ height: 4, bgcolor: alpha(item.color, 0.12), borderRadius: 2 }}>
                      <Box
                        sx={{
                          height: '100%',
                          width: `${item.pct}%`,
                          bgcolor: item.color,
                          borderRadius: 2,
                        }}
                      />
                    </Box>
                  </Box>
                ))}
              </Stack>

              {/* Trust badges */}
              <Stack direction="row" spacing={1}>
                {[
                  { icon: 'solar:shield-check-bold', label: 'DBS Checked', color: TEMPY_PURPLE_START },
                  { icon: 'solar:star-bold', label: 'Rated 4.8★', color: '#ff9800' },
                  { icon: 'solar:lock-bold', label: 'Secure Pay', color: '#2196f3' },
                ].map((badge) => (
                  <Stack
                    key={badge.label}
                    direction="row"
                    alignItems="center"
                    spacing={0.75}
                    sx={{
                      flex: 1,
                      p: 1,
                      borderRadius: 1.5,
                      bgcolor: alpha(badge.color, 0.08),
                      border: '1px solid',
                      borderColor: alpha(badge.color, 0.2),
                      justifyContent: 'center',
                    }}
                  >
                    <Iconify icon={badge.icon} sx={{ width: 14, height: 14, color: badge.color, flexShrink: 0 }} />
                    <Typography variant="caption" sx={{ color: badge.color, fontWeight: 600, fontSize: 10 }}>
                      {badge.label}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Box>

          {/* Right: Content */}
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="overline"
              sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 2, mb: 1, display: 'block' }}
            >
              {renderWithTempyBrand('About Tempy')}
            </Typography>
            <Typography
              variant="h3"
              sx={{ fontWeight: 800, mb: 3, fontSize: { xs: 26, md: 34 }, color: 'text.primary', lineHeight: 1.25 }}
            >
              More about{' '}
              <TempyBrand component="span" sx={{ color: 'primary.main' }} />
            </Typography>

            <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.85, mb: 2 }}>
              {renderWithTempyBrand(
                'Getting care staff through Tempy is fast and simple. Whether you manage a care home, hospital, or clinic, you can post a shift and receive competitive bids from our network of over 1,200 verified staffing agencies and 18,000 freelance carers across the UK.'
              )}
            </Typography>

            <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.85, mb: 2 }}>
              {renderWithTempyBrand(
                'Agencies use Tempy to expand their client base, reduce admin overhead, and win more contracts. Our scheduling, invoicing, and reporting tools are built specifically for the healthcare staffing industry.'
              )}
            </Typography>

            <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.85, mb: 4 }}>
              Freelance healthcare professionals can register in minutes, set their availability, and bid on
              local shifts that match their skills and certifications — all without agency middlemen
              taking a cut of their earnings.
            </Typography>

            {/* Highlight items */}
            <Stack spacing={2.5}>
              {HIGHLIGHTS.map((item) => (
                <Stack key={item.label} direction="row" spacing={2} alignItems="flex-start">
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 1.5,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      mt: 0.25,
                    }}
                  >
                    <Iconify icon={item.icon} sx={{ width: 20, height: 20, color: 'primary.main' }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.25, color: 'text.primary' }}>
                      {item.label}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                      {renderWithTempyBrand(item.desc)}
                    </Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
