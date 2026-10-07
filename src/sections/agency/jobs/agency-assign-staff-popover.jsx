import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Portal from '@mui/material/Portal';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const POPOVER_W = 300;
const POPOVER_H = 360;
const POPOVER_GAP = 10;
const VIEWPORT_PAD = 16;

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
}) {
  if (!anchor) return null;

  const filtered = staffList.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));
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
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
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
            sx: { borderRadius: 5, bgcolor: '#f5f5f5', '& fieldset': { border: 'none' } },
          }}
          sx={{ mb: 2 }}
        />

        <Typography variant="caption" fontWeight={700} sx={{ display: 'block', mb: 1 }}>
          Available Staff for this shift
        </Typography>

        <Stack spacing={1}>
          {filtered.map((staff) => {
            const isSelected = selectedStaffId === staff.id;
            return (
              <Box
                key={staff.id}
                onClick={() => onSelectStaff(staff.id)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  p: 1,
                  borderRadius: 1.5,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Avatar src={staff.avatarUrl} sx={{ width: 40, height: 40 }}>
                  {staff.initials}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" fontWeight={700} noWrap>
                    {staff.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }} display="block">
                    {staff.hours}
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
