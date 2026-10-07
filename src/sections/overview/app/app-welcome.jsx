import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { BRAND_GRADIENT_CSS } from 'src/theme/brand-gradient';
import { varAlpha, bgGradient } from 'src/theme/styles';

// ----------------------------------------------------------------------

export function AppWelcome({ title, description, action, img, sx, ...other }) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        ...bgGradient({
          color: BRAND_GRADIENT_CSS,
        }),
        pt: 5,
        pb: 5,
        pr: 3,
        gap: 5,
        borderRadius: 2,
        display: 'flex',
        height: { md: 1 },
        position: 'relative',
        pl: { xs: 3, md: 5 },
        alignItems: 'center',
        color: 'common.white',
        textAlign: { xs: 'center', md: 'left' },
        flexDirection: { xs: 'column', md: 'row' },
        border: `solid 1px ${varAlpha(theme.vars.palette.common.whiteChannel, 0.2)}`,
        overflow: 'hidden',
        ...sx,
      }}
      {...other}
    >
      <Box
        sx={{
          display: 'flex',
          flex: '1 1 auto',
          flexDirection: 'column',
          alignItems: { xs: 'center', md: 'flex-start' },
        }}
      >
        <Typography variant="h4" sx={{ whiteSpace: 'pre-line', mb: 1 }}>
          {title}
        </Typography>

        <Typography variant="body2" sx={{ opacity: 0.85, maxWidth: 360, ...(action && { mb: 3 }) }}>
          {description}
        </Typography>

        {action && action}
      </Box>

      {img && <Box sx={{ maxWidth: 260 }}>{img}</Box>}
    </Box>
  );
}
