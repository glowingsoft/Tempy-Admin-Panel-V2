import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { resolveDashboardRole } from 'src/auth/utils/role-module-redirect';
import { getProfileUserId } from 'src/sections/account/account-profile-utils';
import { isUsableCustomerMandate, useGetGoCardlessMandateQuery } from 'src/store/Reducer/gocardless-api';


const PAYMENTS_PATH_BY_ROLE = {
  careHome: paths.dashboard.payments,
  hospital: paths.dashboard.hospital.payments,
  localAuthority: paths.dashboard.localAuthority.payments,
  user: paths.dashboard.individualHomeCare.payments,
};

export const POST_JOB_PAYMENT_MESSAGE =
  'Set up a direct debit on Payments before posting a job.';

export const CONFIRM_BOOKING_PAYMENT_MESSAGE =
  'Set up a card or bank payment link on Payments before confirming a booking.';

export function useCustomerMandateBlock(mode) {
  const sessionUser = useSelector((state) => state.user?.user);
  const userId = getProfileUserId(sessionUser);
  const role = resolveDashboardRole(sessionUser);
  const customerKey = PAYMENTS_PATH_BY_ROLE[mode] ? mode : role;
  const paymentsPath = PAYMENTS_PATH_BY_ROLE[customerKey] || '';
  const cacheKey = userId || 'session';
  const { data, isLoading, isUninitialized, refetch } = useGetGoCardlessMandateQuery(cacheKey, {
    skip: !paymentsPath,
  });

  const usable = isUsableCustomerMandate(data);

  useEffect(() => {
    if (!paymentsPath || usable) return undefined;

    const refresh = () => {
      if (document.visibilityState === 'visible') refetch();
    };

    document.addEventListener('visibilitychange', refresh);
    return () => {
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [paymentsPath, refetch, usable]);
  const waiting = Boolean(paymentsPath) && Boolean(userId) && (isLoading || isUninitialized) && !data;

  return {
    paymentsPath,
    blocked: Boolean(paymentsPath) && !usable && !waiting,
    showNotice: Boolean(paymentsPath) && !usable && !waiting,
  };
}

/** @param {'postJob' | 'confirm'} [variant] */
export function CustomerMandateNotice({ sx, mode, variant = 'confirm' }) {
  const { showNotice, paymentsPath } = useCustomerMandateBlock(mode);

  if (!showNotice) return null;

  const isPostJob = variant === 'postJob';

  return (
    <Alert
      severity="warning"
      sx={sx}
      action={
        <Button component={RouterLink} href={paymentsPath} color="inherit" size="small">
          {isPostJob ? 'Set up direct debit' : 'Set up payment'}
        </Button>
      }
    >
      {isPostJob
        ? 'Posting a job is blocked until this direct debit can be used. Set it up on Payments first.'
        : 'You can request shifts now. Confirming a booking stays blocked until a card or bank payment link is set up on Payments.'}
    </Alert>
  );
}
