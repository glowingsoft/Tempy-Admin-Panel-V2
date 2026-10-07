// ----------------------------------------------------------------------

export const WEATHER_TYPES = {
  SUN: 'sun',
  CLOUD: 'cloud',
  PARTLY_CLOUDY: 'partly-cloudy',
  RAIN: 'rain',
};

export function getDayWeather(day) {
  const dayOfWeek = day.getDay();

  const weatherByDay = {
    0: WEATHER_TYPES.SUN,
    1: WEATHER_TYPES.CLOUD,
    2: WEATHER_TYPES.PARTLY_CLOUDY,
    3: WEATHER_TYPES.RAIN,
    4: WEATHER_TYPES.SUN,
    5: WEATHER_TYPES.PARTLY_CLOUDY,
    6: WEATHER_TYPES.RAIN,
  };

  return weatherByDay[dayOfWeek] || null;
}

/** @deprecated Use getDayWeather instead */
export function isRainyWeatherDay(day) {
  return getDayWeather(day) === WEATHER_TYPES.RAIN;
}
