import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';

import { paths } from 'src/routes/paths';

import { useViewOnly } from 'src/hooks/use-view-only';

import { VIEW_ONLY_MESSAGE } from 'src/auth/utils/view-only';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { useCreateCareHomeJobMutation } from 'src/store/Reducer/care-home-jobs-api';
import { useCreateHospitalJobMutation } from 'src/store/Reducer/hospital-jobs-api';
import { useCreateUserJobMutation } from 'src/store/Reducer/user-jobs-api';
import { useCreateLocalAuthorityJobMutation } from 'src/store/Reducer/local-authority-jobs-api';
import { useGetCareHomeBranchesQuery } from 'src/store/Reducer/care-home-branches-api';
import { useGetHospitalBranchesQuery } from 'src/store/Reducer/hospital-branches-api';
import { useGetLocalAuthorityBranchesQuery } from 'src/store/Reducer/local-authority-branches-api';
import { useGetHomeCareCompanyBranchesQuery } from 'src/store/Reducer/home-care-company-branches-api';
import { useUserAddressesQuery } from 'src/store/Reducer/user-branches-api';

import { CustomerMandateNotice, useCustomerMandateBlock } from 'src/sections/agency/payments/customer-mandate-notice';

import { JobDraftForm } from '../care-home-job-form';
import { JobCareDetailsFields } from '../job-care-details-fields';
import {
  buildCareHomeJobPayload,
  getJobApiErrorMessage,
  isJobCreateSoftError,
  pickJobSuccessToast,
} from '../care-home-job-api-utils';
import {
  EMPTY_JOB_DRAFT,
  createDefaultSchedule,
  mergeEmptyJobContact,
  validateCareDetails,
  validateJobDraft,
} from '../care-home-job-utils';
import { useLastJobContactDetails } from '../use-last-job-contact';


export function AddJobView({
  redirectPath = paths.dashboard.jobs.created,
  mode = 'careHome',
}) {
  const viewOnly = useViewOnly();

  if (viewOnly) {
    return (
      <DashboardContent>
        <Alert
          severity="info"
          action={
            <Button component={RouterLink} href={redirectPath} color="inherit" size="small">
              Back to jobs
            </Button>
          }
        >
          {VIEW_ONLY_MESSAGE}
        </Alert>
      </DashboardContent>
    );
  }

  return <AddJobViewContent mode={mode} redirectPath={redirectPath} />;
}

function AddJobViewContent({ redirectPath, mode = 'careHome' }) {
  const router = useRouter();
  const isHospital = mode === 'hospital';
  const isUser = mode === 'user';
  const isLocalAuthority = mode === 'localAuthority';
  const isHomeCareCompany = mode === 'homeCareCompany';
  const skipCareHome = isHospital || isUser || isLocalAuthority || isHomeCareCompany;

  const [createCareHomeJob] = useCreateCareHomeJobMutation();
  const [createHospitalJob] = useCreateHospitalJobMutation();
  const [createUserJob] = useCreateUserJobMutation();
  const [createLocalAuthorityJob] = useCreateLocalAuthorityJobMutation();
  const createJob = isLocalAuthority
    ? createLocalAuthorityJob
    : isUser
      ? createUserJob
      : isHospital
        ? createHospitalJob
        : createCareHomeJob;

  const branchListArgs = useMemo(() => ({ page: 0, limit: 100, status: '' }), []);
  const branchQueryOptions = { refetchOnMountOrArgChange: 60, refetchOnFocus: false };

  const careHomeBranchesQuery = useGetCareHomeBranchesQuery(branchListArgs, {
    skip: skipCareHome,
    ...branchQueryOptions,
  });
  const hospitalBranchesQuery = useGetHospitalBranchesQuery(branchListArgs, {
    skip: !isHospital,
    ...branchQueryOptions,
  });
  const localAuthorityBranchesQuery = useGetLocalAuthorityBranchesQuery(branchListArgs, {
    skip: !isLocalAuthority,
    ...branchQueryOptions,
  });
  const homeCareCompanyBranchesQuery = useGetHomeCareCompanyBranchesQuery(branchListArgs, {
    skip: !isHomeCareCompany,
    ...branchQueryOptions,
  });
  const userBranchesQuery = useUserAddressesQuery(branchListArgs, {
    skip: !isUser,
    ...branchQueryOptions,
  });
  const branchesData = isUser
    ? userBranchesQuery.data
    : isLocalAuthority
      ? localAuthorityBranchesQuery.data
      : isHospital
        ? hospitalBranchesQuery.data
        : isHomeCareCompany
          ? homeCareCompanyBranchesQuery.data
          : careHomeBranchesQuery.data;
  const branches = useMemo(
    () =>
      (branchesData?.data || []).filter((branch) => {
        const status = String(branch.status || 'active').toLowerCase();
        if (status === 'deleted' || status === 'delete' || status === 'inactive') return false;
        return true;
      }),
    [branchesData?.data]
  );

  const { blocked: mandateBlocked } = useCustomerMandateBlock(mode);
  const [draft, setDraft] = useState({
    ...EMPTY_JOB_DRAFT,
    schedules: [{ ...createDefaultSchedule() }],
  });
  const [submitting, setSubmitting] = useState(false);
  const lastContact = useLastJobContactDetails(mode, true);
  const contactAppliedRef = useRef(false);

  useEffect(() => {
    if (contactAppliedRef.current || !lastContact) return;
    contactAppliedRef.current = true;
    setDraft((prev) => mergeEmptyJobContact(prev, lastContact));
  }, [lastContact]);

  const handleClose = useCallback(() => {
    router.push(redirectPath);
  }, [redirectPath, router]);

  const handleDraftChange = useCallback((field, value) => {
    setDraft((prev) => {
      if (field && typeof field === 'object' && value === undefined) {
        return { ...prev, ...field };
      }
      return { ...prev, [field]: value };
    });
  }, []);

  const handleSchedulesChange = useCallback((schedules) => {
    setDraft((prev) => ({ ...prev, schedules }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (mandateBlocked) {
      toast.error('Set up a direct debit on Payments before posting a job.');
      return;
    }
    const error = validateJobDraft(draft);
    if (error) {
      toast.error(error);
      return;
    }

    const careError = validateCareDetails(draft);
    if (careError) {
      toast.error(careError);
      return;
    }

    const branch =
      branches.find((item) => item.id === draft.branchId) ||
      branches.find((item) => item._id === draft.branchId);

    if (!draft.typeId) {
      toast.error('Please select a job type');
      return;
    }
    if (!draft.branchId || !branch) {
      toast.error(
        isUser || isHomeCareCompany
          ? 'Please select a location'
          : 'Please select a valid location'
      );
      return;
    }

    setSubmitting(true);

    try {
      const isDirectRequest = Boolean(
        draft.requestFromAgency || draft.agencyId || draft.workerId || draft.employeeId
      );
      const directId = String(
        draft.workerId || draft.employeeId || draft.agencyId || ''
      ).trim();
      const schedules = (draft.schedules || []).map((entry) => ({
        ...entry,
        receivingBids: directId ? false : entry.receivingBids,
      }));

      const body = buildCareHomeJobPayload(
        {
          ...draft,
          workerId: directId || draft.workerId,
          employeeId: directId || draft.employeeId,
          schedules,
          receivingBids: isDirectRequest && directId ? false : draft.receivingBids,
        },
        branch,
        { isUser }
      );
      const response = await createJob(body).unwrap();
      toast.success(pickJobSuccessToast(response, 'Job created successfully'));
      router.push(redirectPath);
    } catch (err) {
      if (isJobCreateSoftError(err)) {
        toast.success(pickJobSuccessToast(err?.data, 'Job created successfully'));
        router.push(redirectPath);
        return;
      }
      toast.error(
        getJobApiErrorMessage(err) || err?.data?.message || err?.error || err?.message || 'Could not create job'
      );
    } finally {
      setSubmitting(false);
    }
  }, [branches, createJob, draft, isHomeCareCompany, isUser, mandateBlocked, redirectPath, router]);

  return (
    <DashboardContent maxWidth="xl">
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <IconButton component={RouterLink} href={redirectPath} aria-label="Back to created jobs">
          <Iconify icon="eva:arrow-back-fill" width={24} />
        </IconButton>
        <Typography variant="h4" fontWeight={700}>
          Add job
        </Typography>
      </Stack>

      <CustomerMandateNotice mode={mode} sx={{ mb: 2 }} />

      <Card
        sx={{
          borderRadius: 2,
          boxShadow: '0 4px 20px rgba(99, 115, 129, 0.08)',
          overflow: 'visible',
        }}
      >
        <Box
          sx={{
            px: { xs: 2, sm: 3 },
            pt: { xs: 3, sm: 3.5 },
            pb: { xs: 2.5, sm: 3 },
            '& .MuiFormControl-root, & .MuiTextField-root': { mt: 0.75 },
          }}
        >
          <JobDraftForm
            mode={mode}
            draft={draft}
            onChange={handleDraftChange}
            onSchedulesChange={handleSchedulesChange}
          />

          <Divider sx={{ my: 3 }} />

          <JobCareDetailsFields draft={draft} onChange={handleDraftChange} />
        </Box>

        <Divider />

        <Stack
          direction="row"
          justifyContent="flex-end"
          spacing={1.5}
          sx={{ px: { xs: 2, sm: 3 }, py: 2 }}
        >
          <Button color="inherit" variant="outlined" onClick={handleClose}>
            Cancel
          </Button>
          <LoadingButton
            variant="contained"
            color="primary"
            loading={submitting}
            disabled={mandateBlocked}
            onClick={handleSubmit}
          >
            Add job
          </LoadingButton>
        </Stack>
      </Card>
    </DashboardContent>
  );
}
