import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

export function hasChartValues(chart) {
  const series = Array.isArray(chart?.series) ? chart.series : [];
  if (!series.length) return false;

  return series.some((item) => {
    if (Array.isArray(item?.data)) {
      return item.data.some((value) => Number(value) > 0);
    }
    return Number(item?.value) > 0;
  });
}

export function DashboardEmptyState({
  message = 'No data available yet',
  hint = 'This section will fill when the API returns records',
  minHeight = 220,
}) {
  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      spacing={1}
      sx={{ py: 6, px: 2, minHeight, flexGrow: 1, textAlign: 'center' }}
    >
      <Iconify icon="solar:inbox-line-bold-duotone" width={40} sx={{ color: 'text.disabled' }} />
      <Typography variant="subtitle2" color="text.secondary">
        {message}
      </Typography>
      {hint ? (
        <Typography variant="caption" color="text.disabled">
          {hint}
        </Typography>
      ) : null}
    </Stack>
  );
}
