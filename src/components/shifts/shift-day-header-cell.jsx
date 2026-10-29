import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { format } from 'date-fns';

import { Iconify } from 'src/components/iconify';
import { ShiftWeatherIcon } from 'src/components/weather/shift-weather-icon';
import { getDayWeather } from 'src/components/weather/shift-weather-utils';


export { getDayWeather, isRainyWeatherDay } from 'src/components/weather/shift-weather-utils';

function buildWeatherTooltip(dayWeather) {
  if (!dayWeather) return '';
  const parts = [];
  if (Number.isFinite(dayWeather.temperature)) parts.push(`${dayWeather.temperature}°C`);
  if (Number.isFinite(dayWeather.uvIndex)) parts.push(`UV ${dayWeather.uvIndex}`);
  if (Number.isFinite(dayWeather.humidityMin) && Number.isFinite(dayWeather.humidityMax)) {
    parts.push(`Humidity ${dayWeather.humidityMin}–${dayWeather.humidityMax}%`);
  }
  if (dayWeather.sunrise) parts.push(`↑ ${String(dayWeather.sunrise).slice(11, 16) || dayWeather.sunrise}`);
  if (dayWeather.sunset) parts.push(`↓ ${String(dayWeather.sunset).slice(11, 16) || dayWeather.sunset}`);
  return parts.join(' · ');
}

export function ShiftDayHeaderCell({
  day,
  hours,
  dayColWidth,
  gridLine,
  weatherType = null,
  dayWeather = null,
  onClick,
  clickHint = '',
  hideWeather = false,
  hideHours = false,
}) {
  const weather = hideWeather ? null : weatherType || getDayWeather(day);
  const hasWeatherIcon = Boolean(weather);
  const clickable = typeof onClick === 'function';
  const weatherTooltip = buildWeatherTooltip(dayWeather);
  const dateLabel = format(day, 'EEE d MMM');
  const requestHint = clickHint || `Request a shift for ${dateLabel}`;
  const tooltip = clickable
    ? [requestHint, weatherTooltip].filter(Boolean).join(' · ')
    : weatherTooltip;

  const handleRequest = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onClick?.(day);
  };

  const cellSx = {
    width: dayColWidth,
    minWidth: dayColWidth,
    borderRight: (theme) =>
      `1px solid ${typeof gridLine === 'string' && gridLine ? gridLine : theme.vars.palette.divider
      }`,
    py: 0.35,
    px: 0.25,
    flexShrink: 0,
    alignSelf: 'stretch',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0.15,
    ...(clickable
      ? {
          cursor: 'pointer',
          '&:hover': { bgcolor: 'action.hover' },
        }
      : null),
  };

  const dateBlock = (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="center"
      spacing={0.5}
      sx={{ minWidth: 0, maxWidth: '100%' }}
    >
      {hasWeatherIcon ? <ShiftWeatherIcon type={weather} size={16} /> : null}

      <Box sx={{ minWidth: 0, textAlign: hasWeatherIcon ? 'left' : 'center' }}>
        <Typography
          component="div"
          sx={{
            fontSize: 10.5,
            fontWeight: 600,
            color: '#616161',
            lineHeight: 1.25,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {dateLabel}
        </Typography>
        <Typography
          component="div"
          sx={{
            fontSize: 10,
            color: '#9e9e9e',
            lineHeight: 1.25,
            mt: 0.15,
          }}
        >
          {hideHours
            ? '\u00a0'
            : Number.isFinite(dayWeather?.temperature)
              ? `${hours.toFixed(1)}h · ${dayWeather.temperature}°`
              : `${hours.toFixed(1)}h`}
        </Typography>
      </Box>
    </Stack>
  );

  const cell = (
    <Box
      data-date-header="true"
      onClick={clickable ? handleRequest : undefined}
      sx={cellSx}
    >
      {dateBlock}

      {clickable ? (
        <IconButton
          size="small"
          aria-label={requestHint}
          onClick={handleRequest}
          sx={{
            width: 22,
            height: 22,
            color: 'primary.main',
            '&:hover': { bgcolor: 'action.selected' },
          }}
        >
          <Iconify icon="eva:plus-fill" width={14} />
        </IconButton>
      ) : null}
    </Box>
  );

  if (!tooltip) return cell;

  return (
    <Tooltip
      title={tooltip}
      arrow
      placement="bottom"
      disableInteractive
      slotProps={{
        popper: {
          sx: { pointerEvents: 'none' },
        },
      }}
    >
      {cell}
    </Tooltip>
  );
}
