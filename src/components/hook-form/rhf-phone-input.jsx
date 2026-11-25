import { Controller, useFormContext } from 'react-hook-form';

import { PhoneInput } from '../phone-input';
import { DEFAULT_PHONE_COUNTRY } from '../phone-input/utils';


export function RHFPhoneInput({ name, helperText, country = DEFAULT_PHONE_COUNTRY, ...other }) {
  const { control, setValue } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <PhoneInput
          {...field}
          fullWidth
          country={country}
          value={field.value}
          onChange={(newValue) => setValue(name, newValue || '', { shouldValidate: true })}
          error={!!error}
          helperText={error ? error?.message : helperText}
          {...other}
        />
      )}
    />
  );
}
