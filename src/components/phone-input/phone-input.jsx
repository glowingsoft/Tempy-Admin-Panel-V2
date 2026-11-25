import { useState, useRef, forwardRef, useCallback, useEffect } from 'react';
import PhoneNumberInput from 'react-phone-number-input/input';

import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import { countries } from 'src/assets/data/countries';

import { DEFAULT_PHONE_COUNTRY, getCountryCode } from './utils';
import { CountryListPopover } from './list';

function callingCode(countryCode) {
  return String(countries.find((item) => item.code === countryCode)?.phone || '').replace(/\D/g, '');
}

function valueForCountry(value, fromCountry, toCountry) {
  const digits = String(value || '').replace(/\D/g, '');
  const nextCalling = callingCode(toCountry);
  if (!digits || !nextCalling) return undefined;

  const previousCalling = callingCode(fromCountry);
  const national =
    previousCalling && digits.startsWith(previousCalling)
      ? digits.slice(previousCalling.length)
      : '';
  if (!national) return undefined;

  return `+${nextCalling}${national}`;
}


export const PhoneInput = forwardRef(
  (
    {
      value,
      onChange,
      placeholder,
      country: inputCountryCode = DEFAULT_PHONE_COUNTRY,
      disableSelect,
      ...other
    },
    ref
  ) => {
    const [selectedCountry, setSelectedCountry] = useState(() =>
      getCountryCode(value, inputCountryCode)
    );
    const inputRef = useRef(null);

    useEffect(() => {
      if (!value) {
        setSelectedCountry(getCountryCode('', inputCountryCode));
      }
    }, [value, inputCountryCode]);

    useEffect(() => {
      setSelectedCountry((prev) => prev || getCountryCode('', inputCountryCode));
    }, [inputCountryCode]);

    const setInputRef = useCallback(
      (node) => {
        inputRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      },
      [ref]
    );

    const handleCountryChange = useCallback(
      (nextCountry) => {
        const nextValue = valueForCountry(value, selectedCountry, nextCountry);
        setSelectedCountry(nextCountry);
        if (nextValue && nextValue !== value) onChange?.(nextValue);
        window.setTimeout(() => inputRef.current?.focus(), 0);
      },
      [onChange, selectedCountry, value]
    );

    const country = selectedCountry || DEFAULT_PHONE_COUNTRY;

    return (
      <PhoneNumberInput
        ref={setInputRef}
        smartCaret={false}
        inputComponent={CustomInput}
        value={value || ''}
        onChange={(nextValue) => onChange?.(nextValue || '')}
        placeholder={placeholder ?? 'Enter phone number'}
        {...other}
        country={country}
        InputProps={
          disableSelect
            ? other.InputProps
            : {
              ...(other.InputProps || {}),
              startAdornment: (
                <InputAdornment position="start" sx={{ ml: 1 }}>
                  <CountryListPopover countryCode={country} onClickCountry={handleCountryChange} />
                </InputAdornment>
              ),
            }
        }
      />
    );
  }
);


const CustomInput = forwardRef(({ ...props }, ref) => <TextField inputRef={ref} {...props} />);
