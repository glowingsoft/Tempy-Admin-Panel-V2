import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import LinearProgress from '@mui/material/LinearProgress';
import CardContent from '@mui/material/CardContent';

import { fNumber, fPercent } from 'src/utils/format-number';

import { DashboardEmptyState } from 'src/sections/dashboard/dashboard-empty-state';


export function DashboardWinRateByRegion({
  title = 'Win rate by region',
  items = [],
}) {
  return (
    <Card sx={{ width: 1, height: 1, display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title={title}
        subheader={
          items.length
            ? `${items.length} region${items.length > 1 ? 's' : ''} from bid outcomes`
            : undefined
        }
      />
      <CardContent sx={{ pt: 0, flexGrow: 1 }}>
        {items.length ? (
          <Stack spacing={2.5}>
            {items.map((item) => (
              <Box key={item.id || item.country}>
                <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={1}>
                  <Typography variant="subtitle2" noWrap>
                    {item.country}
                  </Typography>
                  <Typography variant="subtitle2" color="primary.main">
                    {fPercent(item.winRate)}
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
                  {fNumber(item.wonBids)} won · {fNumber(item.totalBids)} bids
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(Math.max(Number(item.winRate) || 0, 0), 100)}
                  sx={{ height: 8, borderRadius: 1 }}
                />
              </Box>
            ))}
          </Stack>
        ) : (
          <DashboardEmptyState message="No win-rate data yet" minHeight={180} />
        )}
      </CardContent>
    </Card>
  );
}
