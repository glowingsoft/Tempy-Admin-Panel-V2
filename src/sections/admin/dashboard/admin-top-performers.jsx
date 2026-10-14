import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';

import { Label } from 'src/components/label';
import { visibleScrollY } from 'src/theme/styles';
import { DashboardEmptyState } from 'src/sections/dashboard/dashboard-empty-state';

// ----------------------------------------------------------------------

const RANK_COLOR = {
  1: 'warning',
  2: 'info',
  3: 'success',
};

export function AdminTopPerformers({
  title,
  subheader,
  list = [],
  emptyMessage = 'No top performers yet',
  ...other
}) {
  return (
    <Card
      {...other}
      sx={{
        height: { xs: 452, md: 452 },
        width: 1,
        minHeight: 452,
        maxHeight: 452,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        ...other.sx,
      }}
    >
      <CardHeader title={title} subheader={subheader} sx={{ flexShrink: 0 }} />

      {list.length ? (
        <Stack
          spacing={2}
          sx={{
            px: 3,
            pb: 3,
            pt: 1,
            flexGrow: 1,
            minHeight: 0,
            ...visibleScrollY,
          }}
        >
          {list.map((item) => (
            <Stack
              key={item.id}
              direction="row"
              alignItems="flex-start"
              spacing={1.5}
              sx={{
                p: 1.5,
                borderRadius: 1.5,
                bgcolor: 'background.neutral',
              }}
            >
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  flexShrink: 0,
                  fontWeight: 700,
                  bgcolor: 'background.paper',
                  color: 'text.primary',
                  overflow: 'visible',
                  border: (theme) => `1px solid ${theme.vars.palette.divider}`,
                }}
              >
                {item.rank}
              </Avatar>

              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ overflowWrap: 'anywhere' }}>
                  {item.name}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', display: 'block', overflowWrap: 'anywhere' }}
                >
                  {item.subtitle}
                </Typography>
                <Label
                  variant="soft"
                  color={RANK_COLOR[item.rank] || 'default'}
                  sx={{ mt: 0.75 }}
                >
                  {item.metric}
                </Label>
              </Box>
            </Stack>
          ))}
        </Stack>
      ) : (
        <DashboardEmptyState message={emptyMessage} hint="" minHeight={180} />
      )}
    </Card>
  );
}
