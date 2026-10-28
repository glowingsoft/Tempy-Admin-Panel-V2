import { useState, useCallback, useEffect, useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Skeleton from '@mui/material/Skeleton';
import Pagination from '@mui/material/Pagination';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { usePathname, useRouter, useSearchParams } from 'src/routes/hooks';

import { buildDirectChatUrl, getBidderParticipantFromEmployerBid, getEmployerMessagesPath } from 'src/sections/messaging/open-direct-chat';

import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { usePersistedViewMode } from 'src/hooks/use-persisted-view-mode';
import { Iconify } from 'src/components/iconify';
import { fCurrency } from 'src/utils/format-number';
import { EmptyContent } from 'src/components/empty-content';

import {
  useGetCareHomeJobBidsQuery,
  useGetCareHomeJobsQuery,
  useUpdateCareHomeJobBidMutation,
  useUpdateCareHomeJobMutation,
} from 'src/store/Reducer/care-home-jobs-api';
import {
  useGetHospitalJobBidsQuery,
  useGetHospitalJobsQuery,
  useUpdateHospitalJobBidMutation,
  useUpdateHospitalJobMutation,
} from 'src/store/Reducer/hospital-jobs-api';
import { useGetUserJobBidsQuery, useGetUserJobsQuery, useUpdateUserJobBidMutation, useUpdateUserJobMutation } from 'src/store/Reducer/user-jobs-api';
import {
  useGetLocalAuthorityJobBidsQuery,
  useGetLocalAuthorityJobsQuery,
  useUpdateLocalAuthorityJobBidMutation,
  useUpdateLocalAuthorityJobMutation,
} from 'src/store/Reducer/local-authority-jobs-api';
import { useGetCareHomeBranchesQuery } from 'src/store/Reducer/care-home-branches-api';
import { useGetHospitalBranchesQuery } from 'src/store/Reducer/hospital-branches-api';
import { useGetLocalAuthorityBranchesQuery } from 'src/store/Reducer/local-authority-branches-api';
import { useUserAddressesQuery } from 'src/store/Reducer/user-branches-api';

import { buildJobsFromCareHomeBids, toCareHomeBidApiStatus } from '../care-home-job-bid-api-utils';
import {
  buildCareHomeJobPayload,
  getJobApiErrorMessage,
  isJobCreateSoftError,
  pickJobSuccessToast,
} from '../care-home-job-api-utils';
import { jobToDraft } from '../care-home-job-utils';
import { IncreaseJobRateDialog } from '../increase-job-rate-dialog';
import { BidCard } from '../bids/job-bid-card';
import { JobBidsToolbar } from '../bids/job-bids-toolbar';
import { JobBidsSummary, JobBidsJobHeader, JobBidsSelectedJobCard } from '../bids/job-bids-summary';
import {
  DATE_FILTERS,
  BID_STATUS_FILTERS,
  ROWS_PER_PAGE_GRID,
  ROWS_PER_PAGE_LIST,
  sortBids,
  getBidsPath,
  getBidUiStatus,
  getBidReceivedTime,
} from '../bids/job-bid-utils';
import { useActiveBranch } from 'src/sections/branches/active-branch-context';
import { ALL_SITES_ID, bidMatchesActiveBranch, jobMatchesActiveBranch } from 'src/sections/branches/active-branch';
import { getAgreedRatesPath } from 'src/sections/care-home/agreed-rates/agreed-rates-nav-utils';
import { useBoolean } from 'src/hooks/use-boolean';
import { useViewOnly } from 'src/hooks/use-view-only';


const DATE_FILTER_COUNT_KEYS = {
  all: 'total',
  next24Hours: 'next24hCount',
  thisWeek: 'thisWeekCount',
  nextWeek: 'nextWeekCount',
};

function hasBidCountMeta(meta) {
  return Boolean(meta) && meta.total != null;
}

function readBidCount(meta, key) {
  return Number(meta?.[key]) || 0;
}

function jobHasBids(job) {
  return Number(job?.bidCount) > 0 || Number(job?.acceptedBidsCount) > 0 || Boolean(job?.hasAcceptedBid);
}

export function JobBidsView({ mode = 'careHome' }) {
  const viewOnly = useViewOnly();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const bidsPath = useMemo(() => getBidsPath(pathname, paths.dashboard.jobs.bids), [pathname]);
  const agreedRatesPath = useMemo(() => getAgreedRatesPath(mode), [mode]);
  const isHospital = mode === 'hospital';
  const isUser = mode === 'user';
  const isLocalAuthority = mode === 'localAuthority';
  const skipCareHome = isHospital || isUser || isLocalAuthority;
  const { activeBranchId } = useActiveBranch();
  const rateDialog = useBoolean();
  const [rateJob, setRateJob] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [jobFilter, setJobFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [allBidsSnapshot, setAllBidsSnapshot] = useState([]);
  const [page, setPage] = useState(1);
  const { viewMode, setViewMode } = usePersistedViewMode('care-home-job-bids', 'list');
  const [groupMode, setGroupMode] = useState('all');
  const rowsPerPage = viewMode === 'grid' ? ROWS_PER_PAGE_GRID : ROWS_PER_PAGE_LIST;
  const scopedBranchId =
    activeBranchId && activeBranchId !== ALL_SITES_ID ? String(activeBranchId) : '';

  useEffect(() => {
    const next = searchQuery.trim();
    if (next === searchKeyword) return undefined;
    const timer = setTimeout(() => {
      setSearchKeyword(next);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchKeyword, searchQuery]);

  const listFilterArgs = useMemo(() => {
    const args = {
      status: statusFilter === 'all' ? '' : statusFilter,
      job: jobFilter === 'all' ? '' : jobFilter,
      keyword: searchKeyword,
      ...(scopedBranchId ? { branch: scopedBranchId } : {}),
    };
    if (dateFilter !== 'all') {
      args.dateFilter = dateFilter;
    }
    return args;
  }, [dateFilter, jobFilter, scopedBranchId, searchKeyword, statusFilter]);

  const bidsQueryArgs = useMemo(
    () => ({
      ...listFilterArgs,
      page: Math.max(0, page - 1),
      limit: rowsPerPage,
    }),
    [listFilterArgs, page, rowsPerPage]
  );

  const countsQueryArgs = useMemo(
    () => ({ ...listFilterArgs, status: '', page: 0, limit: 1 }),
    [listFilterArgs]
  );
  const dateCountsQueryArgs = useMemo(() => {
    const args = { ...listFilterArgs, page: 0, limit: 1 };
    delete args.dateFilter;
    return args;
  }, [listFilterArgs]);

  const careHomeJobsQuery = useGetCareHomeJobsQuery({ page: 0, limit: 100 }, { skip: skipCareHome });
  const hospitalJobsQuery = useGetHospitalJobsQuery({ page: 0, limit: 100 }, { skip: !isHospital });
  const userJobsQuery = useGetUserJobsQuery({ page: 0, limit: 100 }, { skip: !isUser });
  const localAuthorityJobsQuery = useGetLocalAuthorityJobsQuery({ page: 0, limit: 100 }, { skip: !isLocalAuthority });
  const {
    data: jobsData,
    isLoading: jobsLoading,
    refetch: refetchJobs,
  } = isLocalAuthority ? localAuthorityJobsQuery : isUser ? userJobsQuery : isHospital ? hospitalJobsQuery : careHomeJobsQuery;

  const careHomeBranchesQuery = useGetCareHomeBranchesQuery({ page: 0, limit: 100 }, { skip: skipCareHome });
  const hospitalBranchesQuery = useGetHospitalBranchesQuery({ page: 0, limit: 100 }, { skip: !isHospital });
  const localAuthorityBranchesQuery = useGetLocalAuthorityBranchesQuery({ page: 0, limit: 100 }, { skip: !isLocalAuthority });
  const userBranchesQuery = useUserAddressesQuery({ page: 0, limit: 100 }, { skip: !isUser });
  const branchesData = isLocalAuthority ? localAuthorityBranchesQuery.data : isUser ? userBranchesQuery.data : isHospital ? hospitalBranchesQuery.data : careHomeBranchesQuery.data;
  const branches = useMemo(
    () =>
      (branchesData?.data || []).filter((branch) => {
        const status = String(branch.status || 'active').toLowerCase();
        if (status === 'deleted' || status === 'delete' || status === 'inactive') return false;
        return true;
      }),
    [branchesData?.data]
  );

  const bidsQueryOptions = {
    refetchOnMountOrArgChange: 60,
    refetchOnFocus: false,
    placeholderData: (previousData) => previousData,
  };
  const careHomeBidsQuery = useGetCareHomeJobBidsQuery(bidsQueryArgs, {
    skip: skipCareHome,
    ...bidsQueryOptions,
  });
  const hospitalBidsQuery = useGetHospitalJobBidsQuery(bidsQueryArgs, {
    skip: !isHospital,
    ...bidsQueryOptions,
  });
  const userBidsQuery = useGetUserJobBidsQuery(bidsQueryArgs, {
    skip: !isUser,
    ...bidsQueryOptions,
  });
  const localAuthorityBidsQuery = useGetLocalAuthorityJobBidsQuery(bidsQueryArgs, {
    skip: !isLocalAuthority,
    ...bidsQueryOptions,
  });
  const activeBidsQuery = isLocalAuthority ? localAuthorityBidsQuery : isUser ? userBidsQuery : isHospital ? hospitalBidsQuery : careHomeBidsQuery;
  const { data: bidsData, isLoading: bidsLoading, isFetching: bidsFetching, isError: bidsError, error: bidsErrorDetail, refetch: refetchBids } = activeBidsQuery;

  const countsQueryOptions = { refetchOnMountOrArgChange: 60, refetchOnFocus: false };
  const careHomeCountsQuery = useGetCareHomeJobBidsQuery(countsQueryArgs, { skip: skipCareHome, ...countsQueryOptions });
  const hospitalCountsQuery = useGetHospitalJobBidsQuery(countsQueryArgs, { skip: !isHospital, ...countsQueryOptions });
  const userCountsQuery = useGetUserJobBidsQuery(countsQueryArgs, { skip: !isUser, ...countsQueryOptions });
  const localAuthorityCountsQuery = useGetLocalAuthorityJobBidsQuery(countsQueryArgs, { skip: !isLocalAuthority, ...countsQueryOptions });
  const { data: countsData, isLoading: countsLoading } = isLocalAuthority
    ? localAuthorityCountsQuery
    : isUser
      ? userCountsQuery
      : isHospital
        ? hospitalCountsQuery
        : careHomeCountsQuery;

  const careHomeDateCountsQuery = useGetCareHomeJobBidsQuery(dateCountsQueryArgs, { skip: skipCareHome, ...countsQueryOptions });
  const hospitalDateCountsQuery = useGetHospitalJobBidsQuery(dateCountsQueryArgs, { skip: !isHospital, ...countsQueryOptions });
  const userDateCountsQuery = useGetUserJobBidsQuery(dateCountsQueryArgs, { skip: !isUser, ...countsQueryOptions });
  const localAuthorityDateCountsQuery = useGetLocalAuthorityJobBidsQuery(dateCountsQueryArgs, { skip: !isLocalAuthority, ...countsQueryOptions });
  const { data: dateCountsData } = isLocalAuthority
    ? localAuthorityDateCountsQuery
    : isUser
      ? userDateCountsQuery
      : isHospital
        ? hospitalDateCountsQuery
        : careHomeDateCountsQuery;

  const [updateCareHomeJobBid] = useUpdateCareHomeJobBidMutation();
  const [updateHospitalJobBid] = useUpdateHospitalJobBidMutation();
  const [updateUserJobBid] = useUpdateUserJobBidMutation();
  const [updateLocalAuthorityJobBid] = useUpdateLocalAuthorityJobBidMutation();
  const [updateCareHomeJob] = useUpdateCareHomeJobMutation();
  const [updateHospitalJob] = useUpdateHospitalJobMutation();
  const [updateUserJob] = useUpdateUserJobMutation();
  const [updateLocalAuthorityJob] = useUpdateLocalAuthorityJobMutation();
  const updateJobBid = isLocalAuthority ? updateLocalAuthorityJobBid : isUser ? updateUserJobBid : isHospital ? updateHospitalJobBid : updateCareHomeJobBid;
  const updateJob = isLocalAuthority ? updateLocalAuthorityJob : isUser ? updateUserJob : isHospital ? updateHospitalJob : updateCareHomeJob;
  const [updatingBidId, setUpdatingBidId] = useState(null);

  const apiBids = useMemo(() => bidsData?.data || [], [bidsData?.data]);
  const apiJobs = useMemo(() => jobsData?.data || [], [jobsData?.data]);
  const [bidOverrides, setBidOverrides] = useState({});

  const bids = useMemo(
    () =>
      apiBids.map((bid) => {
        const bidKey = String(bid.id || bid._id || '');
        const override = bidOverrides[bidKey] || bidOverrides[bid.id] || {};
        const next = { ...bid, ...override };

        return {
          ...next,
          hasAgreedRate: Boolean(next.hasAgreedRate),
          agreedHourlyRate: next.agreedHourlyRate ?? null,
          autoAssignEligible: Boolean(next.autoAssignEligible),
          hourlyRate: Number(next.hourlyRate) || 0,
          totalPrice: Number(next.totalPrice) || 0,
          rating: Number(next.rating) || 0,
          reviews: Number(next.reviews) || 0,
        };
      }),
    [apiBids, bidOverrides]
  );

  const careHomeJobs = useMemo(() => {
    const fromJobsApi = apiJobs.map((job) => ({
      id: job.id,
      type: job.name || job.type || 'Job',
      name: job.name || job.type || 'Job',
      address: job.address || '',
      image: job.image || '',
      status: job.status || 'active',
      schedules: job.schedules || [],
      branchId: job.branchId || '',
      hourlyRate: job.hourlyRate,
      bidCount: job.bidCount,
      acceptedBidsCount: job.acceptedBidsCount,
      hasAcceptedBid: job.hasAcceptedBid,
    }));

    const fromBids = buildJobsFromCareHomeBids(bids);
    const byId = new Map();
    [...fromJobsApi, ...fromBids].forEach((job) => {
      if (!job?.id) return;
      if (!byId.has(job.id)) byId.set(job.id, job);
    });
    return Array.from(byId.values()).filter((job) => jobMatchesActiveBranch(job, activeBranchId));
  }, [activeBranchId, apiJobs, bids]);

  const selectedJobForRate = useMemo(() => {
    if (!jobFilter || jobFilter === 'all') return null;
    return apiJobs.find((job) => String(job.id) === String(jobFilter)) || careHomeJobs.find((job) => String(job.id) === String(jobFilter)) || null;
  }, [apiJobs, careHomeJobs, jobFilter]);

  const selectedJobBidCount = useMemo(() => {
    if (!selectedJobForRate) return null;
    const fromList = bids.filter((bid) => String(bid.jobId) === String(selectedJobForRate.id)).length;
    if (fromList > 0) return fromList;
    return Number(selectedJobForRate.bidCount) || 0;
  }, [bids, selectedJobForRate]);

  const canIncreaseSelectedJobRate = Boolean(selectedJobForRate && !jobHasBids(selectedJobForRate) && selectedJobBidCount === 0);

  const bidsPending = bidsLoading && !bids.length;
  const serverTotalRaw = bidsData?.meta?.totalRecords ?? bidsData?.total_length;
  const apiHasTotal = serverTotalRaw !== undefined && serverTotalRaw !== null && serverTotalRaw !== '';
  const serverTotal = apiHasTotal ? Number(serverTotalRaw) || 0 : null;

  useEffect(() => {
    setPage(1);
    setJobFilter((current) => (current === 'all' || careHomeJobs.some((job) => job.id === current) ? current : 'all'));
  }, [activeBranchId, careHomeJobs]);

  useEffect(() => {
    const jobId = searchParams.get('jobId');
    if (!jobId) return;
    if (careHomeJobs.some((job) => job.id === jobId) || bids.some((bid) => bid.jobId === jobId)) {
      setJobFilter(jobId);
      setPage(1);
    }
  }, [searchParams, careHomeJobs, bids]);

  useEffect(() => {
    if (!bidsError) return;
    toast.error(bidsErrorDetail?.data?.message || bidsErrorDetail?.error || 'Could not load job bids.');
  }, [bidsError, bidsErrorDetail]);

  const filteredBids = useMemo(() => {
    const siteJobIds = new Set(careHomeJobs.map((job) => String(job.id)));
    const byStatus = bids.filter((bid) => statusFilter === 'all' || getBidUiStatus(bid) === statusFilter);
    const bySite = byStatus.filter((bid) => bidMatchesActiveBranch(bid, activeBranchId, siteJobIds));
    return sortBids(bySite, sortBy);
  }, [activeBranchId, bids, careHomeJobs, sortBy, statusFilter]);

  useEffect(() => {
    if (bidsLoading || bidsFetching) return;
    if (dateFilter !== 'all') return;
    setAllBidsSnapshot(bids);
  }, [bids, bidsFetching, bidsLoading, dateFilter]);

  const dateFilterCounts = useMemo(() => {
    const meta = dateCountsData?.bidCount;
    if (hasBidCountMeta(meta)) {
      return DATE_FILTERS.reduce((acc, filter) => {
        acc[filter.value] = readBidCount(meta, DATE_FILTER_COUNT_KEYS[filter.value]);
        return acc;
      }, {});
    }

    const source = (dateFilter === 'all' ? bids : allBidsSnapshot).filter(
      (bid) => statusFilter === 'all' || getBidUiStatus(bid) === statusFilter
    );

    return DATE_FILTERS.reduce((acc, filter) => {
      if (filter.value === 'all') {
        acc[filter.value] = apiHasTotal && dateFilter === 'all' ? serverTotal : source.length;
      } else if (dateFilter === filter.value && apiHasTotal) {
        acc[filter.value] = serverTotal;
      } else {
        acc[filter.value] = 0;
      }
      return acc;
    }, {});
  }, [allBidsSnapshot, apiHasTotal, bids, dateCountsData?.bidCount, dateFilter, serverTotal, statusFilter]);

  const statusCounts = useMemo(() => {
    const fromMeta = countsData?.bidCount || {};

    if (hasBidCountMeta(fromMeta)) {
      return BID_STATUS_FILTERS.reduce((acc, filter) => {
        acc[filter.value] = readBidCount(fromMeta, filter.value === 'all' ? 'total' : filter.value);
        return acc;
      }, {});
    }

    return BID_STATUS_FILTERS.reduce((acc, filter) => {
      if (filter.value === 'all') {
        acc.all = Number(fromMeta.all ?? fromMeta.total ?? (apiHasTotal ? serverTotal : null) ?? bids.length) || 0;
      } else if (statusFilter === filter.value) {
        acc[filter.value] = apiHasTotal ? serverTotal : bids.length;
      } else {
        acc[filter.value] = Number(fromMeta[filter.value]) || 0;
      }
      return acc;
    }, {});
  }, [apiHasTotal, bids.length, countsData, serverTotal, statusFilter]);

  const isPerJobView = groupMode === 'per-job';

  const bidsGroupedByJob = useMemo(() => {
    const byJobId = filteredBids.reduce((acc, bid) => {
      const key = bid.jobId || 'unknown';
      if (!acc[key]) acc[key] = [];
      acc[key].push(bid);
      return acc;
    }, {});

    const groups = [];
    const used = new Set();

    careHomeJobs.forEach((job) => {
      const jobBids = byJobId[job.id];
      if (!jobBids?.length) return;
      groups.push({ job, bids: jobBids });
      used.add(job.id);
    });

    Object.entries(byJobId).forEach(([jobId, jobBids]) => {
      if (used.has(jobId)) return;
      groups.push({
        job: { id: jobId, type: 'Other job', address: '' },
        bids: jobBids,
      });
    });

    return groups.sort((groupA, groupB) => {
      const newestA = Math.max(0, ...groupA.bids.map(getBidReceivedTime));
      const newestB = Math.max(0, ...groupB.bids.map(getBidReceivedTime));
      return newestB - newestA;
    });
  }, [filteredBids, careHomeJobs]);

  const listTotal = apiHasTotal ? serverTotal : filteredBids.length;
  const pageCount = Math.max(
    1,
    apiHasTotal
      ? Math.ceil(serverTotal / rowsPerPage) || 1
      : filteredBids.length < rowsPerPage
        ? page
        : page + 1
  );
  const safePage = Math.min(page, pageCount);
  const paginatedBids = filteredBids;
  const paginatedJobGroups = isPerJobView ? bidsGroupedByJob : [];

  useEffect(() => {
    if (!apiHasTotal) return;
    if (page > pageCount) setPage(pageCount);
  }, [apiHasTotal, page, pageCount]);

  const handleChangePage = useCallback((event, newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleViewModeChange = useCallback(
    (event, nextView) => {
      if (nextView) {
        setViewMode(nextView);
        setPage(1);
      }
    },
    [setViewMode]
  );

  const handleGroupModeChange = useCallback(
    (event, nextMode) => {
      if (!nextMode) return;

      setGroupMode(nextMode);
      setPage(1);

      if (nextMode === 'per-job') {
        setJobFilter('all');
        router.replace(bidsPath);
      }
    },
    [bidsPath, router]
  );

  const handleDateFilterChange = useCallback((nextFilter) => {
    if (nextFilter) {
      setDateFilter(nextFilter);
      setPage(1);
    }
  }, []);

  const handleStatusFilterChange = useCallback((nextFilter) => {
    if (!nextFilter) return;
    setStatusFilter(nextFilter);
    setPage(1);
  }, []);

  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value);
    setPage(1);
  }, []);

  const handleSortChange = useCallback((value) => {
    setSortBy(value);
    setPage(1);
  }, []);

  const hasActiveFilters = jobFilter !== 'all' || statusFilter !== 'all' || dateFilter !== 'all' || Boolean(searchQuery.trim());

  const handleClearFilters = useCallback(() => {
    setJobFilter('all');
    setStatusFilter('all');
    setDateFilter('all');
    setSearchQuery('');
    setPage(1);
    router.replace(bidsPath);
  }, [bidsPath, router]);

  const handleJobFilterChange = useCallback(
    (nextFilter) => {
      setJobFilter(nextFilter);
      setPage(1);

      if (nextFilter === 'all') {
        router.replace(bidsPath);
        return;
      }

      router.replace(`${bidsPath}?jobId=${encodeURIComponent(nextFilter)}`);
    },
    [bidsPath, router]
  );

  const handleOpenIncreaseRate = useCallback(() => {
    if (!selectedJobForRate || !canIncreaseSelectedJobRate) return;
    setRateJob(selectedJobForRate);
    rateDialog.onTrue();
  }, [canIncreaseSelectedJobRate, rateDialog, selectedJobForRate]);

  const handleCloseIncreaseRate = useCallback(() => {
    rateDialog.onFalse();
    setRateJob(null);
  }, [rateDialog]);

  const handleSubmitIncreaseRate = useCallback(
    async ({ job, nextRate }) => {
      if (!job?.id) throw new Error('Job not found');

      const draft = jobToDraft(job);
      const rateValue = String(nextRate);
      const nextDraft = {
        ...draft,
        hourlyRate: rateValue,
        schedules: (draft.schedules || []).map((entry) => ({
          ...entry,
          hourlyRate: rateValue,
        })),
      };

      const branch = branches.find((item) => item.id === nextDraft.branchId) || branches.find((item) => item._id === nextDraft.branchId) || null;

      if (!nextDraft.branchId || !branch) {
        throw new Error('Please select a location on the job first');
      }

      const body = buildCareHomeJobPayload(
        {
          ...nextDraft,
          location: branch?.location || nextDraft.location,
        },
        branch,
        { includeStatus: true, isUser }
      );

      if (!body.shift?.length) throw new Error('This job has no shifts to update');

      let response;
      try {
        response = await updateJob({ id: job.id, ...body }).unwrap();
      } catch (err) {
        if (!isJobCreateSoftError(err)) throw err;
        response = err?.data;
      }

      toast.success(pickJobSuccessToast(response, `Rate updated to ${fCurrency(nextRate)}/h`));
      refetchJobs?.();
      refetchBids?.();
    },
    [branches, isUser, refetchBids, refetchJobs, updateJob]
  );

  const handleDecline = useCallback(
    async (bidId) => {
      if (!bidId || updatingBidId) return;

      setUpdatingBidId(bidId);
      try {
        await updateJobBid({
          id: bidId,
          status: toCareHomeBidApiStatus('declined'),
        }).unwrap();

        setBidOverrides((prev) => ({
          ...prev,
          [bidId]: { ...(prev[bidId] || {}), status: 'declined' },
        }));
        toast.success('Bid rejected');
      } catch (err) {
        toast.error(err?.data?.message || err?.error || err?.message || 'Could not reject bid');
      } finally {
        setUpdatingBidId(null);
      }
    },
    [updateJobBid, updatingBidId]
  );

  const employerMessagesPath = useMemo(() => getEmployerMessagesPath(mode), [mode]);

  const handleChatWithBidder = useCallback(
    (bid) => {
      const participant = getBidderParticipantFromEmployerBid(bid);
      if (!participant.id) {
        toast.error('Cannot start chat — bidder profile is missing');
        return;
      }
      router.push(buildDirectChatUrl(employerMessagesPath, participant));
    },
    [employerMessagesPath, router]
  );

  const handleAccepted = useCallback(
    async (bidId) => {
      const id = String(bidId || '').trim();
      if (!id) {
        toast.error('Missing bid id');
        throw new Error('Missing bid id');
      }
      if (updatingBidId) {
        toast.warning('Please wait — another bid is still updating');
        throw new Error('Bid update in progress');
      }

      setUpdatingBidId(id);
      try {
        await updateJobBid({ id, status: toCareHomeBidApiStatus('accepted') }).unwrap();

        setBidOverrides((prev) => ({
          ...prev,
          [id]: { ...(prev[id] || {}), status: 'accepted' },
        }));
      } catch (err) {
        toast.error(
          getJobApiErrorMessage(err) || err?.data?.message || err?.error || err?.message || 'Could not accept bid'
        );
        throw err;
      } finally {
        setUpdatingBidId(null);
        try {
          await refetchBids();
        } catch {
        }
      }
    },
    [refetchBids, updateJobBid, updatingBidId]
  );

  const selectedJobInfo = useMemo(
    () => (jobFilter === 'all' ? null : careHomeJobs.find((job) => String(job.id) === String(jobFilter)) || selectedJobForRate),
    [careHomeJobs, jobFilter, selectedJobForRate]
  );

  const backHref = isLocalAuthority
    ? paths.dashboard.localAuthority.root
    : isUser
      ? paths.dashboard.individualHomeCare.root
      : isHospital
        ? paths.dashboard.hospital.root
        : paths.dashboard.root;

  const renderBidCard = (bid, cardViewMode, extra = {}) => (
    <BidCard
      bid={bid}
      viewMode={cardViewMode}
      onDecline={viewOnly ? undefined : handleDecline}
      onAccepted={viewOnly ? undefined : handleAccepted}
      onChat={handleChatWithBidder}
      updatingBidId={updatingBidId}
      {...extra}
    />
  );

  const renderBidGrid = (items, extra) => (
    <Grid container spacing={2}>
      {items.map((bid) => (
        <Grid key={bid.id} item xs={12} sm={6} lg={4} xl={3}>
          {renderBidCard(bid, 'grid', extra)}
        </Grid>
      ))}
    </Grid>
  );

  const renderEmpty = () => {
    if (canIncreaseSelectedJobRate) {
      return (
        <EmptyContent
          filled
          title="No bids yet"
          description="No one has bid on this job yet. Increasing the rate can attract more applicants."
          sx={{ py: 8 }}
          action={
            viewOnly ? null : (
              <Button variant="contained" startIcon={<Iconify icon="solar:tag-price-bold" width={18} />} onClick={handleOpenIncreaseRate} sx={{ mt: 2 }}>
                Increase rate
              </Button>
            )
          }
        />
      );
    }

    if (hasActiveFilters) {
      return (
        <EmptyContent
          filled
          title="No bids match your filters"
          description="Try a different status, date or search term."
          sx={{ py: 8 }}
          action={
            <Button variant="outlined" color="inherit" startIcon={<Iconify icon="solar:restart-bold" width={18} />} onClick={handleClearFilters} sx={{ mt: 2 }}>
              Clear filters
            </Button>
          }
        />
      );
    }

    return <EmptyContent filled title="No bids yet" description="When nurses, agencies or home care companies bid on your jobs, they will appear here." sx={{ py: 8 }} />;
  };

  const renderContent = () => {
    if (bidsPending && !bidsError) {
      return <BidsLoadingSkeleton viewMode={isPerJobView ? 'grid' : viewMode} />;
    }

    if (bidsError && !bids.length) {
      return (
        <EmptyContent
          filled
          title="Could not load bids"
          description={bidsErrorDetail?.data?.message || 'Check your connection and try again.'}
          sx={{ py: 8 }}
          action={
            <Button variant="contained" startIcon={<Iconify icon="eva:refresh-fill" />} onClick={() => refetchBids()} sx={{ mt: 2 }}>
              Retry
            </Button>
          }
        />
      );
    }

    if (filteredBids.length === 0) return renderEmpty();

    if (isPerJobView) {
      return (
        <Stack spacing={3}>
          {paginatedJobGroups.map(({ job, bids: jobBids }) => (
            <Card key={job.id} sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2, bgcolor: 'background.neutral', boxShadow: 'none' }}>
              <JobBidsJobHeader
                job={job}
                bidCount={jobBids.length}
                sx={{ mb: 2 }}
                action={
                  job.id !== 'unknown' ? (
                    <Button
                      size="small"
                      variant="outlined"
                      color="inherit"
                      endIcon={<Iconify icon="eva:arrow-ios-forward-fill" width={16} />}
                      onClick={() => {
                        setGroupMode('all');
                        handleJobFilterChange(job.id);
                      }}
                    >
                      Only this job
                    </Button>
                  ) : null
                }
              />
              {renderBidGrid(jobBids, { showJob: false })}
            </Card>
          ))}
        </Stack>
      );
    }

    if (viewMode === 'grid') return renderBidGrid(paginatedBids);

    return (
      <Stack spacing={1.5}>
        {paginatedBids.map((bid) => (
          <Box key={bid.id}>{renderBidCard(bid, 'list')}</Box>
        ))}
      </Stack>
    );
  };

  return (
    <DashboardContent maxWidth="xl">
      <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between" gap={2} sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
          <Tooltip title="Back to dashboard">
            <IconButton component={RouterLink} href={backHref} aria-label="Back to dashboard" sx={{ ml: -1 }}>
              <Iconify icon="eva:arrow-back-fill" width={24} />
            </IconButton>
          </Tooltip>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h4" component="h1">
              Bids
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review offers from nurses, agencies and home care companies, then accept or reject.
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
          {!isHospital && !isLocalAuthority && (
            <Button component={RouterLink} href={agreedRatesPath} variant="outlined" color="inherit" startIcon={<Iconify icon="solar:hand-money-bold" width={18} />}>
              Agreed rates
            </Button>
          )}

          <ToggleButtonGroup
            exclusive
            size="small"
            value={groupMode}
            onChange={handleGroupModeChange}
            aria-label="Group bids"
            sx={{
              p: 0.5,
              gap: 0.5,
              borderRadius: 1.5,
              bgcolor: 'background.neutral',
              border: 0,
              '& .MuiToggleButtonGroup-grouped': { border: 0, borderRadius: '8px !important', m: 0 },
              '& .MuiToggleButton-root': {
                px: 1.75,
                height: 36,
                fontWeight: 600,
                color: 'text.secondary',
                '&.Mui-selected': {
                  bgcolor: 'background.paper',
                  color: 'text.primary',
                  boxShadow: (theme) => theme.customShadows.z1,
                  '&:hover': { bgcolor: 'background.paper' },
                },
              },
            }}
          >
            <ToggleButton value="all">All bids</ToggleButton>
            <ToggleButton value="per-job">Per job</ToggleButton>
          </ToggleButtonGroup>

          {!isPerJobView && (
            <ToggleButtonGroup
              exclusive
              size="small"
              value={viewMode}
              onChange={handleViewModeChange}
              aria-label="Layout"
              sx={{ '& .MuiToggleButton-root': { height: 44, width: 44 } }}
            >
              <ToggleButton value="list" aria-label="List view" title="List view">
                <Iconify icon="solar:list-bold" width={18} />
              </ToggleButton>
              <ToggleButton value="grid" aria-label="Grid view" title="Grid view">
                <Iconify icon="solar:widget-5-bold" width={18} />
              </ToggleButton>
            </ToggleButtonGroup>
          )}
        </Stack>
      </Stack>

      <JobBidsSummary counts={statusCounts} activeStatus={statusFilter} onSelectStatus={handleStatusFilterChange} loading={countsLoading} />

      {!isPerJobView && selectedJobInfo ? (
        <JobBidsSelectedJobCard
          job={selectedJobInfo}
          bidCount={selectedJobBidCount ?? 0}
          canIncreaseRate={canIncreaseSelectedJobRate && !viewOnly}
          onIncreaseRate={handleOpenIncreaseRate}
          onClear={() => handleJobFilterChange('all')}
        />
      ) : null}

      <JobBidsToolbar
        jobs={careHomeJobs}
        showJobFilter={!isPerJobView}
        search={searchQuery}
        onSearchChange={handleSearchChange}
        jobFilter={jobFilter}
        onJobFilterChange={handleJobFilterChange}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        statusCounts={statusCounts}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        dateFilter={dateFilter}
        onDateFilterChange={handleDateFilterChange}
        dateFilterCounts={dateFilterCounts}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
        resultCount={listTotal}
      />

      {renderContent()}

      {(apiHasTotal ? serverTotal > rowsPerPage : pageCount > 1 || filteredBids.length >= rowsPerPage) && (
        <Pagination page={safePage} count={pageCount} shape="circular" onChange={handleChangePage} sx={{ mt: 4, display: 'flex', justifyContent: 'center' }} />
      )}

      <IncreaseJobRateDialog open={rateDialog.value} job={rateJob} onClose={handleCloseIncreaseRate} onSubmit={handleSubmitIncreaseRate} />
    </DashboardContent>
  );
}


function BidsLoadingSkeleton({ viewMode }) {
  const isGrid = viewMode === 'grid';
  const items = Array.from({ length: isGrid ? 8 : 4 }, (_, index) => index);

  const renderItem = (key) => (
    <Card key={key} sx={{ p: 2.5, borderRadius: 2 }} aria-hidden>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Skeleton variant="circular" width={48} height={48} />
        <Box sx={{ flex: 1 }}>
          <Skeleton width="40%" />
          <Skeleton width="25%" />
        </Box>
        {!isGrid ? <Skeleton width={80} height={32} /> : null}
      </Stack>
      <Skeleton width="70%" sx={{ mt: 2 }} />
      <Skeleton width="50%" />
      <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 2 }}>
        <Skeleton variant="rounded" width={88} height={32} />
        <Skeleton variant="rounded" width={104} height={32} />
      </Stack>
    </Card>
  );

  return (
    <Box role="status" aria-label="Loading bids">
      {isGrid ? (
        <Grid container spacing={2}>
          {items.map((key) => (
            <Grid key={key} item xs={12} sm={6} lg={4} xl={3}>
              {renderItem(key)}
            </Grid>
          ))}
        </Grid>
      ) : (
        <Stack spacing={1.5}>{items.map(renderItem)}</Stack>
      )}
    </Box>
  );
}
