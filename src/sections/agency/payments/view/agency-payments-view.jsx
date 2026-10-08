import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { AppButton } from 'src/components/app-button';

import { handleApiError } from 'src/store/handleApiError';
import { getProfileUserId } from 'src/sections/account/account-profile-utils';
import { resolveDashboardRole } from 'src/auth/utils/role-module-redirect';
import { BookingPaymentsList } from 'src/sections/agency/payments/booking-payments-list';
import { useGetUserByIdQuery, useUpdateUserByIdMutation } from 'src/store/Reducer/users-api';
import { gocardlessApi, isUsableCustomerMandate, useGetGoCardlessMandateQuery, useSetupGoCardlessMandateMutation } from 'src/store/Reducer/gocardless-api';


const CUSTOMER_ROLES = new Set(['careHome', 'hospital', 'localAuthority', 'user']);

const API_ROLE_BY_DASHBOARD = {
  careHome: 'care-home',
  agency: 'agency',
  hospital: 'hospital',
  localAuthority: 'local-authority',
  user: 'user',
  homeCareCompany: 'home-care-company',
  nurse: 'nurse',
};
const SORT_CODE_LENGTH = 6;
const ACCOUNT_NUMBER_LENGTH = 8;

function digitsOnly(value, max) {
  return String(value || '')
    .replace(/\D/g, '')
    .slice(0, max);
}

function formatSortCode(value) {
  const digits = digitsOnly(value, SORT_CODE_LENGTH);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 6)].filter(Boolean).join('-');
}

function bankFromUser(user) {
  const bank = user?.raw?.bankDetails || user?.bankDetails || {};
  return {
    accountHolderName: bank.accountHolderName || bank.accountName || '',
    sortCode: digitsOnly(bank.sortCode, SORT_CODE_LENGTH),
    accountNumber: digitsOnly(bank.accountNumber || bank.accountNo, ACCOUNT_NUMBER_LENGTH),
  };
}

export function AgencyPaymentsView() {
  const sessionUser = useSelector((state) => state.user?.user);
  const role = resolveDashboardRole(sessionUser);
  const isCustomer = CUSTOMER_ROLES.has(role);
  const apiRole = API_ROLE_BY_DASHBOARD[role] || 'care-home';
  const userId = getProfileUserId(sessionUser);

  return (
    <DashboardContent maxWidth="xl">
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4">Payments</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            {isCustomer
              ? 'One direct debit covers every supplier you book. Tempy collects the accepted bid when the booking is created. A job cannot be posted until this direct debit can be used.'
              : 'You are owed the accepted bid minus the platform fee only after the shift is completed and the customer payment has been paid out. Add the bank account that should receive it.'}
          </Typography>
        </Box>

        {isCustomer ? <CustomerMandateCard userId={userId} /> : <SupplierBankCard userId={userId} />}
        <BookingPaymentsList role={apiRole} />
      </Stack>
    </DashboardContent>
  );
}

function CustomerMandateCard({ userId }) {
  const dispatch = useDispatch();
  const cacheKey = userId || 'session';
  const { data, isLoading, isError, error, refetch } = useGetGoCardlessMandateQuery(cacheKey);
  const [setupMandate, { isLoading: settingUp }] = useSetupGoCardlessMandateMutation();
  const [savedMandate, setSavedMandate] = useState(null);
  const pollRef = useRef(0);
  const mandate = savedMandate?.status ? savedMandate : data;
  const active = isUsableCustomerMandate(mandate);

  useEffect(() => {
    if (active) window.clearInterval(pollRef.current);
  }, [active]);

  useEffect(() => () => window.clearInterval(pollRef.current), []);

  const handleSetup = async () => {
    if (active) return;
    try {
      const result = await setupMandate(cacheKey).unwrap();
      if (isUsableCustomerMandate(result)) {
        setSavedMandate(result);
        dispatch(gocardlessApi.util.upsertQueryData('getGoCardlessMandate', cacheKey, result));
      }
      if (result?.redirectUrl) {
        window.open(result.redirectUrl, '_blank', 'noopener,noreferrer');
        window.clearInterval(pollRef.current);
        const started = Date.now();
        pollRef.current = window.setInterval(() => {
          refetch();
          if (Date.now() - started > 90000) window.clearInterval(pollRef.current);
        }, 2000);
        return;
      }
      if (isUsableCustomerMandate(result)) {
        toast.success('Direct debit is already set up');
        return;
      }
      toast.error('Could not open the direct debit page. The bank setup link was missing.');
    } catch (err) {
      toast.error(handleApiError(err) || 'Could not set up the direct debit');
    }
  };

  return (
    <Card sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
        <Typography variant="h6">Direct debit</Typography>
        <Label variant="soft" color={active ? 'success' : 'warning'}>
          {isLoading && !mandate?.status ? 'Loading' : mandate?.status || 'Not set up'}
        </Label>
      </Stack>

      {isError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {handleApiError(error) || 'Could not load the mandate'}
        </Alert>
      ) : null}

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        GoCardless opens a page where you enter bank details and sign the direct debit. The charge is taken when you accept a nurse, or when an agency assigns a worker. Check-out
        does not take another payment.
      </Typography>

      <AppButton onClick={handleSetup} loading={settingUp} disabled={isLoading || active}>
        {active ? 'Update direct debit' : 'Set up direct debit'}
      </AppButton>
      {active ? (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
          Direct debit is already set up and cannot be changed.
        </Typography>
      ) : null}
    </Card>
  );
}

function SupplierBankCard({ userId }) {
  const { data } = useGetUserByIdQuery(userId, { skip: !userId });
  const [updateUser, { isLoading }] = useUpdateUserByIdMutation();
  const [form, setForm] = useState({ accountHolderName: '', sortCode: '', accountNumber: '' });
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (!data) return;
    setForm(bankFromUser(data));
  }, [data]);

  const sortCodeError = form.sortCode.length !== SORT_CODE_LENGTH;
  const accountNumberError = form.accountNumber.length !== ACCOUNT_NUMBER_LENGTH;

  const handleSave = async () => {
    if (!userId) return;
    setShowErrors(true);
    if (!form.accountHolderName.trim()) {
      toast.error('Enter the account holder name');
      return;
    }
    if (sortCodeError || accountNumberError) {
      toast.error('Sort code must be 6 digits and account number must be 8 digits');
      return;
    }
    try {
      await updateUser({
        id: userId,
        bankDetails: {
          accountHolderName: form.accountHolderName.trim(),
          sortCode: form.sortCode,
          accountNumber: form.accountNumber,
        },
      }).unwrap();
      toast.success('Bank details saved');
    } catch (err) {
      toast.error(handleApiError(err) || 'Could not save bank details');
    }
  };

  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Bank details
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        Admin sends the supplier earnings by bank transfer and then records the payout. A payout cannot be recorded until these details are saved. A solo nurse is paid directly.
        Agency and home care company staff are paid through their employer.
      </Typography>

      <Stack spacing={2}>
        <TextField
          label="Account holder name"
          value={form.accountHolderName}
          onChange={(event) => setForm((current) => ({ ...current, accountHolderName: event.target.value }))}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Sort code"
          value={formatSortCode(form.sortCode)}
          placeholder="00-00-00"
          onChange={(event) => setForm((current) => ({ ...current, sortCode: digitsOnly(event.target.value, SORT_CODE_LENGTH) }))}
          error={showErrors && sortCodeError}
          helperText={showErrors && sortCodeError ? 'Enter all 6 digits' : `${form.sortCode.length}/6 digits`}
          InputLabelProps={{ shrink: true }}
          inputProps={{ inputMode: 'numeric', maxLength: 8, autoComplete: 'off' }}
          sx={{ '& input': { letterSpacing: '0.18em', fontVariantNumeric: 'tabular-nums' } }}
        />
        <TextField
          label="Account number"
          value={form.accountNumber}
          placeholder="00000000"
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              accountNumber: digitsOnly(event.target.value, ACCOUNT_NUMBER_LENGTH),
            }))
          }
          error={showErrors && accountNumberError}
          helperText={showErrors && accountNumberError ? 'Enter all 8 digits' : `${form.accountNumber.length}/8 digits`}
          InputLabelProps={{ shrink: true }}
          inputProps={{ inputMode: 'numeric', maxLength: ACCOUNT_NUMBER_LENGTH, autoComplete: 'off' }}
          sx={{ '& input': { letterSpacing: '0.18em', fontVariantNumeric: 'tabular-nums' } }}
        />
        <Box>
          <Button variant="contained" disabled={isLoading || !userId} onClick={handleSave}>
            {isLoading ? 'Saving...' : 'Save bank details'}
          </Button>
        </Box>
      </Stack>
    </Card>
  );
}
