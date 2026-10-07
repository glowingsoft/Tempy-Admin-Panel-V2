import { useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { alpha, useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';
import { renderWithTempyBrand } from 'src/components/tempy-brand';

import {
  TEMPY_GRADIENT_BUTTON,
  TEMPY_GRADIENT_BUTTON_HOVER,
  TEMPY_PURPLE_END,
  TEMPY_PURPLE_START,
} from './tempy-theme';


const RECENT_SHIFTS = [
  {
    id: 1,
    role: 'Night Shift Healthcare Professional',
    facility: 'Sunrise Care Home',
    location: 'Manchester, M1 2AB',
    bids: 8,
    rate: '£18/hr',
    urgent: true,
    icon: 'solar:hospital-bold',
    color: '#1565c0',
  },
  {
    id: 2,
    role: 'Senior Carer',
    facility: 'Oakwood Nursing Home',
    location: 'Birmingham, B2 5PQ',
    bids: 12,
    rate: '£14/hr',
    urgent: false,
    icon: 'solar:heart-pulse-bold',
    color: TEMPY_PURPLE_START,
  },
  {
    id: 3,
    role: 'Healthcare Assistant',
    facility: 'Royal Care Agency',
    location: 'Leeds, LS1 4DY',
    bids: 6,
    rate: '£13.50/hr',
    urgent: true,
    icon: 'solar:user-id-bold',
    color: '#e65100',
  },
  {
    id: 4,
    role: 'Dementia Care Specialist',
    facility: 'Meadowbrook Care',
    location: 'Sheffield, S3 8PL',
    bids: 9,
    rate: '£20/hr',
    urgent: false,
    icon: 'solar:health-bold',
    color: '#6a1b9a',
  },
  {
    id: 5,
    role: 'Support Worker',
    facility: 'Bluebird Home Care',
    location: 'Bristol, BS1 3LH',
    bids: 5,
    rate: '£12.50/hr',
    urgent: false,
    icon: 'solar:people-nearby-bold',
    color: TEMPY_PURPLE_END,
  },
];

const HIGHLIGHTS = [
  'Post any care role — Healthcare Professional, Carer, Support Worker & more',
  'Receive competitive bids within minutes of posting',
  'All professionals are DBS-checked and reference-verified',
  'Dedicated compliance and safety team on hand',
  'Friendly 24/7 care-sector customer support',
];

export function TempyRecentShifts() {
  const theme = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);

  const shift = RECENT_SHIFTS[activeIndex];

  const handlePrev = () =>
    setActiveIndex((i) => (i - 1 + RECENT_SHIFTS.length) % RECENT_SHIFTS.length);
  const handleNext = () =>
    setActiveIndex((i) => (i + 1) % RECENT_SHIFTS.length);

  return (
    <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 6, md: 8 }} alignItems="center">

          {/* Left: Shift card carousel */}
          <Box sx={{ flex: 1 }}>
            <Box
              sx={{
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                overflow: 'hidden',
                boxShadow: theme.customShadows?.z8 || '0 8px 24px rgba(0,0,0,0.08)',
              }}
            >
              {/* Card header */}
              <Box
                sx={{
                  px: 3,
                  py: 2.5,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  background: alpha(shift.color, 0.06),
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: alpha(shift.color, 0.12),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Iconify icon={shift.icon} sx={{ width: 26, height: 26, color: shift.color }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }} noWrap>
                      {shift.role}
                    </Typography>
                    {shift.urgent && (
                      <Box
                        sx={{
                          px: 1,
                          py: 0.25,
                          borderRadius: 1,
                          bgcolor: alpha('#f44336', 0.1),
                          border: '1px solid',
                          borderColor: alpha('#f44336', 0.25),
                          flexShrink: 0,
                        }}
                      >
                        <Typography variant="caption" sx={{ color: '#f44336', fontWeight: 700, fontSize: 10 }}>
                          URGENT
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {shift.facility}
                  </Typography>
                </Box>
              </Box>

              {/* Location rows */}
              <Box sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 1.5,
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Iconify icon="solar:map-point-bold" sx={{ width: 18, height: 18, color: 'primary.main' }} />
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>
                        Location
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {shift.location}
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 1.5,
                        bgcolor: alpha(TEMPY_PURPLE_START, 0.08),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Iconify icon="solar:card-bold" sx={{ width: 18, height: 18, color: TEMPY_PURPLE_START }} />
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>
                        Rate
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {shift.rate}
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 1.5,
                        bgcolor: alpha(theme.palette.warning.main, 0.08),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Iconify icon="solar:users-group-rounded-bold" sx={{ width: 18, height: 18, color: 'warning.main' }} />
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>
                        Bids Received
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {shift.bids} bids
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>

                {/* Bid button — keep outside carousel so controls never overlap */}
                <Button
                  component={RouterLink}
                  href={paths.dashboard.jobs.bids}
                  variant="contained"
                  fullWidth
                  sx={{
                    mt: 3,
                    py: 1.25,
                    borderRadius: 1.5,
                    fontWeight: 700,
                    color: '#fff',
                    position: 'relative',
                    zIndex: 1,
                    background: TEMPY_GRADIENT_BUTTON,
                    boxShadow: 'none',
                    '&:hover': {
                      background: TEMPY_GRADIENT_BUTTON_HOVER,
                      boxShadow: 'none',
                    },
                  }}
                >
                  View Bids →
                </Button>
              </Box>

              {/* Carousel controls */}
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{
                  px: 3,
                  py: 2,
                  borderTop: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  position: 'relative',
                  zIndex: 0,
                }}
              >
                <IconButton size="small" onClick={handlePrev} sx={{ bgcolor: 'action.hover' }}>
                  <Iconify icon="solar:alt-arrow-left-bold" width={18} />
                </IconButton>

                <Stack direction="row" spacing={0.75}>
                  {RECENT_SHIFTS.map((_, i) => (
                    <Box
                      key={i}
                      onClick={() => setActiveIndex(i)}
                      sx={{
                        width: i === activeIndex ? 20 : 8,
                        height: 8,
                        borderRadius: 4,
                        bgcolor: i === activeIndex ? 'primary.main' : 'divider',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                      }}
                    />
                  ))}
                </Stack>

                <IconButton size="small" onClick={handleNext} sx={{ bgcolor: 'action.hover' }}>
                  <Iconify icon="solar:alt-arrow-right-bold" width={18} />
                </IconButton>
              </Stack>
            </Box>
          </Box>

          {/* Right: Content */}
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="overline"
              sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 2, mb: 1, display: 'block' }}
            >
              Live Activity
            </Typography>
            <Typography
              variant="h3"
              sx={{ fontWeight: 800, mb: 2, fontSize: { xs: 26, md: 34 }, color: 'text.primary', lineHeight: 1.25 }}
            >
              Thousands of shifts filled every day
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4, lineHeight: 1.75 }}>
              {renderWithTempyBrand(
                'Care homes, hospitals, and agencies across the UK post shifts on Tempy and receive multiple competitive bids — all at a much more affordable rate than traditional recruitment channels.'
              )}
            </Typography>

            <Stack spacing={1.75}>
              {HIGHLIGHTS.map((text) => (
                <Stack key={text} direction="row" alignItems="center" spacing={1.5}>
                  <Box
                    sx={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Iconify
                      icon="solar:check-circle-bold"
                      sx={{ width: 14, height: 14, color: 'primary.main' }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                    {text}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
