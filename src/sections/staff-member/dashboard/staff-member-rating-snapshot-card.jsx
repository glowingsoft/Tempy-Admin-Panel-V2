import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Rating from '@mui/material/Rating';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import LinearProgress from '@mui/material/LinearProgress';
import Grid from '@mui/material/Unstable_Grid2';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

import { useStaffMemberRatingScores } from '../reviews/use-staff-member-rating-scores';

// ----------------------------------------------------------------------

export function StaffRatingSnapshotCard() {
  const { overallAverage, totalReviews, criteriaAverages, penaltyReviewCount, isLoading } =
    useStaffMemberRatingScores();

  const reviewSummary = totalReviews
    ? `${totalReviews} scored review${totalReviews === 1 ? '' : 's'}${
        penaltyReviewCount
          ? ` · ${penaltyReviewCount} cancellation penalty${penaltyReviewCount === 1 ? '' : 'ies'}`
          : ''
      }`
    : 'No scored reviews yet';

  return (
    <Card sx={{ height: 1 }}>
      <CardHeader
        title="Your rating"
        subheader="Calculated from 8 areas including attendance and punctuality"
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.staffMember.reviews}
            size="small"
            color="inherit"
            endIcon={<Iconify icon="eva:arrow-ios-forward-fill" width={16} />}
          >
            Reviews
          </Button>
        }
      />

      <Box sx={{ px: 2.5, pb: 2.5 }}>
        {isLoading ? (
          <Typography variant="body2" color="text.secondary">
            Loading ratings…
          </Typography>
        ) : (
          <Stack spacing={2.5}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
            >
              <Typography variant="h3" sx={{ lineHeight: 1, flexShrink: 0 }}>
                {totalReviews ? overallAverage.toFixed(1) : '—'}
                <Typography component="span" variant="h6" sx={{ color: 'text.secondary', ml: 0.5 }}>
                  /5
                </Typography>
              </Typography>

              <Stack spacing={0.5} sx={{ minWidth: 0, flexGrow: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: 'nowrap' }}>
                  <Rating
                    value={overallAverage}
                    precision={0.1}
                    max={5}
                    readOnly
                    sx={{ color: 'warning.main', flexShrink: 0 }}
                  />
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {reviewSummary}
                  </Typography>
                </Stack>
              </Stack>
            </Stack>

            <Grid container spacing={1.5}>
              {criteriaAverages.map((item) => (
                <Grid key={item.key} xs={12} sm={6}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      noWrap
                      sx={{ width: 112, flexShrink: 0 }}
                    >
                      {item.label}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={item.average ? (item.average / 5) * 100 : 0}
                      sx={{
                        flexGrow: 1,
                        height: 6,
                        borderRadius: 1,
                        bgcolor: 'background.neutral',
                        '& .MuiLinearProgress-bar': { bgcolor: 'warning.main' },
                      }}
                    />
                    <Typography variant="caption" sx={{ width: 24, textAlign: 'right', flexShrink: 0 }}>
                      {item.average ? item.average.toFixed(1) : '—'}
                    </Typography>
                  </Stack>
                </Grid>
              ))}
            </Grid>

            {!totalReviews ? (
              <Typography variant="body2" color="text.secondary">
                Complete shifts and receive client ratings to build your score across all 8 areas.
              </Typography>
            ) : null}
          </Stack>
        )}
      </Box>
    </Card>
  );
}
