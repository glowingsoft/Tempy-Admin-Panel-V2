import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import { format } from 'date-fns';

import { ShiftWeatherIcon } from 'src/components/weather/shift-weather-icon';
import { getDayWeather } from 'src/components/weather/shift-weather-utils';

// ----------------------------------------------------------------------

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
  const tooltip = clickable
    ? [clickHint || `Request staff for ${dateLabel}`, weatherTooltip].filter(Boolean).join(' · ')
    : weatherTooltip;

  const content = (
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

  const cellSx = {
    width: dayColWidth,
    minWidth: dayColWidth,
    borderRight: (theme) =>
      `1px solid ${
        typeof gridLine === 'string' && gridLine
          ? gridLine
          : theme.palette.mode === 'dark'
            ? theme.vars.palette.divider
            : '#e0e0e0'
      }`,
    py: 0.5,
    px: 0.25,
    flexShrink: 0,
    alignSelf: 'stretch',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  if (!clickable) {
    return (
      <Box sx={cellSx}>
        {tooltip ? (
          <Tooltip title={tooltip} arrow placement="bottom" disableInteractive>
            <Box sx={{ minWidth: 0, maxWidth: '100%' }}>{content}</Box>
          </Tooltip>
        ) : (
          content
        )}
      </Box>
    );
  }

  const button = (
    <ButtonBase
      data-date-header="true"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick(day);
      }}
      sx={{
        ...cellSx,
        cursor: 'pointer',
        '&:hover': {
          bgcolor: 'action.hover',
        },
      }}
    >
      {content}
    </ButtonBase>
  );

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
      {button}
    </Tooltip>
  );
}
