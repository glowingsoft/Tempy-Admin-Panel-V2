import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Rating from '@mui/material/Rating';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';
import { varAlpha } from 'src/theme/styles';

// ----------------------------------------------------------------------

export function DashboardNavCard({
  title,
  description,
  value,
  icon,
  href,
  color = 'primary',
  showStars = false,
  rating = 0,
}) {
  const theme = useTheme();
  const paletteColor = theme.vars.palette[color] || theme.vars.palette.primary;

  return (
    <Card
      component={RouterLink}
      href={href}
      sx={{
        px: 2.5,
        py: 2.25,
        height: 1,
        width: 1,
        minHeight: 96,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        textDecoration: 'none',
        color: 'inherit',
        borderRadius: 3,
        bgcolor: varAlpha(paletteColor.mainChannel, 0.08),
        border: `1px solid ${varAlpha(paletteColor.mainChannel, 0.16)}`,
        boxShadow: `0 8px 24px -8px ${varAlpha(paletteColor.mainChannel, 0.2)}`,
        transition: theme.transitions.create(['transform', 'box-shadow'], { duration: 200 }),
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: `0 14px 28px -10px ${varAlpha(paletteColor.mainChannel, 0.28)}`,
        },
      }}
    >
      <Box
        sx={{
          width: 52,
          height: 52,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          bgcolor: varAlpha(paletteColor.mainChannel, 0.16),
          color: `${color}.main`,
        }}
      >
        <Iconify icon={icon} width={26} />
      </Box>

      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3, minWidth: 0 }}>
            {title}
          </Typography>
          {value != null && value !== '' && (
            <Typography variant="subtitle2" sx={{ color: `${color}.main`, flexShrink: 0 }}>
              {value}
            </Typography>
          )}
        </Stack>
        {showStars ? (
          <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 0.5 }}>
            <Rating
              size="small"
              max={5}
              precision={1}
              value={Number(rating) || 0}
              readOnly
              sx={{ color: 'warning.main' }}
            />
            <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: 0 }}>
              {description || '1–5 stars'}
            </Typography>
          </Stack>
        ) : (
          <Typography
            variant="body2"
            sx={{ mt: 0.25, color: 'text.secondary', opacity: 0.85 }}
          >
            {description}
          </Typography>
        )}
      </Box>

      <Iconify
        icon="solar:arrow-right-up-linear"
        width={20}
        sx={{ color: `${color}.main`, flexShrink: 0 }}
      />
    </Card>
  );
}
