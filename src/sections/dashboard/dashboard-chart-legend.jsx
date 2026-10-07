import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { fNumber } from 'src/utils/format-number';

export function DashboardChartLegend({ items = [], colors = [], sx }) {
  const rows = (Array.isArray(items) ? items : []).map((item, index) => ({
    label: item?.label || '',
    value: Number(item?.value) || 0,
    color: colors[index] || 'text.disabled',
  }));

  if (!rows.length) return null;

  return (
    <Stack
      spacing={1}
      sx={{
        px: 3,
        pb: 2.5,
        pt: 1.5,
        minHeight: 0,
        overflowY: 'auto',
        ...sx,
      }}
    >
      {rows.map((row) => (
        <Stack
          key={row.label}
          direction="row"
          alignItems="center"
          spacing={1.25}
          sx={{ minWidth: 0 }}
        >
          <Box
            sx={{
              width: 10,
              height: 10,
              flexShrink: 0,
              borderRadius: '50%',
              bgcolor: row.color,
            }}
          />
          <Typography variant="body2" noWrap sx={{ flexGrow: 1, color: 'text.secondary' }}>
            {row.label}
          </Typography>
          <Typography variant="subtitle2" sx={{ flexShrink: 0 }}>
            {fNumber(row.value)}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}
