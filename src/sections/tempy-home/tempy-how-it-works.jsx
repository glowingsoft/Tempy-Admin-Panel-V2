import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';
import { renderWithTempyBrand } from 'src/components/tempy-brand';

import { TEMPY_GRADIENT, TEMPY_GRADIENT_BUTTON, TEMPY_GRADIENT_BUTTON_HOVER } from './tempy-theme';
import { TEMPY_SECTION_SCROLL_SX } from './tempy-nav-utils';


const STEPS = [
  {
    number: '01',
    icon: 'solar:document-add-bold',
    title: 'Post Your Shift or Job',
    desc: 'Describe the role, shift times, required qualifications, and location. It takes less than 2 minutes.',
  },
  {
    number: '02',
    icon: 'solar:chat-round-money-bold',
    title: 'Receive Competitive Bids',
    desc: 'Verified agencies and freelance carers submit their bids with rates, availability, and profiles for you to review.',
  },
  {
    number: '03',
    icon: 'solar:users-group-rounded-bold',
    title: 'Select the Best Candidate',
    desc: 'Compare profiles, ratings, and rates. Choose the right professional with confidence and confirm the booking instantly.',
  },
  {
    number: '04',
    icon: 'solar:map-point-wave-bold',
    title: 'Track & Manage in Real Time',
    desc: 'Monitor attendance, approve timesheets, and process payments — all from one simple dashboard.',
  },
];

function StepItem({ number, icon, title, desc, isLast }) {
  const theme = useTheme();
  return (
    <Stack direction="row" spacing={2.5} sx={{ position: 'relative' }}>
      {/* Number + line */}
      <Stack alignItems="center" sx={{ flexShrink: 0 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            border: '2px solid',
            borderColor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'primary.main',
            zIndex: 1,
          }}
        >
          <Iconify icon={icon} sx={{ width: 22, height: 22, color: 'primary.contrastText' }} />
        </Box>
        {!isLast && (
          <Box
            sx={{
              width: 2,
              flex: 1,
              minHeight: 40,
              bgcolor: alpha(theme.palette.primary.main, 0.25),
              mt: 0.5,
            }}
          />
        )}
      </Stack>

      {/* Content */}
      <Box sx={{ pb: isLast ? 0 : 4, pt: 0.5 }}>
        <Typography
          variant="overline"
          sx={{
            color: 'common.white',
            fontWeight: 700,
            letterSpacing: 1.2,
            display: 'block',
            mb: 0.25,
            textShadow: '0 1px 8px rgba(0,0,0,0.45)',
          }}
        >
          Step {number}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.75, color: 'common.white' }}>
          {title}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: alpha('#fff', 0.92),
            fontWeight: 500,
            fontSize: 14.5,
            lineHeight: 1.75,
          }}
        >
          {desc}
        </Typography>
      </Box>
    </Stack>
  );
}

export function TempyHowItWorks() {
  const theme = useTheme();

  return (
    <Box
      id="how-it-works"
      sx={{
        ...TEMPY_SECTION_SCROLL_SX,
        py: { xs: 8, md: 12 },
        background: TEMPY_GRADIENT,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -80,
          right: -80,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: alpha(theme.palette.primary.main, 0.08),
        },
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 6, md: 8 }} alignItems="flex-start">
          {/* Left: Steps */}
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="overline"
              sx={{ color: 'primary.light', fontWeight: 700, letterSpacing: 2, mb: 1, display: 'block' }}
            >
              Simple Process
            </Typography>
            <Typography
              variant="h3"
              sx={{ fontWeight: 800, color: 'common.white', mb: 1.5, fontSize: { xs: 28, md: 36 } }}
            >
              {renderWithTempyBrand('How Tempy Works')}
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: alpha('#fff', 0.8), mb: 5, maxWidth: 420, fontWeight: 500 }}
            >
              A simple process for care homes and clients
            </Typography>

            <Stack>
              {STEPS.map((step, index) => (
                <StepItem key={step.number} {...step} isLast={index === STEPS.length - 1} />
              ))}
            </Stack>

            <Button
              component={RouterLink}
              href={paths.auth.jwt.signUp}
              variant="contained"
              size="large"
              sx={{
                mt: 5,
                px: 4,
                py: 1.5,
                fontWeight: 700,
                borderRadius: 1.5,
                color: '#fff',
                background: TEMPY_GRADIENT_BUTTON,
                '&:hover': { background: TEMPY_GRADIENT_BUTTON_HOVER },
              }}
            >
              Get Quotes Now
            </Button>
          </Box>

          {/* Right: Visual Card */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              alignSelf: { md: 'center' },
            }}
          >
            {/* Dashboard preview card */}
            <Box
              sx={{
                bgcolor: alpha('#fff', 0.06),
                borderRadius: 3,
                border: '1px solid',
                borderColor: alpha('#fff', 0.12),
                p: 3,
                backdropFilter: 'blur(10px)',
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.2),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Iconify icon="solar:clipboard-list-bold" sx={{ color: 'primary.light', width: 22, height: 22 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: 'common.white', fontWeight: 700 }}>
                    Night Shift — Healthcare Professional Required
                  </Typography>
                  <Typography variant="caption" sx={{ color: alpha('#fff', 0.75) }}>
                    Posted 3 minutes ago
                  </Typography>
                </Box>
              </Stack>

              {/* Bid items */}
              {[
                {
                  agency: 'CareLink Agency',
                  rate: '£18/hr',
                  rating: '4.9',
                  time: '2 min ago',
                  icon: 'solar:buildings-bold',
                  color: '#26a69a',
                },
                {
                  agency: 'Premier Staffing',
                  rate: '£16.50/hr',
                  rating: '4.7',
                  time: '5 min ago',
                  icon: 'solar:case-round-bold',
                  color: '#00bcd4',
                },
                {
                  agency: 'HealthForce UK',
                  rate: '£17/hr',
                  rating: '4.8',
                  time: '8 min ago',
                  icon: 'solar:heart-pulse-bold',
                  color: '#26a69a',
                },
              ].map((bid) => (
                <Box
                  key={bid.agency}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1.5,
                    mb: 1,
                    borderRadius: 1.5,
                    bgcolor: alpha('#fff', 0.04),
                    border: '1px solid',
                    borderColor: alpha('#fff', 0.06),
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        bgcolor: alpha(bid.color, 0.28),
                        border: '1px solid',
                        borderColor: alpha(bid.color, 0.55),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Iconify icon={bid.icon} sx={{ width: 18, height: 18, color: bid.color }} />
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'common.white', fontWeight: 600, display: 'block' }}>
                        {bid.agency}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Iconify icon="solar:star-bold" sx={{ width: 11, height: 11, color: '#ffc107' }} />
                        <Typography variant="caption" sx={{ color: alpha('#fff', 0.5), fontSize: 10 }}>
                          {bid.rating} · {bid.time}
                        </Typography>
                      </Stack>
                    </Box>
                  </Stack>
                  <Typography variant="subtitle2" sx={{ color: 'primary.light', fontWeight: 700 }}>
                    {bid.rate}
                  </Typography>
                </Box>
              ))}

              <Button
                component={RouterLink}
                href={paths.dashboard.jobs.bids}
                variant="contained"
                fullWidth
                size="small"
                startIcon={<Iconify icon="solar:document-text-bold" width={18} />}
                sx={{
                  mt: 1.5,
                  borderRadius: 1.5,
                  fontWeight: 700,
                  color: '#fff',
                  background: TEMPY_GRADIENT_BUTTON,
                  '&:hover': { background: TEMPY_GRADIENT_BUTTON_HOVER },
                }}
              >
                View All 12 Bids
              </Button>
            </Box>

            {/* Stats row */}
            <Stack direction="row" spacing={2}>
              {[
                { label: 'Shifts Posted', value: '50K+', icon: 'solar:calendar-bold' },
                { label: 'Agencies', value: '1,200+', icon: 'solar:buildings-bold' },
                { label: 'Avg. Response', value: '4 min', icon: 'solar:clock-circle-bold' },
              ].map((stat) => (
                <Box
                  key={stat.label}
                  sx={{
                    flex: 1,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha('#fff', 0.05),
                    border: '1px solid',
                    borderColor: alpha('#fff', 0.1),
                    textAlign: 'center',
                  }}
                >
                  <Iconify icon={stat.icon} sx={{ width: 20, height: 20, color: 'primary.light', mb: 0.5 }} />
                  <Typography variant="h6" sx={{ color: 'common.white', fontWeight: 800, lineHeight: 1 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="caption" sx={{ color: alpha('#fff', 0.45), fontSize: 10 }}>
                    {stat.label}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
