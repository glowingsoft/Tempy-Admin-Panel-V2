import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

function statusColor(status) {
  const raw = String(status || '').toLowerCase();
  if (raw === 'active' || raw === 'accepted' || raw === 'booked') return 'success.main';
  if (raw === 'pending' || raw === 'new') return 'warning.main';
  if (raw === 'completed' || raw === 'previous') return 'text.secondary';
  if (raw === 'cancelled' || raw === 'canceled' || raw === 'deleted') return 'error.main';
  return 'text.secondary';
}

/**
 * Left panel: company posted jobs only (display). Calendar assignee names stay on shift cards.
 * `loading` only suppresses the empty state — the shifts page overlay is the loader.
 */
export function PostedJobsSidebarPanel({
  jobs = [],
  loading = false,
  title = 'Posted jobs',
}) {
  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 160,
        display: 'flex',
        flexDirection: 'column',
        borderTop: '1px solid #e0e0e0',
        bgcolor: '#fafbfc',
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 1.5, py: 1, borderBottom: '1px solid #eceff1', flexShrink: 0, bgcolor: '#fff' }}
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
              border: '1px dashed #d5d9de',
              bgcolor: '#fff',
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
              border: '1px solid #e6e8eb',
              bgcolor: '#fff',
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
      </Stack>
    </Box>
  );
}
