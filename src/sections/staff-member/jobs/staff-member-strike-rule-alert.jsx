import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

import { RouterLink } from 'src/routes/components';

import {
  formatStrikeRuleMessage,
  getStrikeRuleStatus,
  STAFF_TERMS_OF_USE_HREF,
} from './staff-member-strike-rule-utils';

// ----------------------------------------------------------------------

export function StaffMemberStrikeRuleAlert({
  cancellationStats = {},
  within24Hours = false,
  sx,
}) {
  const strikeStatus = getStrikeRuleStatus(cancellationStats);
  const message = formatStrikeRuleMessage(strikeStatus, { within24Hours });

  const severity = strikeStatus.isAccessBlocked
    ? 'error'
    : strikeStatus.lateStrikes > 0 || within24Hours
      ? 'warning'
      : 'info';

  return (
    <Alert severity={severity} sx={sx}>
      <Typography variant="body2" component="span">
        {message}{' '}
        <Link component={RouterLink} href={STAFF_TERMS_OF_USE_HREF} underline="always">
          Tempy conditions of use
        </Link>
        .
      </Typography>
    </Alert>
  );
}
