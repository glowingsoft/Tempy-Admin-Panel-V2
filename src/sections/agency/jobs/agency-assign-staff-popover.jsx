import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Portal from '@mui/material/Portal';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';

import { Iconify } from 'src/components/iconify';

import { isStaffBusyOnDateInSet } from 'src/sections/agency/shifts/agency-availability-api-utils';


const POPOVER_W = 300;
const POPOVER_H = 360;
const POPOVER_GAP = 10;
const VIEWPORT_PAD = 16;

function isStaffBusy(busyDateKeys, staff, dateKey) {
  if (!dateKey || !busyDateKeys?.size) return false;
  const ids = [staff?.id, staff?.staffId, staff?.workerId, staff?.membershipId]
    .map((value) => String(value || '').trim())
    .filter(Boolean);
  return ids.some((id) => isStaffBusyOnDateInSet(busyDateKeys, id, dateKey));
}

function getPopoverPosition(anchor) {
  const spaceBelow = window.innerHeight - (anchor.top + anchor.height);
  const spaceAbove = anchor.top;
  const showAbove = spaceBelow < POPOVER_H + VIEWPORT_PAD && spaceAbove >= spaceBelow;

  let top = showAbove
    ? anchor.top - POPOVER_H - POPOVER_GAP
    : anchor.top + anchor.height + POPOVER_GAP;

  top = Math.max(VIEWPORT_PAD, Math.min(top, window.innerHeight - POPOVER_H - VIEWPORT_PAD));

  let left = anchor.left + anchor.width / 2 - POPOVER_W / 2;
  left = Math.max(VIEWPORT_PAD, Math.min(left, window.innerWidth - POPOVER_W - VIEWPORT_PAD));

  const arrowLeft = Math.max(16, Math.min(POPOVER_W - 32, anchor.left + anchor.width / 2 - left - 8));

  return { top, left, showAbove, arrowLeft };
}

export function AssignStaffPopover({
  anchor,
  shiftLabel,
  staffList,
  search,
  onSearchChange,
  selectedStaffId,
  onSelectStaff,
  onClose,
  assigning = false,
  busyDateKeys = null,
  dateKey = '',
}) {
  if (!anchor) return null;

  const filtered = staffList
    .filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    .map((staff) => ({
      ...staff,
      busy: isStaffBusy(busyDateKeys, staff, dateKey),
    }));
  const { top, left, showAbove, arrowLeft } = getPopoverPosition(anchor);

  return (
    <Portal>
      <Box onClick={onClose} sx={{ position: 'fixed', inset: 0, zIndex: 1299 }} />
      <Box
        sx={{
          position: 'fixed',
          top,
          left,
          zIndex: 1300,
          width: POPOVER_W,
          maxHeight: POPOVER_H,
          overflowY: 'auto',
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: (theme) => theme.customShadows?.dropdown || theme.shadows[8],
          p: 2,
          ...(showAbove
            ? {
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: -8,
                left: arrowLeft,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: '8px solid',
                borderTopColor: 'background.paper',
              },
            }
            : {
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -8,
                left: arrowLeft,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderBottom: '8px solid',
                borderBottomColor: 'background.paper',
              },
            }),
        }}
      >
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
          {shiftLabel}
        </Typography>

        <TextField
          fullWidth
          size="small"
          placeholder="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" width={18} sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
            sx: { borderRadius: 5, bgcolor: 'action.hover', '& fieldset': { border: 'none' } },
          }}
          sx={{ mb: 2 }}
        />

        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <Typography variant="caption" fontWeight={700}>
            Available Staff for this shift
          </Typography>
          {assigning ? <CircularProgress size={14} /> : null}
        </Stack>

        <Stack spacing={1} sx={{ opacity: assigning ? 0.6 : 1, pointerEvents: assigning ? 'none' : 'auto' }}>
          {!filtered.length ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 1.5 }}>
              {search ? 'No staff match this search' : 'No active staff available'}
            </Typography>
          ) : null}
          {filtered.map((staff) => {
            const isSelected = String(selectedStaffId) === String(staff.id);
            return (
              <Box
                key={staff.id}
                onClick={() => {
                  if (staff.busy || assigning) return;
                  onSelectStaff(staff.id);
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  p: 1,
                  borderRadius: 1.5,
                  cursor: staff.busy || assigning ? 'not-allowed' : 'pointer',
                  opacity: staff.busy ? 0.55 : 1,
                  '&:hover': staff.busy || assigning ? undefined : { bgcolor: 'action.hover' },
                }}
              >
                <Avatar src={staff.avatarUrl} sx={{ width: 40, height: 40 }}>
                  {staff.initials}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" fontWeight={700} noWrap>
                    {staff.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: staff.busy ? 'warning.main' : 'success.main', fontWeight: 600 }}
                    display="block"
                  >
                    {staff.busy ? 'Busy — no auto-accept' : staff.hours}
                  </Typography>
                  {staff.distanceLabel && (
                    <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700 }} display="block">
                      {staff.distanceLabel} away
                    </Typography>
                  )}
                </Box>
                <Iconify
                  icon={isSelected ? 'eva:checkmark-circle-2-fill' : 'eva:radio-button-off-outline'}
                  width={22}
                  sx={{ color: isSelected ? 'success.main' : 'text.disabled', flexShrink: 0 }}
                />
              </Box>
            );
          })}
        </Stack>
      </Box>
    </Portal>
  );
}
