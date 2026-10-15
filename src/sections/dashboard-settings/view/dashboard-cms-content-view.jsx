import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { paths } from 'src/routes/paths';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { Iconify } from 'src/components/iconify';
import { ModuleLoading } from 'src/components/loading-screen';

import { SETTINGS_CONTENT_TYPES } from 'src/sections/dashboard-settings/dashboard-settings-api-utils';
import { RICH_TEXT_SX } from 'src/sections/dashboard-settings/rich-text-sx';

import { BRAND_GRADIENT, BRAND_SOFT_BG } from 'src/theme/brand-gradient';
import { varAlpha } from 'src/theme/styles';


const CONTENT_SX = {
  ...RICH_TEXT_SX,
  typography: 'body1',
  color: 'text.primary',
  lineHeight: 1.8,
  '& p': { mb: 2, color: 'text.secondary' },
  '& h1, & h2, & h3, & h4, & h5, & h6': {
    mt: 3,
    mb: 1.25,
    fontWeight: 700,
    color: 'text.primary',
  },
  '& h1': { typography: 'h4' },
  '& h2': { typography: 'h5' },
  '& h3': { typography: 'h6' },
  '& ul, & ol': { pl: 3, mb: 2, color: 'text.secondary' },
  '& li': { mb: 0.75 },
  '& a': { color: 'primary.main', fontWeight: 600 },
  '& strong, & b': { color: 'text.primary', fontWeight: 700 },
  '& blockquote': {
    m: 0,
    mb: 2,
    pl: 2,
    borderLeft: (theme) => `4px solid ${theme.vars.palette.primary.main}`,
    color: 'text.secondary',
    fontStyle: 'italic',
  },
};

export function DashboardCmsContentView({
  contentType = 'terms',
  dashboardRoot = '',
  accountKey = '',
  data,
  isLoading = false,
  isFetching = false,
  isError = false,
  errorMessage = '',
  onRetry,
}) {
  const meta = SETTINGS_CONTENT_TYPES[contentType] || SETTINGS_CONTENT_TYPES.terms;
  const title = data?.title || meta.titleFallback;
  const content = data?.content || '';
  const showContentTitle =
    Boolean(title) &&
    String(title).trim().toLowerCase() !== String(meta.heading || '').trim().toLowerCase();

  const loading = Boolean(isLoading);

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, pb: 5, pt: 3 }}>
      <CustomBreadcrumbs
        heading={meta.heading}
        links={[
          { name: 'Dashboard', href: dashboardRoot || paths.dashboard.root },
          { name: meta.heading },
        ]}
        sx={{ mb: { xs: 2.5, md: 3 } }}
      />

      <Card
        sx={{
          width: 1,
          overflow: 'hidden',
          border: (theme) => `1px solid ${theme.vars.palette.divider}`,
          boxShadow: (theme) => theme.customShadows?.card || theme.shadows[8],
        }}
      >
        <Box
          sx={{
            px: { xs: 2.5, md: 4 },
            py: { xs: 2.5, md: 3.5 },
            background: BRAND_GRADIENT,
            color: 'common.white',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              right: { xs: -36, md: 28 },
              top: { xs: -24, md: -18 },
              width: 160,
              height: 160,
              borderRadius: '50%',
              bgcolor: varAlpha('255 255 255', 0.1),
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              right: { xs: 40, md: 120 },
              bottom: -48,
              width: 110,
              height: 110,
              borderRadius: '50%',
              bgcolor: varAlpha('255 255 255', 0.08),
            }}
          />

          <Stack direction="row" spacing={2} alignItems="center" sx={{ position: 'relative' }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                flexShrink: 0,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: varAlpha('255 255 255', 0.18),
                border: `1px solid ${varAlpha('255 255 255', 0.28)}`,
              }}
            >
              <Iconify icon={meta.icon || 'solar:document-text-bold'} width={28} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="overline" sx={{ opacity: 0.85, letterSpacing: 1.1 }}>
                Help & Info
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.25, lineHeight: 1.35 }}>
                {meta.subtitle}
              </Typography>
            </Box>
          </Stack>
        </Box>

        {loading ? <ModuleLoading /> : null}

        <Box
          sx={{
            px: { xs: 2.5, md: 4 },
            py: { xs: 3, md: 4 },
            bgcolor: BRAND_SOFT_BG,
            minHeight: 280,
          }}
        >
          {!accountKey ? (
            <EmptyState
              title="Unavailable"
              description="Could not resolve this page for your account type."
            />
          ) : isError ? (
            <EmptyState
              icon="solar:danger-triangle-bold"
              iconColor="error.main"
              title={`Could not load ${meta.heading}`}
              description={errorMessage || `Could not load ${meta.heading.toLowerCase()}.`}
              action={
                onRetry ? (
                  <Button variant="outlined" color="inherit" onClick={onRetry}>
                    Retry
                  </Button>
                ) : null
              }
            />
          ) : !loading && !content ? (
            <EmptyState
              title="No content yet"
              description={`${meta.heading} content is not available right now.`}
            />
          ) : !loading ? (
            <Card
              elevation={0}
              sx={{
                p: { xs: 2.5, md: 3.5 },
                borderRadius: 2,
                bgcolor: 'background.paper',
                border: (theme) => `1px solid ${theme.vars.palette.divider}`,
              }}
            >
              <Stack spacing={2.5}>
                {showContentTitle ? (
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    {title}
                  </Typography>
                ) : null}

                {data?.isHtml ? (
                  <Box sx={CONTENT_SX} dangerouslySetInnerHTML={{ __html: content }} />
                ) : (
                  <Typography
                    variant="body1"
                    sx={{ color: 'text.secondary', whiteSpace: 'pre-line', lineHeight: 1.85 }}
                  >
                    {content}
                  </Typography>
                )}
              </Stack>
            </Card>
          ) : null}
        </Box>
      </Card>
    </Box>
  );
}

function EmptyState({
  title,
  description,
  action,
  icon = 'solar:document-text-bold',
  iconColor = 'text.disabled',
}) {
  return (
    <Stack
      spacing={1.5}
      alignItems="center"
      justifyContent="center"
      sx={{
        py: 8,
        px: 2,
        borderRadius: 2,
        bgcolor: 'background.paper',
        border: (theme) => `1px dashed ${theme.vars.palette.divider}`,
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: 2,
          display: 'grid',
          placeItems: 'center',
          bgcolor: BRAND_SOFT_BG,
        }}
      >
        <Iconify icon={icon} width={32} sx={{ color: iconColor }} />
      </Box>
      <Typography variant="subtitle1" fontWeight={700}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', maxWidth: 420 }}>
        {description}
      </Typography>
      {action}
    </Stack>
  );
}
