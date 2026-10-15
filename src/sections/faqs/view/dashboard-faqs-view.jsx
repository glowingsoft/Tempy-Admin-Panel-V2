import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { getDashboardRootPath } from 'src/auth/utils/dashboard-path-utils';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { Iconify } from 'src/components/iconify';
import { ModuleLoading } from 'src/components/loading-screen';
import { TablePaginationCustom } from 'src/components/table';

import { useGetFaqsQuery } from 'src/store/Reducer/faqs-api';

import { resolveFaqAccountKey } from '../faq-api-utils';
import { getFaqTypeLabel } from '../faq-store';

// ----------------------------------------------------------------------

export function DashboardFaqsView() {
  const { user } = useSelector((state) => state.user);
  const accountType = user?.accountState?.accountType;
  const permission = user?.permission;
  const accountKey = useMemo(() => resolveFaqAccountKey(user), [user]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    setPage(0);
  }, [accountKey]);

  const { data: faqsData, isLoading, isError, error, refetch } = useGetFaqsQuery({ accountKey, page: page + 1, limit: rowsPerPage }, { skip: !accountKey });

  const allFaqs = faqsData?.data || [];
  const clientPaged = allFaqs.length > rowsPerPage;
  const faqs = clientPaged ? allFaqs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) : allFaqs;
  const totalRecords = faqsData?.meta?.hasTotal ? faqsData.meta.totalRecords : null;
  const count = clientPaged
    ? allFaqs.length
    : totalRecords != null
      ? totalRecords
      : allFaqs.length < rowsPerPage
        ? page * rowsPerPage + allFaqs.length
        : page * rowsPerPage + allFaqs.length + 1;
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(faqs[0]?.id || false);
  }, [faqs[0]?.id]);

  const dashboardRoot = getDashboardRootPath(permission, accountType);
  const listLoading = isLoading;
  const listErrorMessage = error?.data?.message || error?.error || 'Something went wrong while fetching FAQs.';

  const handleAccordionChange = useCallback(
    (panel) => (event, isExpanded) => {
      setExpanded(isExpanded ? panel : false);
    },
    []
  );

  return (
    <Box sx={{ px: { xs: 2, md: 6 }, pb: 5, pt: 3 }}>
      <CustomBreadcrumbs heading="FAQs" links={[{ name: 'Dashboard', href: dashboardRoot || paths.dashboard.root }, { name: 'FAQs' }]} sx={{ mb: { xs: 3, md: 5 } }} />

      <Stack spacing={1.5} sx={{ mb: 3 }}>
        <Typography variant="h5">Frequently asked questions</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Answers for {getFaqTypeLabel(accountType) || 'your'} accounts.
        </Typography>
      </Stack>

      {!accountKey ? (
        <Stack spacing={1} alignItems="center" justifyContent="center" sx={{ py: 8, borderRadius: 2, bgcolor: 'background.neutral' }}>
          <Iconify icon="solar:question-circle-bold" width={40} sx={{ color: 'text.disabled' }} />
          <Typography variant="subtitle1">FAQs unavailable</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Could not resolve FAQs for this account type.
          </Typography>
        </Stack>
      ) : listLoading ? (
        <ModuleLoading />
      ) : isError && !faqs.length ? (
        <Stack spacing={1.5} alignItems="center" justifyContent="center" sx={{ py: 8, borderRadius: 2, bgcolor: 'background.neutral' }}>
          <Iconify icon="solar:danger-triangle-bold" width={40} sx={{ color: 'error.main' }} />
          <Typography variant="subtitle1">Could not load FAQs</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {listErrorMessage}
          </Typography>
          <Button variant="outlined" color="inherit" onClick={() => refetch()}>
            Retry
          </Button>
        </Stack>
      ) : (
        <Stack spacing={2}>
          {faqs.length ? (
            faqs.map((faq, index) => (
              <Accordion key={faq.id} expanded={expanded === faq.id} onChange={handleAccordionChange(faq.id)}>
                <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
                  <Box>
                    <Typography variant="overline" sx={{ color: 'text.disabled' }}>
                      FAQ {page * rowsPerPage + index + 1}
                    </Typography>
                    <Typography variant="subtitle1">{faq.heading}</Typography>
                  </Box>
                </AccordionSummary>

                <AccordionDetails>
                  <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'pre-line' }}>
                    {faq.detail}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))
          ) : (
            <Stack spacing={1} alignItems="center" justifyContent="center" sx={{ py: 8, borderRadius: 2, bgcolor: 'background.neutral' }}>
              <Iconify icon="solar:question-circle-bold" width={40} sx={{ color: 'text.disabled' }} />
              <Typography variant="subtitle1">No FAQs available</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                There are no FAQs for your account type yet.
              </Typography>
            </Stack>
          )}
          <TablePaginationCustom
            count={count}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(Number(event.target.value));
              setPage(0);
            }}
          />
        </Stack>
      )}
    </Box>
  );
}
