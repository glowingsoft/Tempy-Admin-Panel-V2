import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { SocialIcon } from 'src/components/iconify';

// ----------------------------------------------------------------------

const GOOGLE_BUTTON_SX = {
  py: 1.5,
  px: 2,
  minHeight: 52,
  borderRadius: '14px',
  bgcolor: '#fff',
  color: '#757575',
  fontWeight: 500,
  fontSize: '0.9375rem',
  lineHeight: 1.5,
  textTransform: 'none',
  boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.05)',
  border: 'none',
  gap: 1,
  '& .MuiButton-startIcon': {
    margin: 0,
    marginRight: '10px',
  },
  '&:hover': {
    bgcolor: '#fff',
    boxShadow: '0px 6px 14px rgba(0, 0, 0, 0.08)',
  },
  '&.Mui-disabled': {
    bgcolor: '#fff',
    color: 'text.disabled',
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.05)',
  },
};

// ----------------------------------------------------------------------

export function AuthSocialProviders({
  onGoogleClick,
  loadingProvider = null,
  disabled = false,
  compact = false,
  embedded = false,
  dividerLabel = 'Or continue with',
  googleLabel = 'Google',
  disabledHint = '',
}) {
  const googleLoading = loadingProvider === 'google';
  const isBusy = Boolean(loadingProvider);
  const googleDisabled = disabled || (isBusy && !googleLoading);
  const showDisabledHint = googleDisabled && Boolean(disabledHint);

  const googleButton = (
    <Button
      fullWidth
      type="button"
      disableElevation
      disabled={googleDisabled}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onGoogleClick?.(event);
      }}
      startIcon={
        googleLoading ? (
          <CircularProgress size={16} color="inherit" />
        ) : (
          <SocialIcon icon="google" width={compact ? 20 : 22} />
        )
      }
      sx={{
        ...GOOGLE_BUTTON_SX,
        minHeight: compact ? 44 : 52,
        py: compact ? 1.1 : 1.5,
        fontSize: compact ? '0.875rem' : '0.9375rem',
      }}
    >
      {googleLabel}
    </Button>
  );

  return (
    <Stack spacing={embedded ? 1.5 : 0} sx={{ width: 1 }}>
      <Divider
        sx={{
          my: embedded ? 0 : compact ? 1.5 : 2.5,
          typography: 'body2',
          color: 'text.disabled',
          '&::before, &::after': { borderTopStyle: 'dashed' },
        }}
      >
        {dividerLabel}
      </Divider>

      {showDisabledHint ? (
        <Tooltip title={disabledHint} placement="top" arrow>
          <Box component="span" sx={{ display: 'block', width: 1, cursor: 'not-allowed' }}>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mb: 0.75,
                textAlign: 'center',
                color: 'warning.darker',
                fontWeight: 700,
              }}
            >
              {disabledHint}
            </Typography>
            {googleButton}
          </Box>
        </Tooltip>
      ) : (
        googleButton
      )}
    </Stack>
  );
}
