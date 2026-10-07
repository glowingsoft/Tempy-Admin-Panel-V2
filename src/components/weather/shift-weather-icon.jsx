import Box from '@mui/material/Box';

import { AnimatedRainIcon } from './animated-rain-icon';
import { WEATHER_TYPES } from './shift-weather-utils';

// ----------------------------------------------------------------------

function StaticWeatherSvg({ children, size, color }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 24 24"
      sx={{
        width: size,
        height: size,
        display: 'block',
        color,
        flexShrink: 0,
      }}
    >
      {children}
    </Box>
  );
}

function SunIcon({ size = 16, color = '#F9A825' }) {
  return (
    <StaticWeatherSvg size={size} color={color}>
      <circle cx="12" cy="12" r="4" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <line x1="12" y1="2.5" x2="12" y2="5" />
        <line x1="12" y1="19" x2="12" y2="21.5" />
        <line x1="2.5" y1="12" x2="5" y2="12" />
        <line x1="19" y1="12" x2="21.5" y2="12" />
        <line x1="5.3" y1="5.3" x2="7.1" y2="7.1" />
        <line x1="16.9" y1="16.9" x2="18.7" y2="18.7" />
        <line x1="5.3" y1="18.7" x2="7.1" y2="16.9" />
        <line x1="16.9" y1="7.1" x2="18.7" y2="5.3" />
      </g>
    </StaticWeatherSvg>
  );
}

function CloudIcon({ size = 16, color = '#90A4AE' }) {
  return (
    <StaticWeatherSvg size={size} color={color}>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 18a4 4 0 1 1 .8-7.9A5.5 5.5 0 0 1 18.5 9.5 4.5 4.5 0 0 1 17 18H7z"
      />
    </StaticWeatherSvg>
  );
}

function PartlyCloudyIcon({ size = 16, sunColor = '#F9A825', cloudColor = '#90A4AE' }) {
  return (
    <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <Box
        component="svg"
        viewBox="0 0 24 24"
        sx={{
          position: 'absolute',
          top: -1,
          left: -1,
          width: size * 0.65,
          height: size * 0.65,
          color: sunColor,
        }}
      >
        <circle cx="10" cy="10" r="3.5" fill="currentColor" />
      </Box>
      <Box
        component="svg"
        viewBox="0 0 24 24"
        sx={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: size * 0.85,
          height: size * 0.85,
          color: cloudColor,
        }}
      >
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7 18a4 4 0 1 1 .8-7.9A5.5 5.5 0 0 1 18.5 9.5 4.5 4.5 0 0 1 17 18H7z"
        />
      </Box>
    </Box>
  );
}

export function ShiftWeatherIcon({ type, size = 16 }) {
  switch (type) {
    case WEATHER_TYPES.SUN:
      return <SunIcon size={size} />;
    case WEATHER_TYPES.CLOUD:
      return <CloudIcon size={size} />;
    case WEATHER_TYPES.PARTLY_CLOUDY:
      return <PartlyCloudyIcon size={size} />;
    case WEATHER_TYPES.RAIN:
      return <AnimatedRainIcon size={size} />;
    default:
      return null;
  }
}
