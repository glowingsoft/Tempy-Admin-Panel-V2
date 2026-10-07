import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';

import { isOtpScreenPreviewEnabled } from './auth-flow-utils';

// ----------------------------------------------------------------------

export function OtpPreviewAlert({ otp, sx }) {
  if (!otp || !isOtpScreenPreviewEnabled()) {
    return null;
  }

  return (
    <Alert severity="info" sx={sx}>
      <Typography variant="body2">
        OTP (preview): <strong>{otp}</strong>
        {` — auto-filled (email not connected yet).`}
      </Typography>
    </Alert>
  );
}
