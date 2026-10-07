import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

import { layoutClasses } from 'src/layouts/classes';


export function Main({ sx, children, layoutQuery, hideHeader = false, compact = false, ...other }) {
  const theme = useTheme();

  const renderContent = (
    <Box
      sx={{
        py: compact ? 2.25 : 5,
        px: compact ? 2.5 : 3,
        width: 1,
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
        boxShadow: theme.customShadows.card,
        maxWidth: 'var(--layout-auth-content-width)',
      }}
    >
      {children}
    </Box>
  );

  return (
    <Box
      component="main"
      className={layoutClasses.main}
      sx={{
        px: 2,
        py: compact ? '10px' : 5,
        zIndex: 9,
        display: 'flex',
        flex: '1 1 auto',
        alignItems: 'center',
        flexDirection: 'column',
        justifyContent: 'center',
        minHeight: compact ? '100dvh' : undefined,
        height: compact ? '100dvh' : undefined,
        overflow: compact ? 'hidden' : undefined,
        boxSizing: 'border-box',
        [theme.breakpoints.up(layoutQuery)]: {
          px: 0,
          py: hideHeader ? (compact ? '10px' : 5) : 'calc(var(--layout-header-desktop-height) + 24px)',
        },
        ...sx,
      }}
      {...other}
    >
      {renderContent}
    </Box>
  );
}
