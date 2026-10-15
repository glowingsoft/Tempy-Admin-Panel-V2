import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';

import {
  useGetMySupplierJobRolesQuery,
  useGetSupplierJobRoleChoicesQuery,
  useUpdateMySupplierJobRolesMutation,
} from 'src/store/Reducer/supplier-job-roles-api';

import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';
import { EmptyContent } from 'src/components/empty-content';
import { ModuleLoading } from 'src/components/loading-screen';

import { groupJobRolesByDepartment } from './supplier-job-roles-utils';
import { useViewOnly } from 'src/hooks/use-view-only';

// ----------------------------------------------------------------------

function toIdSet(list = []) {
  return new Set(list.map((item) => item.id).filter(Boolean));
}

function sameIds(a, b) {
  if (a.size !== b.size) return false;
  return [...a].every((id) => b.has(id));
}

function getErrorMessage(error, fallback) {
  return error?.data?.message || error?.data?.error?.message || error?.error || fallback;
}

/**
 * "My job types" — suppliers pick which admin job types they provide.
 * The saved list decides the rows on their shifts calendar.
 */
export function SupplierJobRolesForm({ role }) {
  const viewOnly = useViewOnly();
  const choicesQuery = useGetSupplierJobRoleChoicesQuery({ role }, { refetchOnMountOrArgChange: 60, refetchOnFocus: false });
  const mineQuery = useGetMySupplierJobRolesQuery({ role }, { refetchOnMountOrArgChange: 60, refetchOnFocus: false });
  const [saveJobRoles, { isLoading: saving }] = useUpdateMySupplierJobRolesMutation();

  const choices = useMemo(() => choicesQuery.data || [], [choicesQuery.data]);
  const savedIds = useMemo(() => toIdSet(mineQuery.data || []), [mineQuery.data]);

  const [selected, setSelected] = useState(() => new Set());
  const [search, setSearch] = useState('');

  // Pre-tick the saved job types whenever the saved list (re)loads.
  useEffect(() => {
    setSelected(new Set(savedIds));
  }, [savedIds]);

  // After the choices reload (e.g. a job type was deactivated), drop ticks that no longer exist.
  useEffect(() => {
    if (!choicesQuery.data) return;
    const valid = toIdSet(choicesQuery.data);
    setSelected((prev) => {
      const next = new Set([...prev].filter((id) => valid.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [choicesQuery.data]);

  const groups = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = term
      ? choices.filter((item) => item.label.toLowerCase().includes(term))
      : choices;
    return groupJobRolesByDepartment(filtered);
  }, [choices, search]);

  const dirty = !sameIds(selected, savedIds);

  const toggle = useCallback((id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const setGroup = useCallback((items, checked) => {
    setSelected((prev) => {
      const next = new Set(prev);
      items.forEach((item) => (checked ? next.add(item.id) : next.delete(item.id)));
      return next;
    });
  }, []);

  const handleSave = useCallback(async () => {
    try {
      // Always the full list — this call replaces what is saved ([] clears everything).
      await saveJobRoles({ role, jobRoles: [...selected] }).unwrap();
      toast.success(selected.size ? 'Job types saved' : 'Job types cleared');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not save job types'));
      if (error?.status === 400) {
        // invalid_job_roles — a job type is no longer active; reload the choices.
        choicesQuery.refetch();
        mineQuery.refetch();
      }
    }
  }, [choicesQuery, mineQuery, role, saveJobRoles, selected]);

  if (choicesQuery.isLoading || mineQuery.isLoading) {
    return <ModuleLoading />;
  }

  if (choicesQuery.isError) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={() => choicesQuery.refetch()}>
            Retry
          </Button>
        }
      >
        {getErrorMessage(choicesQuery.error, 'Could not load job types')}
      </Alert>
    );
  }

  return (
    <Card sx={{ p: { xs: 2, md: 3 } }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', sm: 'flex-start' }}
        justifyContent="space-between"
        sx={{ mb: 2.5 }}
      >
        <Box>
          <Typography variant="h6">My job types</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, maxWidth: 560 }}>
            Choose the job types you provide. Each one gets its own row on your shifts calendar,
            even before you have shifts for it.
          </Typography>
        </Box>
        <Chip
          color={selected.size ? 'primary' : 'default'}
          variant="soft"
          label={`${selected.size} selected`}
          sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
        />
      </Stack>

      {mineQuery.isError ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {getErrorMessage(mineQuery.error, 'Could not load your saved job types')}
        </Alert>
      ) : null}

      {!choices.length ? (
        <EmptyContent
          filled
          title="No job types available"
          description="An admin hasn't added any active job types yet."
          sx={{ py: 6 }}
        />
      ) : (
        <>
          <TextField
            fullWidth
            size="small"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search job types…"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          {!groups.length ? (
            <Typography variant="body2" sx={{ color: 'text.secondary', py: 3, textAlign: 'center' }}>
              No job types match “{search.trim()}”.
            </Typography>
          ) : (
            <Stack spacing={2} divider={<Divider flexItem />}>
              {groups.map(({ department, items }) => {
                const checkedCount = items.filter((item) => selected.has(item.id)).length;
                const allChecked = checkedCount === items.length;
                return (
                  <Box key={department}>
                    <FormControlLabel
                      label={
                        <Typography variant="subtitle2">
                          {department}{' '}
                          <Typography component="span" variant="caption" sx={{ color: 'text.secondary' }}>
                            ({checkedCount}/{items.length})
                          </Typography>
                        </Typography>
                      }
                      control={
                        <Checkbox
                          size="small"
                          checked={allChecked}
                          indeterminate={checkedCount > 0 && !allChecked}
                          onChange={(event) => setGroup(items, event.target.checked)}
                        />
                      }
                    />
                    <Box
                      sx={{
                        pl: { xs: 2, sm: 3.5 },
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                        columnGap: 2,
                      }}
                    >
                      {items.map((item) => (
                        <FormControlLabel
                          key={item.id}
                          label={<Typography variant="body2">{item.title || item.label}</Typography>}
                          control={
                            <Checkbox
                              size="small"
                              checked={selected.has(item.id)}
                              onChange={() => toggle(item.id)}
                            />
                          }
                          sx={{ mr: 0, minWidth: 0 }}
                        />
                      ))}
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          )}
        </>
      )}

      {/* Admin viewing the account cannot change its job types. */}
      <Stack
        direction="row"
        spacing={1.5}
        justifyContent="flex-end"
        sx={{ mt: 3, display: viewOnly ? 'none' : 'flex' }}
      >
        <Button
          color="inherit"
          variant="outlined"
          disabled={!dirty || saving}
          onClick={() => setSelected(new Set(savedIds))}
        >
          Reset
        </Button>
        <LoadingButton variant="contained" loading={saving} disabled={!dirty} onClick={handleSave}>
          Save job types
        </LoadingButton>
      </Stack>
    </Card>
  );
}
