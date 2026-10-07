import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Timeline from '@mui/lab/Timeline';
import TimelineDot from '@mui/lab/TimelineDot';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineItem, { timelineItemClasses } from '@mui/lab/TimelineItem';

import { fDateTime } from 'src/utils/format-time';

import { visibleScrollY } from 'src/theme/styles';

import { DashboardEmptyState } from 'src/sections/dashboard/dashboard-empty-state';

// ----------------------------------------------------------------------

export function AnalyticsOrderTimeline({
  title,
  subheader,
  list = [],
  emptyMessage = 'No data available yet',
  ...other
}) {
  const items = Array.isArray(list) ? list : [];

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
      <CardHeader
        title={title}
        subheader={items.length ? subheader : undefined}
        sx={{ flexShrink: 0 }}
      />

      {items.length ? (
        <Box
          sx={{
            px: 1,
            pt: 1,
            pb: 2,
            flexGrow: 1,
            minHeight: 0,
            ...visibleScrollY,
          }}
        >
          <Timeline
            sx={{
              m: 0,
              py: 0,
              px: 2,
              [`& .${timelineItemClasses.root}:before`]: {
                flex: 0,
                padding: 0,
              },
            }}
          >
            {items.map((item, index) => (
              <Item key={item.id} item={item} lastItem={index === items.length - 1} />
            ))}
          </Timeline>
        </Box>
      ) : (
        <DashboardEmptyState message={emptyMessage} />
      )}
    </Card>
  );
}

function Item({ item, lastItem, ...other }) {
  return (
    <TimelineItem {...other}>
      <TimelineSeparator>
        <TimelineDot
          color={
            (item.type === 'order1' && 'primary') ||
            (item.type === 'order2' && 'success') ||
            (item.type === 'order3' && 'info') ||
            (item.type === 'order4' && 'warning') ||
            'error'
          }
        />
        {lastItem ? null : <TimelineConnector />}
      </TimelineSeparator>

      <TimelineContent>
        <Typography variant="subtitle2">{item.title}</Typography>

        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          {fDateTime(item.time)}
        </Typography>
      </TimelineContent>
    </TimelineItem>
  );
}
