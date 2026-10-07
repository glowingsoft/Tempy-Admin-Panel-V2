import { Iconify } from 'src/components/iconify';

import { fCurrency } from 'src/utils/format-number';

import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { ADMIN_ENTITY_STATUS_OPTIONS, getAdminEntityStatusOption } from './admin-entity-status';

// ----------------------------------------------------------------------

function AdminStatusSelect({ status, onRequestChange }) {
  const safeStatus = ADMIN_ENTITY_STATUS_OPTIONS.some((option) => option.value === status)
    ? status
    : 'pending';
  const current = getAdminEntityStatusOption(safeStatus);

  return (
    <TextField
      select
      size="small"
      value={safeStatus}
      onClick={(event) => event.stopPropagation()}
      onChange={(event) => {
        event.stopPropagation();
        const nextStatus = event.target.value;
        if (nextStatus === status) return;
        onRequestChange?.(nextStatus);
      }}
      sx={{
        width: 128,
        minWidth: 128,
        maxWidth: 128,
        '& .MuiOutlinedInput-root': {
          typography: 'caption',
          fontWeight: 700,
          height: 28,
          minHeight: 28,
          borderRadius: 1,
          alignItems: 'center',
          bgcolor: (theme) => {
            const paletteColor = theme.palette[current.color];
            return paletteColor?.lighter || theme.palette.grey[200];
          },
          color: (theme) => {
            const paletteColor = theme.palette[current.color];
            return paletteColor?.darker || theme.palette.text.primary;
          },
          '& fieldset': { borderColor: 'transparent' },
          '&:hover fieldset': { borderColor: 'transparent' },
          '&.Mui-focused fieldset': { borderColor: 'transparent' },
        },
        '& .MuiInputBase-input': {
          py: '0 !important',
        },
        '& .MuiSelect-select': {
          py: '0 !important',
          px: 1,
          pr: '22px !important',
          boxSizing: 'border-box',
          height: '28px !important',
          minHeight: '28px !important',
          lineHeight: '28px !important',
          display: 'flex',
          alignItems: 'center',
          textTransform: 'capitalize',
        },
        '& .MuiSelect-icon': {
          top: '50%',
          right: 4,
          width: 16,
          height: 16,
          color: 'inherit',
          transform: 'translateY(-50%)',
          '&.MuiSelect-iconOpen': {
            transform: 'translateY(-50%) rotate(180deg)',
          },
        },
      }}
    >
      {ADMIN_ENTITY_STATUS_OPTIONS.map((option) => (
        <MenuItem key={option.value} value={option.value} sx={{ textTransform: 'capitalize' }}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );
}

function TruncateWithTooltip({ value, fontWeight, maxWidth = 220 }) {
  const text = value == null || value === '' ? '—' : String(value);

  if (text === '—') {
    return (
      <Typography variant="body2" noWrap>
        —
      </Typography>
    );
  }

  return (
    <Tooltip title={text} arrow enterDelay={200}>
      <Typography
        variant="body2"
        fontWeight={fontWeight}
        noWrap
        component="span"
        sx={{
          maxWidth,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: 'block',
          cursor: 'default',
        }}
      >
        {text}
      </Typography>
    </Tooltip>
  );
}

function renderCellValue(row, columnId, { profileHref } = {}) {
  if (columnId === 'rating') {
    if (row.rating == null || row.rating === '' || row.totalReviews === 0) {
      return (
        <Typography variant="body2" noWrap>
          —
        </Typography>
      );
    }
    const reviewsText = row.totalReviews != null ? ` (${row.totalReviews})` : '';
    return (
      <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.35}>
        <Iconify icon="material-symbols:star" width={14} sx={{ color: '#FFB800' }} />
        <Typography variant="body2" noWrap>
          {Number(row.rating).toFixed(1)}
          {reviewsText}
        </Typography>
      </Stack>
    );
  }

  if (columnId === 'revenue' || columnId === 'spendings' || columnId === 'earnings') {
    const value = row[columnId];
    const text = value == null || value === '' ? '—' : fCurrency(value);
    if (profileHref && text !== '—') {
      return (
        <Link
          component={RouterLink}
          href={`${profileHref}#activity`}
          state={{ row }}
          underline="hover"
          color="inherit"
          sx={{ typography: 'body2', fontWeight: 600 }}
        >
          {text}
        </Link>
      );
    }
    return (
      <Typography variant="body2" noWrap>
        {text}
      </Typography>
    );
  }

  if (
    columnId === 'jobsPosted' ||
    columnId === 'jobsApplied' ||
    columnId === 'bookings' ||
    columnId === 'completedJobs' ||
    columnId === 'activeShifts'
  ) {
    const value = row[columnId];
    const text = value == null || value === '' ? '—' : String(value);
    if (profileHref && text !== '—') {
      return (
        <Link
          component={RouterLink}
          href={`${profileHref}#activity`}
          state={{ row }}
          underline="hover"
          color="inherit"
          sx={{ typography: 'body2', fontWeight: 600 }}
        >
          {text}
        </Link>
      );
    }
    return (
      <Typography variant="body2" noWrap>
        {text}
      </Typography>
    );
  }

  if (columnId === 'email') {
    return <TruncateWithTooltip value={row.email} maxWidth={240} />;
  }

  if (
    columnId === 'name' ||
    columnId === 'location' ||
    columnId === 'phone' ||
    columnId === 'specialty' ||
    columnId === 'careType' ||
    columnId === 'region'
  ) {
    return (
      <TruncateWithTooltip
        value={row[columnId]}
        fontWeight={columnId === 'name' ? 600 : undefined}
        maxWidth={columnId === 'name' ? 200 : 180}
      />
    );
  }

  const value = row[columnId];
  return value == null || value === '' ? '—' : value;
}

export function AdminEntityTableRow({
  row,
  tableHead,
  onView,
  enableView = false,
  viewTooltip = 'View dashboard',
  viewLabel = 'View',
  onProfile,
  profileKind = '',
  profileTooltip = 'Open profile',
  onRaiseAllegation,
  raiseAllegationTooltip = 'Raise allegation & suspend',
  onStatusChangeRequest,
}) {
  const dataColumns = tableHead.filter((col) => col.id !== 'action');
  const canOpenProfile = Boolean(onProfile || profileKind);
  const profileHref =
    profileKind && row?.id ? paths.adminDashboard.orgProfile(profileKind, row.id) : '';

  const openProfile = () => {
    if (onProfile) {
      onProfile(row);
      return;
    }
  };

  const profileButton = canOpenProfile ? (
    <Tooltip title={profileTooltip} arrow>
      {profileHref ? (
        <IconButton
          size="small"
          color="primary"
          component={RouterLink}
          href={profileHref}
          state={{ row }}
        >
          <Iconify icon="solar:user-id-bold" width={18} />
        </IconButton>
      ) : (
        <IconButton size="small" color="primary" onClick={openProfile}>
          <Iconify icon="solar:user-id-bold" width={18} />
        </IconButton>
      )}
    </Tooltip>
  ) : null;

  const allegationButton = onRaiseAllegation ? (
    <Tooltip title={raiseAllegationTooltip} arrow>
      <IconButton size="small" color="error" onClick={() => onRaiseAllegation?.(row)}>
        <Iconify icon="solar:danger-triangle-bold" width={18} />
      </IconButton>
    </Tooltip>
  ) : null;

  const viewButton = enableView ? (
    <>
      <Tooltip title={viewTooltip} arrow>
        <IconButton
          size="small"
          color="primary"
          onClick={() => onView?.(row)}
          sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
        >
          <Iconify icon="solar:eye-bold" width={18} />
        </IconButton>
      </Tooltip>
      <Tooltip title={viewTooltip} arrow>
        <Button
          size="small"
          variant="contained"
          startIcon={<Iconify icon="solar:eye-bold" width={16} />}
          onClick={() => onView?.(row)}
          sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
        >
          {viewLabel}
        </Button>
      </Tooltip>
    </>
  ) : (
    <Tooltip title="Dashboard coming soon" arrow>
      <span>
        <IconButton size="small" color="primary" disabled sx={{ display: { xs: 'inline-flex', sm: 'none' } }}>
          <Iconify icon="solar:eye-bold" width={18} />
        </IconButton>
        <Button
          size="small"
          variant="contained"
          disabled
          startIcon={<Iconify icon="solar:eye-bold" width={16} />}
          sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
        >
          {viewLabel}
        </Button>
      </span>
    </Tooltip>
  );

  return (
    <TableRow hover tabIndex={-1}>
      {dataColumns.map((column) => {
        if (column.id === 'name') {
          const nameLabel = row.name || '—';
          return (
            <TableCell key={column.id} sx={{ whiteSpace: 'nowrap', minWidth: 200 }}>
              {canOpenProfile && profileHref ? (
                <Link
                  component={RouterLink}
                  href={profileHref}
                  state={{ row }}
                  underline="none"
                  color="inherit"
                  title={profileTooltip}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    minWidth: 0,
                    maxWidth: 280,
                    color: 'primary.main',
                    '&:hover .admin-entity-name': { textDecoration: 'underline' },
                  }}
                >
                  <Avatar src={row.avatarUrl} alt={nameLabel} sx={{ width: 36, height: 36, flexShrink: 0 }}>
                    {typeof nameLabel === 'string' ? nameLabel[0] : '?'}
                  </Avatar>
                  <Typography
                    className="admin-entity-name"
                    variant="body2"
                    fontWeight={700}
                    noWrap
                    sx={{ minWidth: 0 }}
                  >
                    {nameLabel}
                  </Typography>
                </Link>
              ) : canOpenProfile ? (
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1.5}
                  onClick={openProfile}
                  sx={{ cursor: 'pointer', color: 'primary.main' }}
                >
                  <Avatar src={row.avatarUrl} alt={nameLabel} sx={{ width: 36, height: 36, flexShrink: 0 }}>
                    {typeof nameLabel === 'string' ? nameLabel[0] : '?'}
                  </Avatar>
                  <Typography className="admin-entity-name" variant="body2" fontWeight={700} noWrap>
                    {nameLabel}
                  </Typography>
                </Stack>
              ) : (
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Avatar src={row.avatarUrl} alt={nameLabel} sx={{ width: 36, height: 36, flexShrink: 0 }}>
                    {typeof nameLabel === 'string' ? nameLabel[0] : '?'}
                  </Avatar>
                  <TruncateWithTooltip value={row.name} fontWeight={600} maxWidth={180} />
                </Stack>
              )}
            </TableCell>
          );
        }

        if (column.id === 'status') {
          return (
            <TableCell key={column.id} sx={{ whiteSpace: 'nowrap' }}>
              <AdminStatusSelect
                status={row.status}
                onRequestChange={(nextStatus) => onStatusChangeRequest?.(row, nextStatus)}
              />
            </TableCell>
          );
        }

        return (
          <TableCell
            key={column.id}
            align={column.align || 'left'}
            sx={{ whiteSpace: 'nowrap' }}
          >
            {renderCellValue(row, column.id, { profileHref })}
          </TableCell>
        );
      })}

      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
        <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
          {allegationButton}
          {profileButton}
          {viewButton}
        </Stack>
      </TableCell>
    </TableRow>
  );
}
