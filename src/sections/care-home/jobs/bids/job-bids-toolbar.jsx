import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import ListSubheader from '@mui/material/ListSubheader';
import InputAdornment from '@mui/material/InputAdornment';

import { Iconify } from 'src/components/iconify';
import { JobMediaThumb } from 'src/components/jobs/job-image';

import { DATE_FILTERS, BID_SORT_OPTIONS, BID_STATUS_FILTERS, getJobFilterLabel } from './job-bid-utils';

// ----------------------------------------------------------------------

const JOB_FILTER_MENU_MAX_HEIGHT = 360;

const FIELD_SX = { minWidth: 0, flex: { xs: '1 1 100%', sm: '1 1 180px', lg: '0 0 220px' } };

function JobFilterSelect({ jobs, value, onChange }) {
  const [search, setSearch] = useState('');

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return jobs;

    return jobs.filter((job) => {
      const label = getJobFilterLabel(job).toLowerCase();
      const address = (job.address || '').toLowerCase();
      const id = String(job.id || '').toLowerCase();
      return label.includes(query) || address.includes(query) || id.includes(query);
    });
  }, [jobs, search]);

  const selectedJob = jobs.find((job) => job.id === value);

  return (
    <FormControl size="small" sx={FIELD_SX}>
      <InputLabel id="bids-job-filter-label">Job</InputLabel>
      <Select
        labelId="bids-job-filter-label"
        value={value}
        label="Job"
        onChange={(event) => onChange(event.target.value)}
        onClose={() => setSearch('')}
        renderValue={(selected) => {
          if (selected === 'all' || !selectedJob) return 'All jobs';
          return (
            <Stack direction="row" alignItems="center" spacing={0.75} sx={{ minWidth: 0 }}>
              <JobMediaThumb image={selectedJob.image} alt={getJobFilterLabel(selectedJob)} width={22} height={22} />
              <Typography variant="body2" noWrap>
                {getJobFilterLabel(selectedJob)}
              </Typography>
            </Stack>
          );
        }}
        MenuProps={{
          autoFocus: false,
          PaperProps: { sx: { width: 360, maxWidth: '92vw', maxHeight: JOB_FILTER_MENU_MAX_HEIGHT } },
        }}
      >
        <ListSubheader
          sx={{
            bgcolor: 'background.paper',
            lineHeight: 'normal',
            py: 1,
            px: 1.5,
            position: 'sticky',
            top: 0,
            zIndex: 2,
            borderBottom: (theme) => `1px solid ${theme.vars.palette.divider}`,
          }}
        >
          <TextField
            size="small"
            fullWidth
            placeholder="Search jobs..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
            inputProps={{ 'aria-label': 'Search jobs' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" width={18} sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
          />
        </ListSubheader>

        <MenuItem value="all">All jobs</MenuItem>

        {value !== 'all' && selectedJob && !filteredJobs.some((job) => job.id === value) && (
          <MenuItem value={value} sx={{ display: 'none' }}>
            {getJobFilterLabel(selectedJob)}
          </MenuItem>
        )}

        {filteredJobs.length === 0 ? (
          <MenuItem disabled dense>
            <Typography variant="body2" color="text.secondary">
              No jobs found
            </Typography>
          </MenuItem>
        ) : (
          filteredJobs.map((job) => (
            <MenuItem key={job.id} value={job.id}>
              <JobMediaThumb image={job.image} alt={getJobFilterLabel(job)} width={34} height={34} sx={{ mr: 1 }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" noWrap>
                  {getJobFilterLabel(job)}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap component="p">
                  {job.address}
                </Typography>
              </Box>
            </MenuItem>
          ))
        )}
      </Select>
    </FormControl>
  );
}

function StatusFilterSelect({ value, onChange, counts = {} }) {
  return (
    <FormControl size="small" sx={FIELD_SX}>
      <InputLabel id="bids-status-filter-label">Status</InputLabel>
      <Select
        labelId="bids-status-filter-label"
        value={value}
        label="Status"
        onChange={(event) => onChange(event.target.value)}
        renderValue={(selected) => BID_STATUS_FILTERS.find((filter) => filter.value === selected)?.label || 'All statuses'}
      >
        {BID_STATUS_FILTERS.map((filter) => (
          <MenuItem key={filter.value} value={filter.value}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: 1 }}>
              <Typography variant="body2">{filter.label}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                {counts[filter.value] || 0}
              </Typography>
            </Stack>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

function SortSelect({ value, onChange }) {
  return (
    <FormControl size="small" sx={FIELD_SX}>
      <InputLabel id="bids-sort-label">Sort by</InputLabel>
      <Select labelId="bids-sort-label" value={value} label="Sort by" onChange={(event) => onChange(event.target.value)}>
        {BID_SORT_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

// ----------------------------------------------------------------------

export function JobBidsToolbar({
  jobs,
  showJobFilter = true,
  search,
  onSearchChange,
  jobFilter,
  onJobFilterChange,
  statusFilter,
  onStatusFilterChange,
  statusCounts,
  sortBy,
  onSortChange,
  dateFilter,
  onDateFilterChange,
  dateFilterCounts,
  hasActiveFilters,
  onClearFilters,
  resultCount,
}) {
  return (
    <Card sx={{ p: { xs: 2, md: 2.5 }, mb: 3, borderRadius: 2 }}>
      <Stack direction="row" flexWrap="wrap" gap={1.5} alignItems="center">
        <TextField
          size="small"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by bidder, job or speciality..."
          inputProps={{ 'aria-label': 'Search bids' }}
          sx={{ flex: { xs: '1 1 100%', lg: '1 1 240px' }, minWidth: 0 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
            endAdornment: search ? (
              <InputAdornment position="end">
                <IconButton size="small" aria-label="Clear search" onClick={() => onSearchChange('')} edge="end">
                  <Iconify icon="mingcute:close-line" width={16} />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />
        {showJobFilter ? <JobFilterSelect jobs={jobs} value={jobFilter} onChange={onJobFilterChange} /> : null}
        <StatusFilterSelect value={statusFilter} onChange={onStatusFilterChange} counts={statusCounts} />
        <SortSelect value={sortBy} onChange={onSortChange} />
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between" gap={1.5} sx={{ mt: 2 }}>
        <Stack direction="row" flexWrap="wrap" gap={1} role="group" aria-label="Filter by shift date">
          {DATE_FILTERS.map((filter) => {
            const isSelected = dateFilter === filter.value;
            const count = isSelected ? resultCount : dateFilterCounts[filter.value] ?? 0;

            return (
              <Chip
                key={filter.value}
                clickable
                aria-pressed={isSelected}
                color={isSelected ? 'primary' : 'default'}
                variant={isSelected ? 'filled' : 'outlined'}
                onClick={() => onDateFilterChange(filter.value)}
                label={
                  <Stack direction="row" alignItems="center" spacing={0.75} component="span">
                    <span>{filter.label}</span>
                    <Box
                      component="span"
                      sx={{
                        px: 0.75,
                        minWidth: 20,
                        borderRadius: 1,
                        fontSize: 11,
                        fontWeight: 700,
                        lineHeight: '18px',
                        textAlign: 'center',
                        bgcolor: isSelected ? 'primary.contrastText' : 'action.hover',
                        color: isSelected ? 'primary.main' : 'text.secondary',
                      }}
                    >
                      {count}
                    </Box>
                  </Stack>
                }
                sx={{ fontWeight: 600, height: 34 }}
              />
            );
          })}
        </Stack>

        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
          <Typography variant="body2" color="text.secondary" aria-live="polite">
            <strong>{resultCount}</strong> {resultCount === 1 ? 'bid' : 'bids'} shown
          </Typography>
          {hasActiveFilters ? (
            <Button size="small" color="error" onClick={onClearFilters} startIcon={<Iconify icon="solar:restart-bold" width={16} />}>
              Clear filters
            </Button>
          ) : null}
        </Stack>
      </Stack>
    </Card>
  );
}
