import Button from '@mui/material/Button';

import { RouterLink } from 'src/routes/components';

import { TEMPY_GRADIENT_BUTTON, TEMPY_GRADIENT_BUTTON_HOVER } from './tempy-theme';


export function TempyButton({ href, children, fullWidth, size = 'medium', sx, ...other }) {
  return (
    <Button
      component={href ? RouterLink : 'button'}
      href={href}
      variant="contained"
      size={size}
      fullWidth={fullWidth}
      sx={{
        borderRadius: 1.5,
        fontWeight: 700,
        color: '#fff',
        background: TEMPY_GRADIENT_BUTTON,
        boxShadow: '0 8px 24px rgba(112, 90, 235, 0.28)',
        '&:hover': {
          background: TEMPY_GRADIENT_BUTTON_HOVER,
          boxShadow: '0 10px 28px rgba(10, 117, 135, 0.34)',
        },
        ...sx,
      }}
      {...other}
    >
      {children}
    </Button>
  );
}
