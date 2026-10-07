import { Controller, useFormContext } from 'react-hook-form';

import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';

import { AUTH_ROLE_OPTIONS, getAuthRoleOption } from './auth-role-options';

// ----------------------------------------------------------------------

export function AuthRoleSelect({
  name = 'role',
  showComingSoon = false,
  label = 'Select Role',
  options = AUTH_ROLE_OPTIONS,
  placeholder = 'Select role',
  helperText,
  ...other
}) {
  const { control } = useFormContext();
  const labelId = `${name}-select-label`;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          select
          fullWidth
          label={label}
          value={field.value || ''}
          SelectProps={{
            displayEmpty: true,
            MenuProps: {
              PaperProps: { sx: { maxHeight: 300 } },
            },
            renderValue: (selected) => getAuthRoleOption(selected)?.label || placeholder,
          }}
          InputLabelProps={{ htmlFor: labelId, shrink: true }}
          inputProps={{ id: labelId }}
          error={!!error}
          helperText={error?.message || helperText}
          {...other}
        >
          <MenuItem value="" disabled>
            {placeholder}
          </MenuItem>
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
              {showComingSoon && !option.signupEnabled ? ' (coming soon)' : ''}
            </MenuItem>
          ))}
        </TextField>
      )}
    />
  );
}
