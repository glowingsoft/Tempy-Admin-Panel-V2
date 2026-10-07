import { useEffect, useState } from 'react';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const PICKER_WIDTH = 150;
const PICKER_Z_INDEX = 1500;

function parseHHMM(hhmm, fallback = '09:00') {
  const source = hhmm || fallback;
  const [hourText, minuteText] = source.split(':');
  const hour24 = Number(hourText);
  const minute = Number(minuteText);

  if (!Number.isFinite(hour24) || !Number.isFinite(minute)) {
    return { hour24: 9, minute: 0 };
  }

  return {
    hour24: Math.min(23, Math.max(0, hour24)),
    minute: Math.min(59, Math.max(0, minute)),
  };
}

function toHHMM(hour24, minute) {
  return `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function formatPillDisplay(hhmm) {
  if (!hhmm) return '--:--';
  const { hour24, minute } = parseHHMM(hhmm);
  return toHHMM(hour24, minute);
}

function getTimePillSx(isStart, hasValue) {
  return {
    minWidth: 0,
    px: 0.75,
    py: 0.55,
    bgcolor: isStart && hasValue ? '#e3f2fd' : '#fff',
    borderRadius: 1,
    border: '1px solid',
    borderColor: isStart && hasValue ? '#90caf9' : '#d5d5d5',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    userSelect: 'none',
    '&:hover': {
      borderColor: isStart ? '#64b5f6' : '#bdbdbd',
    },
  };
}

const inputSx = {
  width: '100%',
  border: 'none',
  outline: 'none',
  bgcolor: 'transparent',
  textAlign: 'center',
  fontSize: 14,
  fontWeight: 600,
  fontVariantNumeric: 'tabular-nums',
  lineHeight: 1.2,
  color: '#424242',
  p: 0,
  fontFamily: 'inherit',
};

function EditableSpinnerColumn({ value, max, onChange, onUp, onDown, minWidth = 52 }) {
  const [text, setText] = useState(String(value).padStart(2, '0'));

  useEffect(() => {
    setText(String(value).padStart(2, '0'));
  }, [value]);

  const commit = (raw) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) {
      setText(String(value).padStart(2, '0'));
      return;
    }

    const num = Math.min(max, Math.max(0, Number(digits)));
    onChange(num);
    setText(String(num).padStart(2, '0'));
  };

  return (
    <Stack alignItems="center" spacing={0.25} sx={{ minWidth }}>
      <IconButton size="small" onClick={onUp} sx={{ p: 0.25, color: '#757575' }}>
        <Iconify icon="eva:chevron-up-fill" width={16} />
      </IconButton>

      <Box
        sx={{
          minWidth,
          px: 0.5,
          py: 0.5,
          border: '1px solid #e0e0e0',
          borderRadius: 1,
          bgcolor: '#fff',
          '&:focus-within': {
            borderColor: '#90caf9',
            boxShadow: '0 0 0 2px rgba(144, 202, 249, 0.35)',
          },
        }}
      >
        <Box
          component="input"
          inputMode="numeric"
          maxLength={2}
          value={text}
          onChange={(e) => {
            setText(e.target.value.replace(/\D/g, '').slice(0, 2));
          }}
          onBlur={() => commit(text)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              commit(text);
              e.currentTarget.blur();
            }
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          sx={inputSx}
        />
      </Box>

      <IconButton size="small" onClick={onDown} sx={{ p: 0.25, color: '#757575' }}>
        <Iconify icon="eva:chevron-down-fill" width={16} />
      </IconButton>
    </Stack>
  );
}

export function ShiftTimePickerPill({
  value,
  onChange,
  isStart = false,
  label = '',
  defaultTime = '09:00',
  timeInputToHHMM,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const normalized = timeInputToHHMM(value) || '';
  const display = formatPillDisplay(normalized);
  const open = Boolean(anchorEl);
  const [draft, setDraft] = useState(() => parseHHMM(normalized, defaultTime));

  const handleClose = () => setAnchorEl(null);

  const applyDraft = (nextDraft) => {
    setDraft(nextDraft);
    onChange(toHHMM(nextDraft.hour24, nextDraft.minute));
  };

  useEffect(() => {
    if (open) {
      setDraft(parseHHMM(normalized, defaultTime));
    }
  }, [open, normalized, defaultTime]);

  const bumpHour = (delta) => {
    let hour24 = draft.hour24 + delta;
    if (hour24 > 23) hour24 = 0;
    if (hour24 < 0) hour24 = 23;
    applyDraft({ ...draft, hour24 });
  };

  const bumpMinute = (delta) => {
    let minute = draft.minute + delta;
    if (minute > 59) minute = 0;
    if (minute < 0) minute = 59;
    applyDraft({ ...draft, minute });
  };

  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      {label ? (
        <Typography
          sx={{
            fontSize: 10,
            fontWeight: 600,
            color: '#9e9e9e',
            mb: 0.35,
            textAlign: 'center',
            lineHeight: 1,
            textTransform: 'uppercase',
            letterSpacing: 0.4,
          }}
        >
          {label}
        </Typography>
      ) : null}

      <Box onClick={(e) => setAnchorEl(e.currentTarget)} sx={getTimePillSx(isStart, Boolean(normalized))}>
        <Typography
          component="span"
          sx={{
            fontSize: 13,
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: 0.3,
            color: normalized ? (isStart ? '#1565c0' : '#424242') : '#9e9e9e',
          }}
        >
          {display}
        </Typography>
      </Box>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ zIndex: PICKER_Z_INDEX }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              width: PICKER_WIDTH,
              minWidth: PICKER_WIDTH,
              maxWidth: PICKER_WIDTH,
              zIndex: PICKER_Z_INDEX,
              overflow: 'visible',
              borderRadius: 1.5,
              boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -6,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderBottom: '6px solid #fff',
              },
            },
          },
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          spacing={0.5}
          sx={{ px: 1.25, py: 1.25 }}
        >
          <EditableSpinnerColumn
            value={draft.hour24}
            max={23}
            onChange={(hour24) => applyDraft({ ...draft, hour24 })}
            onUp={() => bumpHour(1)}
            onDown={() => bumpHour(-1)}
          />

          <Typography sx={{ fontSize: 16, fontWeight: 600, color: '#757575', px: 0.25 }}>:</Typography>

          <EditableSpinnerColumn
            value={draft.minute}
            max={59}
            onChange={(minute) => applyDraft({ ...draft, minute })}
            onUp={() => bumpMinute(1)}
            onDown={() => bumpMinute(-1)}
          />
        </Stack>
      </Popover>
    </Box>
  );
}
