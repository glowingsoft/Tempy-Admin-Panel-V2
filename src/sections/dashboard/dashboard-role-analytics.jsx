import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';

import { CONFIG } from 'src/config-global';

import { AnalyticsCurrentVisits } from 'src/sections/overview/analytics/analytics-current-visits';
import { AnalyticsWebsiteVisits } from 'src/sections/overview/analytics/analytics-website-visits';
import { AnalyticsWidgetSummary } from 'src/sections/overview/analytics/analytics-widget-summary';
import { AnalyticsCurrentSubject } from 'src/sections/overview/analytics/analytics-current-subject';
import { AnalyticsConversionRates } from 'src/sections/overview/analytics/analytics-conversion-rates';

import { AppCurrentDownload } from 'src/sections/overview/app/app-current-download';

// ----------------------------------------------------------------------

const GLASS_ICONS = [
  'ic-glass-bag.svg',
  'ic-glass-users.svg',
  'ic-glass-buy.svg',
  'ic-glass-message.svg',
];

const GRID_SX = { display: 'flex', flexDirection: 'column' };
const CARD_SX = { height: 1, width: 1 };

/**
 * Shared pie / donut / bar / radar analytics block for customer & supplier dashboards.
 * Wrapped in its own full-width section so it never mixes with Quick access cards.
 */
export function DashboardRoleAnalytics({
  analytics,
  title = 'Overview',
  description = 'Key metrics and trends at a glance',
}) {
  const theme = useTheme();

  if (!analytics) return null;

  const {
    widgets = [],
    pie,
    donut,
    bar,
    conversion,
    radar,
  } = analytics;

  return (
    <Grid xs={12}>
      <Typography variant="h6" sx={{ mb: 0.5 }}>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
        {description}
      </Typography>

      <Grid container spacing={3}>
        {widgets.map((widget, index) => (
          <Grid key={widget.title} xs={12} sm={6} md={3} sx={GRID_SX}>
            <AnalyticsWidgetSummary
              title={widget.title}
              percent={widget.percent}
              total={widget.total}
              color={widget.color || 'primary'}
              icon={
                <img
                  alt=""
                  src={`${CONFIG.site.basePath}/assets/icons/glass/${GLASS_ICONS[index % GLASS_ICONS.length]}`}
                />
              }
              chart={{
                categories: widget.categories || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
                series: widget.series || [12, 18, 14, 22, 28, 16, 20, 24],
              }}
              sx={CARD_SX}
            />
          </Grid>
        ))}

        {pie && (
          <Grid xs={12} md={6} lg={4} sx={GRID_SX}>
            <AnalyticsCurrentVisits
              title={pie.title}
              chart={{
                series: pie.series,
                colors: pie.colors || [
                  theme.palette.primary.main,
                  theme.palette.info.main,
                  theme.palette.success.main,
                  theme.palette.warning.main,
                ],
              }}
              sx={CARD_SX}
            />
          </Grid>
        )}

        {bar && (
          <Grid xs={12} md={6} lg={8} sx={GRID_SX}>
            <AnalyticsWebsiteVisits
              title={bar.title}
              subheader={bar.subheader}
              chart={bar.chart}
              sx={CARD_SX}
            />
          </Grid>
        )}

        {donut && (
          <Grid xs={12} md={6} lg={4} sx={GRID_SX}>
            <AppCurrentDownload
              title={donut.title}
              subheader={donut.subheader}
              chart={{
                colors: donut.colors || [
                  theme.palette.info.main,
                  theme.palette.success.main,
                  theme.palette.warning.main,
                  theme.palette.error.main,
                ],
                series: donut.series,
              }}
              sx={CARD_SX}
            />
          </Grid>
        )}

        {conversion && (
          <Grid xs={12} md={6} lg={8} sx={GRID_SX}>
            <AnalyticsConversionRates
              title={conversion.title}
              subheader={conversion.subheader}
              chart={conversion.chart}
              sx={CARD_SX}
            />
          </Grid>
        )}

        {radar && (
          <Grid xs={12} md={6} lg={4} sx={GRID_SX}>
            <AnalyticsCurrentSubject title={radar.title} chart={radar.chart} sx={CARD_SX} />
          </Grid>
        )}
      </Grid>
    </Grid>
  );
}
