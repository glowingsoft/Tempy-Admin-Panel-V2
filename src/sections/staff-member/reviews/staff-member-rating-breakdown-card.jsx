import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Rating from '@mui/material/Rating';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

// ----------------------------------------------------------------------

export function StaffMemberRatingBreakdownCard({
  title = 'Rating by area',
  criteriaAverages = [],
  compact = false,
}) {
  return (
    <Card sx={{ p: compact ? 2 : 3, height: 1 }}>
      <Typography variant={compact ? 'subtitle2' : 'subtitle1'} sx={{ mb: compact ? 1.5 : 2 }}>
        {title}
      </Typography>

      <Stack spacing={compact ? 1 : 1.25}>
        {criteriaAverages.map((item) => {
          const percent = item.average ? (item.average / 5) * 100 : 0;
          return (
            <Stack key={item.key} spacing={0.5}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                <Typography variant="body2" sx={{ minWidth: 0 }}>
                  {item.label}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={0.75} sx={{ flexShrink: 0 }}>
                  <Rating
                    size="small"
                    max={5}
                    precision={0.1}
                    value={item.average}
                    readOnly
                    sx={{ color: 'warning.main' }}
                  />
                  <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: 28 }}>
                    {item.average ? item.average.toFixed(1) : '—'}
                  </Typography>
                </Stack>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={percent}
                sx={{
                  height: compact ? 6 : 8,
                  borderRadius: 1,
                  bgcolor: 'background.neutral',
                  '& .MuiLinearProgress-bar': { bgcolor: 'warning.main' },
                }}
              />
            </Stack>
          );
        })}
      </Stack>
    </Card>
  );
}
