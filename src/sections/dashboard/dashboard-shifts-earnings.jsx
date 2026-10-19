import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import TableContainer from '@mui/material/TableContainer';

import { Label } from 'src/components/label';
import { Scrollbar } from 'src/components/scrollbar';
import { getWorkflowStatusColorKey } from 'src/sections/dashboard/dashboard-status-colors';
import { DashboardEmptyState } from 'src/sections/dashboard/dashboard-empty-state';


const TABLE_HEAD = [
  { id: 'date', label: 'Shift' },
  { id: 'status', label: 'Status', width: 160 },
  { id: 'added', label: 'Logged', width: 140, align: 'right' },
];

export function DashboardShiftsEarnings({
  title = 'Shifts & earnings',
  items = [],
}) {
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
            ? `${items.length} recent shift booking${items.length > 1 ? 's' : ''}`
            : 'No shift bookings yet'
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
            <TableContainer sx={{ minWidth: 640 }}>
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
                      key={item.id}
                      hover
                      sx={{
                        '&:last-of-type td': { borderBottom: 0 },
                        bgcolor: index % 2 === 1 ? 'action.hover' : 'transparent',
                      }}
                    >
                      <TableCell sx={{ px: 3, py: 2 }}>
                        <Typography variant="subtitle2" fontWeight={700}>
                          {item.dateLabel || '—'}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 0.25 }}>
                          {item.timeRange ? (
                            <Typography variant="caption" color="text.secondary">
                              {item.timeRange}
                            </Typography>
                          ) : null}
                          {item.breakLabel ? (
                            <Typography variant="caption" color="text.disabled">
                              · {item.breakLabel}
                            </Typography>
                          ) : null}
                        </Box>
                      </TableCell>

                      <TableCell sx={{ px: 3, py: 2 }}>
                        <Label
                          variant="soft"
                          color={getWorkflowStatusColorKey(item.status) || 'default'}
                        >
                          {item.statusLabel}
                        </Label>
                      </TableCell>

                      <TableCell align="right" sx={{ px: 3, py: 2 }}>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {item.time || '—'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Scrollbar>
        ) : (
          <Box sx={{ px: 3, pb: 3 }}>
            <DashboardEmptyState message="No shifts yet" />
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
