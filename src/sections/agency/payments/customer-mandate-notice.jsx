import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { resolveDashboardRole } from 'src/auth/utils/role-module-redirect';
import { getProfileUserId } from 'src/sections/account/account-profile-utils';
import { isUsableCustomerMandate, useGetGoCardlessMandateQuery } from 'src/store/Reducer/gocardless-api';

// ----------------------------------------------------------------------

const PAYMENTS_PATH_BY_ROLE = {
  careHome: paths.dashboard.payments,
  hospital: paths.dashboard.hospital.payments,
  localAuthority: paths.dashboard.localAuthority.payments,
  user: paths.dashboard.individualHomeCare.payments,
};

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

  useEffect(() => {
    if (!paymentsPath) return undefined;

    const refresh = () => {
      if (document.visibilityState === 'visible') refetch();
    };

    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [paymentsPath, refetch]);

  const usable = isUsableCustomerMandate(data, userId);
  const waiting = Boolean(paymentsPath) && Boolean(userId) && (isLoading || isUninitialized) && !data;

  return {
    paymentsPath,
    blocked: Boolean(paymentsPath) && !usable,
    showNotice: Boolean(paymentsPath) && !usable && !waiting,
  };
}

export function CustomerMandateNotice({ sx, mode }) {
  const { showNotice, paymentsPath } = useCustomerMandateBlock(mode);

  if (!showNotice) return null;

  return (
    <Alert
      severity="warning"
      sx={sx}
      action={
        <Button component={RouterLink} href={paymentsPath} color="inherit" size="small">
          Set up direct debit
        </Button>
      }
    >
      Posting a job is blocked until this direct debit can be used. Set it up on Payments first.
    </Alert>
  );
}
