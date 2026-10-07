import { useCallback } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import {
  ADDRESS_COORDINATES_HELPER,
  applyAddressPlaceToForm,
} from 'src/sections/branches/address-form-utils';
import { StandaloneAddressInput } from 'src/sections/tempy-home/standalone-address-input';

// ----------------------------------------------------------------------

export function RHFStandaloneAddress({
  name,
  label = 'Location',
  helperText,
  placeholder,
  onPlaceApplied,
  size = 'small',
  ...other
}) {
  const { control, setValue, clearErrors } = useFormContext();

  const applyPlace = useCallback(
    (place) => {
      applyAddressPlaceToForm(setValue, place, {
        addressField: name,
        updateSearchLabel: true,
      });
      clearErrors(name);
      onPlaceApplied?.(place);
    },
    [clearErrors, name, onPlaceApplied, setValue]
  );

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <StandaloneAddressInput
          value={typeof field.value === 'string' ? field.value : ''}
          onChange={field.onChange}
          onPlaceSelect={applyPlace}
          label={label}
          size={size}
          labelPlacement="outlined"
          placeholder={placeholder ?? 'Search address or city...'}
          error={Boolean(error)}
          helperText={error?.message || helperText || ADDRESS_COORDINATES_HELPER}
          {...other}
        />
      )}
    />
  );
}
