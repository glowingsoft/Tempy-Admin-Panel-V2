import { format } from 'date-fns';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';

import { RouterLink } from 'src/routes/components';

import { fNumber, fCurrency } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';
import { Chart, useChart } from 'src/components/chart';

import { DashboardEmptyState, hasChartValues } from 'src/sections/dashboard/dashboard-empty-state';

// ----------------------------------------------------------------------

function plural(count, word) {
  return `${fNumber(count)} ${word}${count === 1 ? '' : 's'}`;
}

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]
  );
}

/** "2026-09" → "September 2026"; falls back to the axis label. */
function monthTitle(month, fallback) {
  const [year, monthIndex] = String(month || '').split('-').map(Number);
  if (!year || !monthIndex) return fallback;
  return format(new Date(year, monthIndex - 1, 1), 'MMMM yyyy');
}

function compactCurrency(value) {
  return fCurrency(value, { notation: 'compact', maximumFractionDigits: 1 });
}

function StatBlock({ label, value, primary = false, marker }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Stack direction="row" alignItems="center" spacing={0.75}>
        {marker}
        <Typography variant="caption" noWrap sx={{ color: 'text.secondary' }}>
          {label}
        </Typography>
      </Stack>
      <Typography variant={primary ? 'h4' : 'h6'} noWrap>
        {value}
      </Typography>
    </Box>
  );
}

function Swatch({ color }) {
  return <Box sx={{ width: 10, height: 10, borderRadius: 0.5, flexShrink: 0, bgcolor: color }} />;
}

/**
 * Monthly earnings for supplier dashboards (agency, home care company, staff member).
 * `chart` is the mapped `earningsGraph`: { categories, series: [{ name, data }], total, points }.
 */
export function DashboardEarningsChart({
  title = 'Earnings',
  subheader = 'Completed shifts over the last 12 months',
  chart = {},
  href,
  ...other
}) {
  const theme = useTheme();

  const categories = Array.isArray(chart.categories) ? chart.categories : [];
  const series = Array.isArray(chart.series) ? chart.series : [];
  const points = Array.isArray(chart.points) ? chart.points : [];
  const data = series[0]?.data || [];
  const hasData = hasChartValues({ series });

  // The last month is the current one, still in progress.
  const currentIndex = data.length - 1;
  const thisMonth = data[currentIndex] || 0;
  const lastMonth = data[currentIndex - 1] || 0;
  // Average of completed months only, so the partial current month doesn't drag it down.
  const completedMonths = data.slice(0, -1);
  const average = completedMonths.length
    ? completedMonths.reduce((sum, value) => sum + value, 0) / completedMonths.length
    : 0;

  const completeColor = theme.palette.primary.main;
  const currentColor = theme.palette.primary.light;

  // Staff member only: shifts worked through an agency are paid by the agency, not shown here.
  const agencyShifts = chart.agencySupplied?.bookings || 0;
  const agencyNote = agencyShifts
    ? `${plural(agencyShifts, 'shift')} (${fNumber(chart.agencySupplied.hours)}h) worked through your agency are paid by them and not included here`
    : null;

  const chartOptions = useChart({
    colors: [
      ({ dataPointIndex }) => (dataPointIndex === currentIndex ? currentColor : completeColor),
    ],
    stroke: { width: 0 },
    xaxis: { categories },
    yaxis: {
      tickAmount: 4,
      labels: { formatter: compactCurrency },
    },
    annotations: {
      yaxis: average
        ? [
            {
              y: average,
              strokeDashArray: 4,
              borderColor: theme.palette.text.disabled,
              label: {
                text: `Monthly avg ${compactCurrency(average)}`,
                position: 'left',
                textAnchor: 'start',
                offsetX: 4,
                borderWidth: 0,
                style: {
                  background: 'transparent',
                  color: theme.vars.palette.text.secondary,
                  fontSize: '11px',
                  fontWeight: 600,
                },
              },
            },
          ]
        : [],
    },
    tooltip: {
      shared: true,
      intersect: false,
      custom: ({ dataPointIndex }) => {
        const point = points[dataPointIndex] || {};
        const monthLabel = monthTitle(point.month, categories[dataPointIndex] || '');
        const suffix = dataPointIndex === currentIndex ? ' · so far' : '';
        const details =
          point.bookings || point.hours
            ? `${plural(point.bookings, 'booking')} · ${fNumber(point.hours)}h`
            : 'No completed shifts';

        return `
          <div style="padding: 8px 12px; min-width: 140px;">
            <div style="font-size: 12px; color: ${theme.vars.palette.text.secondary}; margin-bottom: 4px;">
              ${escapeHtml(monthLabel)}${suffix}
            </div>
            <div style="font-size: 15px; font-weight: 700; color: ${theme.vars.palette.text.primary};">
              ${fCurrency(data[dataPointIndex] || 0)}
            </div>
            <div style="font-size: 12px; color: ${theme.vars.palette.text.secondary}; margin-top: 2px;">
              ${details}
            </div>
          </div>
        `;
      },
    },
    plotOptions: {
      bar: { columnWidth: '44%', borderRadius: 4, borderRadiusApplication: 'end' },
    },
    grid: { strokeDashArray: 3 },
  });

  return (
    <Card
      {...other}
      sx={{ width: 1, height: 1, display: 'flex', flexDirection: 'column', ...other.sx }}
    >
      <CardHeader
        title={title}
        subheader={subheader}
        action={
          href ? (
            <Button
              component={RouterLink}
              href={href}
              size="small"
              color="inherit"
              endIcon={<Iconify icon="eva:arrow-ios-forward-fill" width={16} />}
            >
              Details
            </Button>
          ) : null
        }
      />

      {hasData ? (
        <>
          <Stack
            direction="row"
            alignItems="flex-end"
            flexWrap="wrap"
            columnGap={4}
            rowGap={1.5}
            sx={{ px: 3, pt: 2 }}
          >
            <StatBlock label="Last 12 months" value={fCurrency(chart.total)} primary />
            <StatBlock
              label="This month so far"
              value={fCurrency(thisMonth)}
              marker={<Swatch color={currentColor} />}
            />
            <StatBlock label="Last month" value={fCurrency(lastMonth)} />
          </Stack>

          {agencyNote && (
            <Typography variant="caption" sx={{ px: 3, pt: 1.5, color: 'text.secondary' }}>
              {agencyNote}
            </Typography>
          )}

          <Chart
            type="bar"
            series={series}
            options={chartOptions}
            height={260}
            aria-label={`Monthly earnings for the last 12 months, ${fCurrency(chart.total)} in total`}
            role="img"
            sx={{ pt: 1, pb: 2, pl: 1, pr: 2.5 }}
          />
        </>
      ) : (
        <DashboardEmptyState
          message={agencyNote ? 'No direct earnings yet' : 'No earnings yet'}
          hint={agencyNote || 'Completed shifts will show here once they are paid'}
          minHeight={260}
        />
      )}
    </Card>
  );
}
