import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { RouterLink } from 'src/routes/components';

import { CONFIG } from 'src/config-global';
import { varAlpha, bgGradient } from 'src/theme/styles';

// ----------------------------------------------------------------------

export function Section({
  sx,
  method,
  layoutQuery,
  methods,
  title = 'Manage the job',
  imgUrl = `${CONFIG.site.basePath}/assets/illustrations/illustration-dashboard.webp`,
  imgNode,
  imgSx,
  subtitle = 'More effectively with optimized workflows.',
  titleVariant = 'h3',
  contentGap,
  ...other
}) {
  const theme = useTheme();
  const resolvedGap = contentGap ?? (title || subtitle ? 8 : 0);

  return (
    <Box
      sx={{
        ...bgGradient({
          color: `0deg, ${varAlpha(
            theme.vars.palette.background.defaultChannel,
            0.92
          )}, ${varAlpha(theme.vars.palette.background.defaultChannel, 0.92)}`,
          imgUrl: `${CONFIG.site.basePath}/assets/background/background-3-blur.webp`,
        }),
        px: 3,
        pb: 3,
        width: 1,
        maxWidth: 480,
        display: 'none',
        position: 'relative',
        pt: 'var(--layout-header-desktop-height)',
        [theme.breakpoints.up(layoutQuery)]: {
          gap: resolvedGap,
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'column',
          justifyContent: 'center',
        },
        ...sx,
      }}
      {...other}
    >
      {(title || subtitle) && (
        <Box sx={{ width: 1, maxWidth: 400, px: 1 }}>
          {title ? (
            <Typography variant={titleVariant} sx={{ textAlign: 'center', fontWeight: 700 }}>
              {title}
            </Typography>
          ) : null}

          {subtitle ? (
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                textAlign: 'center',
                mt: title ? 1 : 0,
                lineHeight: 1.6,
              }}
            >
              {subtitle}
            </Typography>
          ) : null}
        </Box>
      )}

      {imgNode || (
        <Box
          component="img"
          alt="Illustration"
          src={imgUrl}
          sx={{
            width: 1,
            maxWidth: 360,
            aspectRatio: '4/3',
            objectFit: 'contain',
            ...imgSx,
          }}
        />
      )}

      {!!methods?.length && method && (
        <Box component="ul" gap={2} display="flex">
          {methods.map((option) => {
            const selected = method === option.label.toLowerCase();

            return (
              <Box
                key={option.label}
                component="li"
                sx={{
                  ...(!selected && {
                    cursor: 'not-allowed',
                    filter: 'grayscale(1)',
                  }),
                }}
              >
                <Tooltip title={option.label} placement="top">
                  <Link
                    component={RouterLink}
                    href={option.path}
                    sx={{
                      ...(!selected && { pointerEvents: 'none' }),
                    }}
                  >
                    <Box
                      component="img"
                      alt={option.label}
                      src={option.icon}
                      sx={{ width: 32, height: 32 }}
                    />
                  </Link>
                </Tooltip>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
