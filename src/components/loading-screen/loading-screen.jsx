import Box from '@mui/material/Box';
import Portal from '@mui/material/Portal';

import { AnimateLogo1 } from 'src/components/animate';

// ----------------------------------------------------------------------

export function LoadingScreen({ portal, sx, ...other }) {
  const content = (
    <Box
      sx={{
        px: 5,
        width: 1,
        flexGrow: 1,
        minHeight: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...sx,
      }}
      {...other}
    >
      <AnimateLogo1 />
    </Box>
  );

  if (portal) {
    return <Portal>{content}</Portal>;
  }

  return content;
}

/**
 * In-page module loader: the same animated logo, padded to sit inside page content.
 * Use it when a module has nothing to show yet; use a thin LinearProgress for
 * refreshes over visible content and inside drawers / dialogs.
 */
export function ModuleLoading({ sx, ...other }) {
  return <LoadingScreen role="status" aria-label="Loading" sx={{ py: 8, ...sx }} {...other} />;
}
