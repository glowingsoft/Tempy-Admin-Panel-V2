import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { fNumber } from 'src/utils/format-number';

import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';
import { varAlpha } from 'src/theme/styles';

// ----------------------------------------------------------------------

export function DashboardStatCard({ title, total, icon, color = 'primary', href, sx, ...other }) {
  const theme = useTheme();
  const paletteColor = theme.vars.palette[color] || theme.vars.palette.primary;
  const isLink = Boolean(href);

  return (
    <Card
      component={isLink ? RouterLink : 'div'}
      href={isLink ? href : undefined}
      sx={{
        p: 2.5,
        height: 1,
        width: 1,
        minHeight: 124,
        overflow: 'hidden',
        position: 'relative',
        borderRadius: 3,
        boxShadow: theme.customShadows.card,
        textDecoration: 'none',
        color: 'inherit',
        display: 'block',
        transition: theme.transitions.create(['transform', 'box-shadow'], { duration: 200 }),
        ...(isLink
          ? {
              cursor: 'pointer',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: theme.customShadows.z8 || theme.shadows[8],
              },
            }
          : null),
        ...sx,
      }}
      {...other}
    >
      <Box
        sx={{
          position: 'absolute',
          top: -28,
          right: -24,
          width: 108,
          height: 108,
          borderRadius: '50%',
          bgcolor: varAlpha(paletteColor.mainChannel, 0.1),
        }}
      />
      {icon ? (
        <Box
          sx={{
            position: 'absolute',
            top: 18,
            right: 18,
            width: 44,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            bgcolor: varAlpha(paletteColor.mainChannel, 0.14),
            color: `${color}.main`,
            zIndex: 1,
          }}
        >
          <Iconify icon={icon} width={22} />
        </Box>
      ) : null}

      <Typography variant="body2" sx={{ color: 'text.secondary', pr: 7, fontWeight: 500 }}>
        {title}
      </Typography>
      <Typography variant="h3" sx={{ mt: 2, fontWeight: 800, letterSpacing: -0.5 }}>
        {fNumber(total)}
      </Typography>
      {isLink ? (
        <Typography
          variant="caption"
          sx={{
            mt: 1,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            color: `${color}.main`,
            fontWeight: 600,
          }}
        >
          View
          <Iconify icon="eva:arrow-ios-forward-fill" width={14} />
        </Typography>
      ) : null}
    </Card>
  );
}
