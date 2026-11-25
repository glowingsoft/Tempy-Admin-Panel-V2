import { parsePhoneNumber } from 'react-phone-number-input';

import { countries } from 'src/assets/data/countries';

export const DEFAULT_PHONE_COUNTRY = 'GB';



export function getCountryCode(_inputValue, countryCode) {
  return countryCode || DEFAULT_PHONE_COUNTRY;
}

export function detectCountryFromPhone(inputValue) {
  if (!inputValue) return null;
  try {
    const phoneNumber = parsePhoneNumber(String(inputValue));
    return phoneNumber?.country || null;
  } catch {
    return null;
  }
}


export function getCountry(countryCode) {
  const option = countries.filter((country) => country.code === countryCode)[0];
  return option;
}

export function applyFilter({ inputData, query }) {
  if (query) {
    return inputData.filter(
      (country) =>
        country.label.toLowerCase().indexOf(query.toLowerCase()) !== -1 ||
        country.code.toLowerCase().indexOf(query.toLowerCase()) !== -1 ||
        country.phone.toLowerCase().indexOf(query.toLowerCase()) !== -1
    );
  }

  return inputData;
}
