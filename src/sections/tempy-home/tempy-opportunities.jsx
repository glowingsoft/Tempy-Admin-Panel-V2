import Box from '@mui/material/Box';
import Grid from '@mui/material/Unstable_Grid2';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { Iconify } from 'src/components/iconify';
import { TempyBrand } from 'src/components/tempy-brand';

import { TEMPY_PURPLE_END } from './tempy-theme';
import { TEMPY_SECTION_SCROLL_SX } from './tempy-nav-utils';


const EMPLOYEE_FEATURES = [
  { label: 'Registration', icon: 'solar:user-plus-bold' },
  { label: 'Shift Bidding', icon: 'solar:calendar-add-bold' },
  { label: 'Attendance', icon: 'solar:check-circle-bold' },
  { label: 'Messaging', icon: 'solar:chat-round-bold' },
  { label: 'Earnings', icon: 'solar:wallet-money-bold' },
];

const CARE_HOME_FEATURES = [
  { label: 'Shift Posting', icon: 'solar:document-add-bold' },
  { label: 'Bid Comparison', icon: 'solar:chart-2-bold' },
  { label: 'Staff Selection', icon: 'solar:users-group-rounded-bold' },
  { label: 'Staff Tracking', icon: 'solar:map-point-bold' },
  { label: 'Payments', icon: 'solar:card-bold' },
];

const AGENCY_FEATURES = [
  { label: 'Staff Management', icon: 'solar:users-group-rounded-bold' },
  { label: 'Shift Bidding', icon: 'solar:calendar-add-bold' },
  { label: 'Invoicing', icon: 'solar:document-text-bold' },
  { label: 'Reporting', icon: 'solar:chart-bold' },
  { label: 'Staff Assignment', icon: 'solar:user-check-rounded-bold' },
  { label: 'Scheduling', icon: 'solar:calendar-mark-bold' },
  { label: 'Messaging', icon: 'solar:chat-round-bold' },
  { label: 'Payments', icon: 'solar:card-bold' },
  { label: 'Workforce Analytics', icon: 'solar:graph-new-bold' },
];

function FeatureItem({ label, icon }) {
  const theme = useTheme();
  return (
    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ py: 0.75 }}>
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          flexShrink: 0,
        }}
      >
        <Iconify icon={icon} sx={{ color: 'primary.main', width: 18, height: 18 }} />
      </Box>
      <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
        {label}
      </Typography>
    </Stack>
  );
}

function OpportunityCard({ title, features, accentColor }) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        p: 3,
        height: '100%',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        transition: 'box-shadow 0.2s, border-color 0.2s',
        '&:hover': {
          boxShadow: theme.customShadows?.z8 || '0 8px 24px rgba(0,0,0,0.08)',
          borderColor: accentColor || 'primary.main',
        },
      }}
    >
      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: 700,
          mb: 2.5,
          pb: 1.5,
          borderBottom: '2px solid',
          borderColor: accentColor || 'primary.main',
          color: 'text.primary',
        }}
      >
        {title}
      </Typography>

      <Stack spacing={0.25}>
        {features.map((feature) => (
          <FeatureItem key={feature.label} label={feature.label} icon={feature.icon} />
        ))}
      </Stack>
    </Box>
  );
}

export function TempyOpportunities() {
  const theme = useTheme();

  return (
    <Box
      id="services"
      sx={{
        ...TEMPY_SECTION_SCROLL_SX,
        py: { xs: 8, md: 12 },
        bgcolor: alpha(theme.palette.grey[500], 0.04),
      }}
    >
      <Container maxWidth="lg">
        <Typography
          variant="h4"
          sx={{ fontWeight: 700, mb: 6, color: 'text.primary', textAlign: 'center' }}
        >
          Opportunities with{' '}
          <TempyBrand component="span" sx={{ color: 'primary.main' }} />
        </Typography>

        <Grid container spacing={3}>
          <Grid xs={12} md={4}>
            <OpportunityCard
              title="As an Employee / Freelance Healthcare Professional"
              features={EMPLOYEE_FEATURES}
              accentColor={theme.palette.primary.main}
            />
          </Grid>

          <Grid xs={12} md={4}>
            <OpportunityCard
              title="As a Care Home or Client"
              features={CARE_HOME_FEATURES}
              accentColor={TEMPY_PURPLE_END}
            />
          </Grid>

          <Grid xs={12} md={4}>
            <OpportunityCard
              title="As a Staffing Agency"
              features={AGENCY_FEATURES}
              accentColor={theme.palette.info.main}
            />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
