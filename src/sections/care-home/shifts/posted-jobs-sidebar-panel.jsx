import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';
import { rotaBorder, rotaBorderColor, rotaMuted, rotaPaper } from 'src/components/shifts/rota-theme';


function statusColor(status) {
  const raw = String(status || '').toLowerCase();
  if (raw === 'active' || raw === 'accepted' || raw === 'booked') return 'success.main';
  if (raw === 'pending' || raw === 'new') return 'warning.main';
  if (raw === 'completed' || raw === 'previous') return 'text.secondary';
  if (raw === 'cancelled' || raw === 'canceled' || raw === 'deleted') return 'error.main';
  return 'text.secondary';
}


export function PostedJobsSidebarPanel({
  jobs = [],
  loading = false,
  loadingMore = false,
  hasMore = false,
  onLoadMore,
  title = 'Posted jobs',
}) {
  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 160,
        display: 'flex',
        flexDirection: 'column',
        borderTop: rotaBorder,
        bgcolor: rotaMuted,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          px: 1.5,
          py: 1,
          borderBottom: rotaBorder,
          flexShrink: 0,
          bgcolor: rotaPaper,
        }}
      >
        <Typography sx={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.2 }}>
          {title}
        </Typography>
      </Stack>

      <Stack
        spacing={1}
        sx={{
          p: 1.25,
          pb: 3,
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {!loading && !jobs.length ? (
          <Box
            sx={{
              px: 1.25,
              py: 2,
              borderRadius: 1.25,
              border: (theme) => `1px dashed ${rotaBorderColor(theme)}`,
              bgcolor: rotaPaper,
              textAlign: 'center',
            }}
          >
            <Typography sx={{ fontSize: 11.5, color: 'text.secondary', lineHeight: 1.4 }}>
              No posted jobs yet.
            </Typography>
          </Box>
        ) : null}

        {jobs.map((job) => (
          <Box
            key={job.id}
            sx={{
              px: 1.25,
              py: 1.1,
              border: rotaBorder,
              bgcolor: rotaPaper,
              borderRadius: 1.25,
              flexShrink: 0,
            }}
          >
            <Stack spacing={0.55} sx={{ minWidth: 0, width: 1 }}>
              <Stack direction="row" spacing={0.75} alignItems="flex-start" sx={{ minWidth: 0 }}>
                <Iconify
                  icon="solar:case-round-bold"
                  width={15}
                  sx={{ color: 'text.secondary', mt: '1px', flexShrink: 0 }}
                />
                <Typography
                  sx={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    lineHeight: 1.35,
                    color: 'text.primary',
                    wordBreak: 'break-word',
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  {job.title}
                </Typography>
              </Stack>

              {job.subtitle ? (
                <Typography
                  sx={{
                    fontSize: 11,
                    color: 'text.secondary',
                    lineHeight: 1.35,
                    pl: 2.7,
                    wordBreak: 'break-word',
                  }}
                >
                  {job.subtitle}
                </Typography>
              ) : null}

              <Stack
                direction="row"
                spacing={0.75}
                alignItems="center"
                sx={{ pl: 2.7, minWidth: 0, flexWrap: 'wrap', rowGap: 0.25 }}
              >
                <Typography
                  sx={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: statusColor(job.status),
                    textTransform: 'capitalize',
                    lineHeight: 1.3,
                  }}
                >
                  {job.status || 'open'}
                </Typography>
                <Typography sx={{ fontSize: 10.5, color: 'text.disabled', lineHeight: 1.3 }}>
                  ·
                </Typography>
                <Typography
                  sx={{
                    fontSize: 10.5,
                    color: 'text.secondary',
                    lineHeight: 1.3,
                    minWidth: 0,
                    wordBreak: 'break-word',
                  }}
                >
                  {job.assigneeLabel || 'Unassigned'}
                </Typography>
              </Stack>
            </Stack>
          </Box>
        ))}

        {hasMore && typeof onLoadMore === 'function' ? (
          <Button
            size="small"
            color="inherit"
            variant="outlined"
            disabled={loadingMore}
            onClick={onLoadMore}
            sx={{
              mt: 0.5,
              flexShrink: 0,
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'none',
              borderColor: (theme) => rotaBorderColor(theme),
              bgcolor: rotaPaper,
            }}
          >
            {loadingMore ? 'Loading…' : 'Load more'}
          </Button>
        ) : null}
      </Stack>
    </Box>
  );
}
