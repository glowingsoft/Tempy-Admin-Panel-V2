import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

export function DashboardQuickAccess({
  title = 'Quick access',
  description = 'Jump to any section from your menu',
  children,
}) {
  return (
    <Grid xs={12} sx={{ mt: 1 }}>
      <Typography variant="h6" sx={{ mb: 0.5 }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5 }}>
        {description}
      </Typography>

      <Grid container spacing={3}>
        {children}
      </Grid>
    </Grid>
  );
}
