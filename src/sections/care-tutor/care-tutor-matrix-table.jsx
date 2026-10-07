import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { Label } from 'src/components/label';
import { Scrollbar } from 'src/components/scrollbar';

import { MANDATORY_TRAINING_COURSES } from 'src/sections/care-home/compliance/care-home-compliance-data';

import { getTrafficLightMeta } from './care-tutor-api-utils';

// ----------------------------------------------------------------------

function StatusDot({ status }) {
  const meta = getTrafficLightMeta(status);
  return (
    <Tooltip title={meta.label}>
      <Box
        sx={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          mx: 'auto',
          bgcolor: (theme) => {
            if (status === 'green') return theme.vars.palette.success.main;
            if (status === 'amber') return theme.vars.palette.warning.main;
            if (status === 'red') return theme.vars.palette.error.main;
            return theme.vars.palette.grey[400];
          },
        }}
      />
    </Tooltip>
  );
}

export function CareTutorMatrixTable({ rows = [], courses = MANDATORY_TRAINING_COURSES }) {
  const courseList = useMemo(() => courses.filter(Boolean), [courses]);

  if (!rows.length) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
        No staff training records yet.
      </Typography>
    );
  }

  return (
    <TableContainer sx={{ overflow: 'unset' }}>
      <Scrollbar>
        <Table size="small" sx={{ minWidth: 720 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 180, fontWeight: 700 }}>Staff</TableCell>
              <TableCell sx={{ minWidth: 90, fontWeight: 700 }}>Overall</TableCell>
              {courseList.map((title) => (
                <TableCell key={title} align="center" sx={{ minWidth: 96, fontWeight: 700 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                    {title}
                  </Typography>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((row) => {
              const overallMeta = getTrafficLightMeta(row.overall || 'grey');
              return (
                <TableRow key={row.staffId || row.staffName} hover>
                  <TableCell>
                    <Typography variant="subtitle2">{row.staffName || 'Staff'}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {row.completed ?? 0}/{row.total ?? courseList.length} complete
                      {row.overdue ? ` · ${row.overdue} overdue` : ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Label variant="soft" color={overallMeta.color}>
                      {overallMeta.label}
                    </Label>
                  </TableCell>
                  {courseList.map((title) => (
                    <TableCell key={`${row.staffId}-${title}`} align="center">
                      <StatusDot status={row.courses?.[title] || 'grey'} />
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Scrollbar>
    </TableContainer>
  );
}

export function CareTutorSummaryChips({ rows = [] }) {
  const summary = useMemo(() => {
    let verified = 0;
    let inProgress = 0;
    let overdue = 0;

    rows.forEach((row) => {
      Object.values(row.courses || {}).forEach((status) => {
        if (status === 'green') verified += 1;
        else if (status === 'amber') inProgress += 1;
        else if (status === 'red') overdue += 1;
      });
    });

    return { verified, inProgress, overdue };
  }, [rows]);

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      <Chip size="small" color="success" variant="soft" label={`${summary.verified} verified`} />
      <Chip size="small" color="warning" variant="soft" label={`${summary.inProgress} in progress`} />
      <Chip size="small" color="error" variant="soft" label={`${summary.overdue} overdue`} />
    </Box>
  );
}
