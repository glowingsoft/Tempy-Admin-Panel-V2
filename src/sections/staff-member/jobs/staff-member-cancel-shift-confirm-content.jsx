import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import {
  formatCancellationHistoryMessage,
  LATE_CANCELLATION_RATING_WARNING,
} from './staff-member-cancellation-utils';
import { StaffMemberStrikeRuleAlert } from './staff-member-strike-rule-alert';
import { getStrikeRuleStatus } from './staff-member-strike-rule-utils';

export function StaffMemberCancelShiftConfirmContent({
  job,
  within24Hours = false,
  cancellationStats = {},
}) {
  const historyMessage = formatCancellationHistoryMessage(cancellationStats);
  const strikeStatus = getStrikeRuleStatus(cancellationStats);

  return (
    <Stack spacing={1.5}>
      <StaffMemberStrikeRuleAlert
        cancellationStats={cancellationStats}
        within24Hours={within24Hours}
      />

      {within24Hours ? (
        <Alert severity="error">{LATE_CANCELLATION_RATING_WARNING}</Alert>
      ) : null}

      {strikeStatus.isAccessBlocked && within24Hours ? (
        <Alert severity="error">
          You cannot cancel with less than 24 hours notice because you have already used all{' '}
          {strikeStatus.strikeLimit} late cancellation strikes.
        </Alert>
      ) : null}

      <Alert severity={cancellationStats?.hasCancelledBefore ? 'warning' : 'info'}>
        {historyMessage}
      </Alert>
      <Alert severity="info">If you have not checked in, the customer is refunded in full.</Alert>

      <Typography variant="body2">
        Are you sure you want to cancel <strong>{job?.title || 'this shift'}</strong>? The care home
        and agency will be notified.
      </Typography>
    </Stack>
  );
}
