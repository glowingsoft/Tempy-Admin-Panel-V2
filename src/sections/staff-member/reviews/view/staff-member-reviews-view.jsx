import { useEffect, useMemo, useState } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Rating from '@mui/material/Rating';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import Grid from '@mui/material/Unstable_Grid2';

import { paths } from 'src/routes/paths';

import { fDate } from 'src/utils/format-time';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { rowInPage, TablePaginationCustom, useTable } from 'src/components/table';
import { ModuleLoading } from 'src/components/loading-screen';

import { useStaffCancellationStats } from 'src/sections/staff-member/jobs/use-staff-cancellation-stats';
import {
  formatCancellationHistoryMessage,
  LATE_CANCELLATION_RATING_WARNING,
} from 'src/sections/staff-member/jobs/staff-member-cancellation-utils';
import { StaffMemberStrikeRuleAlert } from 'src/sections/staff-member/jobs/staff-member-strike-rule-alert';
import { STAFF_RATING_CRITERIA } from 'src/sections/staff-member/reviews/staff-member-rating-criteria';
import { StaffMemberRatingBreakdownCard } from 'src/sections/staff-member/reviews/staff-member-rating-breakdown-card';
import { useStaffMemberRatingScores } from 'src/sections/staff-member/reviews/use-staff-member-rating-scores';
import { resolveReviewOverallRating } from 'src/sections/reviews/review-criteria-utils';

// ----------------------------------------------------------------------

const STAR_FILTERS = [0, 5, 4, 3, 2, 1];

function toStar(value) {
  const n = Math.round(Number(value) || 0);
  return Math.min(5, Math.max(0, n));
}

export function StaffMemberReviewsView() {
  const [starFilter, setStarFilter] = useState(0);
  const table = useTable({ defaultRowsPerPage: 10 });
  const cancellationStats = useStaffCancellationStats();
  const {
    reviews,
    overallAverage,
    totalReviews,
    clientReviewCount,
    penaltyReviewCount,
    starCounts,
    criteriaAverages,
    isLoading,
    isError,
    error,
  } = useStaffMemberRatingScores();

  const visibleReviews = useMemo(
    () =>
      starFilter
        ? reviews.filter((item) => toStar(resolveReviewOverallRating(item, item.criteria)) === starFilter)
        : reviews,
    [reviews, starFilter]
  );

  useEffect(() => {
    table.onResetPage();
  }, [starFilter, table.onResetPage]);

  const pageCount = Math.max(1, Math.ceil(visibleReviews.length / table.rowsPerPage));
  const safePage = Math.min(table.page, pageCount - 1);
  const pageReviews = rowInPage(visibleReviews, safePage, table.rowsPerPage);

  return (
    <DashboardContent maxWidth="lg">
      <CustomBreadcrumbs
        heading="Reviews"
        links={[
          { name: 'Dashboard', href: paths.dashboard.staffMember.root },
          { name: 'Reviews' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, mt: -2 }}>
        Your score is calculated from 8 areas — professionalism, communication, compassion,
        effectiveness, attendance, attitude, attention to detail, and attending on time. Cancelling a
        shift creates a non-5 star review that lowers your overall score.
      </Typography>

      <Alert severity="info" sx={{ mb: 2 }}>
        <Stack spacing={0.75}>
          <Typography variant="body2">{formatCancellationHistoryMessage(cancellationStats)}</Typography>
          <Typography variant="body2">{LATE_CANCELLATION_RATING_WARNING}</Typography>
        </Stack>
      </Alert>

      <StaffMemberStrikeRuleAlert cancellationStats={cancellationStats} sx={{ mb: 3 }} />

      {isLoading ? (
        <ModuleLoading />
      ) : isError ? (
        <Card sx={{ p: 3 }}>
          <Typography color="error">
            {error?.data?.message || error?.error || 'Could not load reviews'}
          </Typography>
        </Card>
      ) : (
        <Stack spacing={3}>
          <Grid container spacing={3}>
            <Grid xs={12} md={4}>
              <SummaryCard
                average={overallAverage}
                total={totalReviews}
                clientReviewCount={clientReviewCount}
                penaltyReviewCount={penaltyReviewCount}
              />
            </Grid>
            <Grid xs={12} md={8}>
              <StarBreakdownCard counts={starCounts} total={totalReviews} />
            </Grid>
            <Grid xs={12}>
              <StaffMemberRatingBreakdownCard
                title="Score by area"
                criteriaAverages={criteriaAverages}
              />
            </Grid>
          </Grid>

          <Card sx={{ p: { xs: 2, md: 3 } }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              flexWrap="wrap"
              gap={1.5}
              sx={{ mb: 2.5 }}
            >
              <Typography variant="h6">All reviews</Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {STAR_FILTERS.map((star) => (
                  <Chip
                    key={star}
                    size="small"
                    color={starFilter === star ? 'warning' : 'default'}
                    variant={starFilter === star ? 'filled' : 'outlined'}
                    label={star === 0 ? 'All' : `${star} star${star === 1 ? '' : 's'}`}
                    onClick={() => setStarFilter(star)}
                  />
                ))}
              </Stack>
            </Stack>

            {!reviews.length ? (
              <EmptyContent
                filled
                title="No reviews yet"
                description="When a client rates a completed shift, or a cancellation penalty is applied, it will appear here."
                sx={{ py: 8 }}
              />
            ) : !visibleReviews.length ? (
              <EmptyContent
                filled
                title={`No ${starFilter}-star reviews`}
                description="Try another star filter."
                sx={{ py: 8 }}
              />
            ) : (
              <Stack spacing={2}>
                {pageReviews.map((review) => (
                  <ReviewItem key={review.id} review={review} />
                ))}
                <TablePaginationCustom
                  page={safePage}
                  count={visibleReviews.length}
                  rowsPerPage={table.rowsPerPage}
                  onPageChange={table.onChangePage}
                  onRowsPerPageChange={table.onChangeRowsPerPage}
                />
              </Stack>
            )}
          </Card>
        </Stack>
      )}
    </DashboardContent>
  );
}

function SummaryCard({ average, total, clientReviewCount, penaltyReviewCount }) {
  return (
    <Card sx={{ p: 3, height: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Stack spacing={1} alignItems="center" textAlign="center">
        <Typography variant="overline" sx={{ color: 'text.secondary' }}>
          Overall score
        </Typography>
        <Typography variant="h2" sx={{ lineHeight: 1 }}>
          {total ? average.toFixed(1) : '—'}
          <Typography component="span" variant="h5" sx={{ color: 'text.secondary', ml: 0.5 }}>
            /5
          </Typography>
        </Typography>
        <Rating value={average} precision={0.1} max={5} readOnly sx={{ color: 'warning.main' }} />
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {total ? `${total} scored review${total === 1 ? '' : 's'}` : 'No ratings yet'}
        </Typography>
        {total ? (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {clientReviewCount} client · {penaltyReviewCount} cancellation
          </Typography>
        ) : null}
      </Stack>
    </Card>
  );
}

function StarBreakdownCard({ counts, total }) {
  return (
    <Card sx={{ p: 3, height: 1 }}>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Rating breakdown
      </Typography>
      <Stack spacing={1.25}>
        {[5, 4, 3, 2, 1].map((star) => {
          const count = counts[star] || 0;
          const percent = total ? (count / total) * 100 : 0;
          return (
            <Stack key={star} direction="row" alignItems="center" spacing={1.5}>
              <Typography variant="body2" sx={{ width: 64, flexShrink: 0 }}>
                {star} star{star === 1 ? '' : 's'}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={percent}
                sx={{
                  flexGrow: 1,
                  height: 8,
                  borderRadius: 1,
                  bgcolor: 'background.neutral',
                  '& .MuiLinearProgress-bar': { bgcolor: 'warning.main' },
                }}
              />
              <Typography variant="caption" sx={{ width: 28, textAlign: 'right', color: 'text.secondary' }}>
                {count}
              </Typography>
            </Stack>
          );
        })}
      </Stack>
    </Card>
  );
}

function ReviewItem({ review }) {
  const criteria = review.criteria || {};
  const overall = resolveReviewOverallRating(review, criteria);
  const criteriaEntries = STAFF_RATING_CRITERIA.map(({ key, label }) => ({
    key,
    label,
    value: criteria[key],
  })).filter((item) => item.value > 0);

  return (
    <Card variant="outlined" sx={{ p: 2.25, borderRadius: 2 }}>
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Avatar src={review.avatarUrl} alt={review.name} />
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={1}
            sx={{ mb: 0.5 }}
          >
            <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" noWrap>
                {review.name}
              </Typography>
              {review.isCancellationPenalty ? (
                <Chip
                  size="small"
                  color={review.within24Hours ? 'error' : 'warning'}
                  label={review.within24Hours ? 'Late cancellation' : 'Cancellation'}
                />
              ) : null}
            </Stack>
            <Typography variant="caption" sx={{ color: 'text.secondary', flexShrink: 0 }}>
              {review.postedAt ? fDate(review.postedAt) : ''}
            </Typography>
          </Stack>

          {!review.isCancellationPenalty && (review.jobTitle || review.shiftDate) ? (
            <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.5, minWidth: 0 }}>
              <Iconify
                icon="solar:case-round-bold"
                width={16}
                sx={{ color: 'text.disabled', flexShrink: 0 }}
              />
              <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                {review.jobTitle || 'Booking'}
              </Typography>
              {review.shiftDate ? (
                <Typography variant="caption" noWrap sx={{ color: 'text.secondary' }}>
                  · Shift {fDate(review.shiftDate)}
                </Typography>
              ) : null}
            </Stack>
          ) : null}

          <Rating
            size="small"
            max={5}
            precision={0.1}
            value={overall}
            readOnly
            sx={{ color: 'warning.main', mb: 0.75 }}
          />

          {criteriaEntries.length ? (
            <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: 1 }}>
              {criteriaEntries.map((item) => (
                <Chip
                  key={item.key}
                  size="small"
                  variant="outlined"
                  label={`${item.label}: ${item.value}/5`}
                />
              ))}
            </Stack>
          ) : null}

          {review.comment ? (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {review.comment}
            </Typography>
          ) : (
            <Typography variant="body2" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
              No written comment
            </Typography>
          )}
        </Box>
      </Stack>
    </Card>
  );
}
