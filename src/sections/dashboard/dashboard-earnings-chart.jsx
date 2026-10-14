import { format } from 'date-fns';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';

import { RouterLink } from 'src/routes/components';

import { fNumber, fCurrency } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';
import { varAlpha } from 'src/theme/styles';

import { DashboardEmptyState, hasChartValues } from 'src/sections/dashboard/dashboard-empty-state';

// ----------------------------------------------------------------------

function plural(count, word) {
  return `${fNumber(count)} ${word}${count === 1 ? '' : 's'}`;
}

function money(value) {
  return fCurrency(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** "2026-09" or "September" → "Sep". */
function shortMonth(category, month) {
  const source = String(month || category || '').trim();
  const [year, monthIndex] = source.split('-').map(Number);
  if (year && monthIndex) return format(new Date(year, monthIndex - 1, 1), 'MMM');

  const named = Date.parse(`1 ${source}`);
  if (!Number.isNaN(named)) return format(new Date(named), 'MMM');

  return source.slice(0, 3);
}

function fullMonth(category, month) {
  const source = String(month || category || '').trim();
  const [year, monthIndex] = source.split('-').map(Number);
  if (year && monthIndex) return format(new Date(year, monthIndex - 1, 1), 'MMMM yyyy');
  return source || 'Month';
}

function SummaryTile({ label, value, hint, icon, color }) {
  const theme = useTheme();
  const paletteColor = theme.vars.palette[color] || theme.vars.palette.primary;

  return (
    <Box
      sx={{
        minWidth: 0,
        p: 1.75,
        borderRadius: 2,
        bgcolor: varAlpha(paletteColor.mainChannel, 0.08),
        border: `1px solid ${varAlpha(paletteColor.mainChannel, 0.16)}`,
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box
          sx={{
            width: 40,
            height: 40,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 1.5,
            color: `${color}.darker`,
            bgcolor: varAlpha(paletteColor.mainChannel, 0.16),
          }}
        >
          <Iconify icon={icon} width={20} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', overflowWrap: 'break-word' }}>
            {label}
          </Typography>
          <Typography variant="h6" noWrap>
            {value}
          </Typography>
          {hint ? (
            <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', overflowWrap: 'break-word' }}>
              {hint}
            </Typography>
          ) : null}
        </Box>
      </Stack>
    </Box>
  );
}

function MonthBar({ value, max, label, title, color, track }) {
  const height = max > 0 ? (value / max) * 132 : 0;

  return (
    <Tooltip title={title} arrow placement="top">
      <Stack
        alignItems="center"
        justifyContent="flex-end"
        sx={{ flex: 1, minWidth: 0, height: 1, cursor: 'default' }}
      >
        <Box
          sx={{
            width: '68%',
            maxWidth: 22,
            height: value > 0 ? Math.max(height, 8) : 4,
            borderRadius: value > 0 ? '6px 6px 2px 2px' : 1,
            bgcolor: value > 0 ? color : track,
          }}
        />
        <Typography
          variant="caption"
          sx={{ mt: 0.75, fontSize: 11, lineHeight: 1.2, color: 'text.secondary', fontWeight: 600 }}
        >
          {label}
        </Typography>
      </Stack>
    </Tooltip>
  );
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

  const currentIndex = data.length - 1;
  const thisMonth = data[currentIndex] || 0;
  const lastMonth = data[currentIndex - 1] || 0;
  const completedMonths = data.slice(0, -1);
  const average = completedMonths.length
    ? completedMonths.reduce((sum, value) => sum + value, 0) / completedMonths.length
    : 0;
  const max = Math.max(...data.map((value) => Number(value) || 0), 0);

  const totalBookings = points.reduce((sum, point) => sum + (Number(point?.bookings) || 0), 0);
  const totalHours = points.reduce((sum, point) => sum + (Number(point?.hours) || 0), 0);
  const thisPoint = points[currentIndex] || {};
  const lastPoint = points[currentIndex - 1] || {};

  const upcoming = chart.upcoming && typeof chart.upcoming === 'object' ? chart.upcoming : null;
  const upcomingValue = upcoming ? upcoming.formatted || money(upcoming.amount) : '';

  const agencyShifts = chart.agencySupplied?.bookings || 0;
  const agencyNote = agencyShifts
    ? `${plural(agencyShifts, 'shift')} (${fNumber(chart.agencySupplied.hours)}h) worked through your agency are paid by them and not included here`
    : null;

  const completeColor = theme.palette.primary.main;
  const currentColor = theme.palette.info.main;
  const track = varAlpha(theme.vars.palette.grey['500Channel'], 0.16);

  const shiftHint = (point) => {
    const bookings = Number(point?.bookings) || 0;
    const hours = Number(point?.hours) || 0;
    if (!bookings && !hours) return '';
    return `${plural(bookings, 'booking')} · ${fNumber(hours)}h`;
  };

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

      {hasData || upcoming ? (
        <>
          <Box
            sx={{
              px: 3,
              pt: 1,
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: {
                xs: '1fr',
                sm: hasData ? 'repeat(2, minmax(0, 1fr))' : 'minmax(0, 360px)',
                lg: `repeat(${hasData ? (upcoming ? 4 : 3) : 1}, minmax(0, 1fr))`,
              },
            }}
          >
            {hasData ? (
              <>
                <SummaryTile
                  label="Last 12 months"
                  value={money(chart.total)}
                  hint={
                    totalBookings || totalHours
                      ? `${plural(totalBookings, 'booking')} · ${fNumber(totalHours)}h`
                      : 'Completed shifts'
                  }
                  icon="solar:wallet-money-bold"
                  color="primary"
                />
                <SummaryTile
                  label="This month so far"
                  value={money(thisMonth)}
                  hint={shiftHint(thisPoint) || 'In progress'}
                  icon="solar:calendar-bold"
                  color="info"
                />
                <SummaryTile
                  label="Last month"
                  value={money(lastMonth)}
                  hint={shiftHint(lastPoint) || 'Previous month'}
                  icon="solar:history-bold"
                  color="warning"
                />
              </>
            ) : null}
            {upcoming ? (
              <SummaryTile
                label="Upcoming"
                value={upcomingValue}
                hint={shiftHint(upcoming) || 'Confirmed, not completed yet'}
                icon="solar:calendar-mark-bold"
                color="success"
              />
            ) : null}
          </Box>

          {hasData ? (
            <>
              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" sx={{ px: 3, pt: 2, width: 1 }}>
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: completeColor }} />
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Completed
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: currentColor }} />
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    This month
                  </Typography>
                </Stack>
                {average > 0 ? (
                  <Typography variant="caption" sx={{ color: 'text.secondary', ml: 'auto' }}>
                    Monthly average {money(average)}
                  </Typography>
                ) : null}
              </Stack>

              <Stack direction="row" alignItems="flex-end" spacing={0.5} sx={{ px: 2.5, pt: 1.5, pb: 2.5, height: 188 }}>
                {data.map((value, index) => {
                  const point = points[index] || {};
                  const amount = Number(value) || 0;
                  const isCurrent = index === currentIndex;
                  const details = shiftHint(point) || 'No completed shifts';

                  return (
                    <MonthBar
                      key={`${categories[index] || 'month'}-${index}`}
                      value={amount}
                      max={max}
                      label={shortMonth(categories[index], point.month)}
                      color={isCurrent ? currentColor : completeColor}
                      track={track}
                      title={
                        <Box sx={{ py: 0.25 }}>
                          <Typography variant="caption" sx={{ display: 'block', opacity: 0.85 }}>
                            {fullMonth(categories[index], point.month)}
                            {isCurrent ? ' · so far' : ''}
                          </Typography>
                          <Typography variant="subtitle2">{money(amount)}</Typography>
                          <Typography variant="caption" sx={{ display: 'block', opacity: 0.85 }}>
                            {details}
                          </Typography>
                        </Box>
                      }
                    />
                  );
                })}
              </Stack>
            </>
          ) : null}

          {agencyNote ? (
            <Typography variant="caption" sx={{ px: 3, pb: 2.5, color: 'text.secondary' }}>
              {agencyNote}
            </Typography>
          ) : !hasData ? (
            <Box sx={{ pb: 1 }} />
          ) : null}
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
