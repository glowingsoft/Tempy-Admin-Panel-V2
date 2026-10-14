import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';

import { Iconify } from 'src/components/iconify';
import { visibleScrollY } from 'src/theme/styles';
import { DashboardEmptyState } from 'src/sections/dashboard/dashboard-empty-state';

// ----------------------------------------------------------------------

export function DashboardActivityList({ title, items = [], onItemClick }) {
  return (
    <Card
      sx={{
        height: { xs: 452, md: 452 },
        width: 1,
        minHeight: 452,
        maxHeight: 452,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <CardHeader
        title={title}
        subheader={items.length ? `${items.length} latest update${items.length > 1 ? 's' : ''}` : undefined}
        sx={{ flexShrink: 0 }}
      />
      <CardContent
        sx={{
          pt: 0,
          pb: 2,
          flexGrow: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          ...visibleScrollY,
        }}
      >
        {items.length ? (
          <Stack divider={<Divider sx={{ borderStyle: 'dashed' }} />} sx={{ flexGrow: 1 }}>
            {items.map((item) => {
              const clickable = Boolean(onItemClick && item.clickable);
              return (
              <Stack
                key={item.id}
                direction="row"
                spacing={2}
                alignItems="center"
                onClick={clickable ? () => onItemClick(item) : undefined}
                sx={{
                  py: 1.75,
                  ...(clickable
                    ? {
                        cursor: 'pointer',
                        borderRadius: 1,
                        mx: -0.5,
                        px: 0.5,
                        '&:hover': { bgcolor: 'action.hover' },
                      }
                    : null),
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1.5,
                    bgcolor: item.color ? `${item.color}.lighter` : 'background.neutral',
                    color: item.color ? `${item.color}.main` : 'text.secondary',
                  }}
                >
                  <Iconify icon={item.icon} width={22} />
                </Box>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, overflowWrap: 'break-word' }}>
                    {item.label}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    {item.time}
                  </Typography>
                </Box>
              </Stack>
            );
            })}
          </Stack>
        ) : (
          <DashboardEmptyState
            message="No recent activity"
            hint="New jobs, bids and bookings will show here"
          />
        )}
      </CardContent>
    </Card>
  );
}
