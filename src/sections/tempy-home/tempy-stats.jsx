import Box from '@mui/material/Box';
import Grid from '@mui/material/Unstable_Grid2';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { Iconify } from 'src/components/iconify';
import { renderWithTempyBrand } from 'src/components/tempy-brand';

import { TEMPY_PURPLE_START } from './tempy-theme';


const STATS = [
  {
    icon: 'solar:bolt-bold',
    color: '#2196f3',
    title: 'Fast & Easy',
    desc: 'Post a shift in under 2 minutes. No phone calls or emails required. Receive competitive bids directly to your dashboard.',
  },
  {
    icon: 'solar:shield-check-bold',
    color: TEMPY_PURPLE_START,
    title: 'Verified Professionals',
    desc: 'Every carer and healthcare professional on Tempy is DBS-checked, reference-verified, and rated by the care community for your peace of mind.',
  },
  {
    icon: 'solar:tag-price-bold',
    color: '#ff9800',
    title: 'Great Rates',
    desc: 'Agencies compete for your shifts, driving down costs. Care providers save up to 30% compared to standard agency rates.',
  },
];

function StatCard({ icon, color, title, desc }) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        p: 3.5,
        height: '100%',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.customShadows?.z16 || '0 16px 40px rgba(0,0,0,0.12)',
          borderColor: alpha(color, 0.4),
        },
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: alpha(color, 0.12),
          mb: 2.5,
        }}
      >
        <Iconify icon={icon} sx={{ width: 28, height: 28, color }} />
      </Box>

      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
        {title}
      </Typography>

      <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.75 }}>
        {renderWithTempyBrand(desc)}
      </Typography>
    </Box>
  );
}

export function TempyStats() {
  return (
    <Box sx={{ py: { xs: 8, md: 10 }, bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
        <Typography
          variant="h4"
          align="center"
          sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}
        >
          {renderWithTempyBrand('Thousands of care providers use Tempy')}
        </Typography>
        <Typography
          variant="body1"
          align="center"
          sx={{ color: 'text.secondary', mb: 6, maxWidth: 520, mx: 'auto' }}
        >
          Join the growing network of care homes, hospitals, and staffing agencies across the UK
        </Typography>

        <Grid container spacing={3}>
          {STATS.map((stat) => (
            <Grid key={stat.title} xs={12} md={4}>
              <StatCard {...stat} />
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
