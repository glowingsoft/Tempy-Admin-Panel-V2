import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function AdminAllegationsOverview() {
  return (
    <Card sx={{ p: { xs: 2, md: 3 }, minWidth: 0, overflow: 'hidden' }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ minWidth: 0 }}
      >
        <Box sx={{ minWidth: 0, flex: '1 1 auto' }}>
          <Typography variant="h6">Allegations & suspensions</Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, overflowWrap: 'anywhere' }}
          >
            Raised allegations are nurses only. Other rows come from cancellations, abandoned
            shifts, suspended accounts, and reports.
          </Typography>
        </Box>

        <Button
          component={RouterLink}
          href={paths.adminDashboard.allegations}
          variant="contained"
          size="small"
          color="primary"
          startIcon={<Iconify icon="solar:arrow-right-bold" />}
          sx={{
            flexShrink: 0,
            alignSelf: { xs: 'stretch', sm: 'center' },
            whiteSpace: 'nowrap',
          }}
        >
          Manage allegations
        </Button>
      </Stack>
    </Card>
  );
}
