import { useState, forwardRef, useCallback } from 'react';
import PhoneNumberInput from 'react-phone-number-input/input';

import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import { countries } from 'src/assets/data/countries';

import { getCountryCode } from './utils';
import { CountryListPopover } from './list';

function callingCode(countryCode) {
  return String(countries.find((item) => item.code === countryCode)?.phone || '').replace(/\D/g, '');
}

/** Keep the typed digits and apply the newly selected country's calling code. */
function valueForCountry(value, fromCountry, toCountry) {
  const digits = String(value || '').replace(/\D/g, '');
  const nextCalling = callingCode(toCountry);
  if (!digits || !nextCalling) return undefined;

  const previousCalling = callingCode(fromCountry);
  const national =
    previousCalling && digits.startsWith(previousCalling) ? digits.slice(previousCalling.length) : '';
  if (!national) return undefined;

  return `+${nextCalling}${national}`;
}

// ----------------------------------------------------------------------

export const PhoneInput = forwardRef(
  ({ value, onChange, placeholder, country: inputCountryCode, disableSelect, ...other }, ref) => {
    const defaultCountryCode = getCountryCode(value, inputCountryCode);

    const [selectedCountry, setSelectedCountry] = useState(defaultCountryCode);

    const handleCountryChange = useCallback(
      (nextCountry) => {
        const nextValue = valueForCountry(value, selectedCountry, nextCountry);
        setSelectedCountry(nextCountry);
        if (nextValue && nextValue !== value) onChange?.(nextValue);
      },
      [onChange, selectedCountry, value]
    );

    return (
      <PhoneNumberInput
        ref={ref}
        country={selectedCountry}
        inputComponent={CustomInput}
        value={value}
        onChange={onChange}
        placeholder={placeholder ?? 'Enter phone number'}
        InputProps={
          disableSelect
            ? undefined
            : {
                startAdornment: (
                  <InputAdornment position="start" sx={{ ml: 1 }}>
                    <CountryListPopover countryCode={selectedCountry} onClickCountry={handleCountryChange} />
                  </InputAdornment>
                ),
              }
        }
        {...other}
      />
    );
  }
);

// ----------------------------------------------------------------------

const CustomInput = forwardRef(({ ...props }, ref) => <TextField inputRef={ref} {...props} />);
