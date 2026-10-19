import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import TableContainer from '@mui/material/TableContainer';

import { RouterLink } from 'src/routes/components';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { DashboardEmptyState } from 'src/sections/dashboard/dashboard-empty-state';


const TABLE_HEAD = [
  { id: 'location', label: 'Location' },
  { id: 'address', label: 'Address' },
  { id: 'status', label: 'Status', width: 120 },
  { id: 'added', label: 'Added', width: 140, align: 'right' },
];

function statusColor(status) {
  const value = String(status || '').toLowerCase();
  if (value === 'active') return 'success';
  if (value === 'pending') return 'warning';
  if (value === 'inactive') return 'default';
  return 'default';
}

function humanizeStatus(status) {
  const value = String(status || '').trim();
  if (!value) return '—';
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export function DashboardBranchesActivity({ title = 'Location Activity', items = [], href }) {
  return (
    <Card
      sx={{
        width: 1,
        borderRadius: 2,
        overflow: 'hidden',
        boxShadow: (theme) => theme.customShadows?.card || theme.shadows[1],
      }}
    >
      <CardHeader
        title={title}
        subheader={
          items.length
            ? `${items.length} location${items.length > 1 ? 's' : ''} in recent activity`
            : 'No location activity yet'
        }
        action={
          href ? (
            <Button
              component={RouterLink}
              href={href}
              size="small"
              color="inherit"
              endIcon={<Iconify icon="eva:arrow-ios-forward-fill" width={16} />}
              sx={{ fontWeight: 600 }}
            >
              View all
            </Button>
          ) : null
        }
        sx={{
          pb: 2,
          '& .MuiCardHeader-title': { typography: 'h6', fontWeight: 700 },
          '& .MuiCardHeader-subheader': { typography: 'body2', color: 'text.secondary', mt: 0.5 },
        }}
      />

      <CardContent sx={{ pt: 0, px: 0, pb: 0, '&:last-child': { pb: 0 } }}>
        {items.length ? (
          <Scrollbar>
            <TableContainer sx={{ minWidth: 720 }}>
              <Table size="medium">
                <TableHead>
                  <TableRow
                    sx={{
                      bgcolor: 'background.neutral',
                      '& .MuiTableCell-head': {
                        typography: 'caption',
                        fontWeight: 700,
                        color: 'text.secondary',
                        textTransform: 'uppercase',
                        letterSpacing: 0.4,
                        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                        py: 1.5,
                      },
                    }}
                  >
                    {TABLE_HEAD.map((col) => (
                      <TableCell
                        key={col.id}
                        align={col.align || 'left'}
                        sx={{ width: col.width, px: 3 }}
                      >
                        {col.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {items.map((item, index) => (
                    <TableRow
                      key={item.id || item.name}
                      hover
                      sx={{
                        '&:last-of-type td': { borderBottom: 0 },
                        bgcolor: index % 2 === 1 ? 'action.hover' : 'transparent',
                      }}
                    >
                      <TableCell sx={{ px: 3, py: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                          <Avatar
                            src={item.avatarUrl || undefined}
                            alt={item.name}
                            variant="rounded"
                            sx={{
                              width: 44,
                              height: 44,
                              flexShrink: 0,
                              bgcolor: 'primary.lighter',
                              color: 'primary.dark',
                              fontWeight: 700,
                            }}
                          >
                            {(item.name || 'L').charAt(0).toUpperCase()}
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="subtitle2" noWrap fontWeight={700}>
                              {item.name}
                            </Typography>
                            {item.city ? (
                              <Typography variant="caption" color="text.secondary" noWrap display="block">
                                {item.city}
                              </Typography>
                            ) : null}
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell sx={{ px: 3, py: 2, maxWidth: 360 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, minWidth: 0 }}>
                          <Iconify
                            icon="solar:map-point-bold"
                            width={16}
                            sx={{ mt: 0.25, color: 'text.disabled', flexShrink: 0 }}
                          />
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {item.address || '—'}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell sx={{ px: 3, py: 2 }}>
                        <Label variant="soft" color={statusColor(item.status)}>
                          {humanizeStatus(item.status)}
                        </Label>
                      </TableCell>

                      <TableCell align="right" sx={{ px: 3, py: 2 }}>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {item.time || '—'}
                        </Typography>
                        {item.ratingCount > 0 ? (
                          <Typography variant="caption" color="text.disabled" display="block">
                            ★ {item.ratingAverage} · {item.ratingCount}
                          </Typography>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Scrollbar>
        ) : (
          <Box sx={{ px: 3, pb: 3 }}>
            <DashboardEmptyState message="No locations yet" />
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
