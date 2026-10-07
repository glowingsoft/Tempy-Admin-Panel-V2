import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import ListItemText from '@mui/material/ListItemText';

import { JOB_BIDS_FILTER_OPTIONS, JOB_RATE_SORT_OPTIONS } from './care-home-job-api-utils';

// ----------------------------------------------------------------------

/** Server-side filters for GET {prefix}/job (see applyJobListFilters). */
export const EMPTY_JOB_LIST_FILTERS = {
  startDate: '',
  endDate: '',
  jobRoles: [],
  bids: '',
  sort: '',
};

export function hasJobListFilters(filters = {}) {
  return Boolean(filters.startDate || filters.endDate || filters.jobRoles?.length || filters.bids || filters.sort);
}

const FIELD_SX = { minWidth: { xs: 1, sm: 170 }, flex: { xs: '1 1 100%', sm: '0 0 auto' } };

/**
 * Date range, job types, filled / unfilled and rate sort for a job list.
 * `jobTypeOptions`: [{ id, label }] — ids the API accepts as `jobRoles`.
 * `showBidsFilter`: false when the screen already filters filled / unfilled (e.g. tabs).
 */
export function JobListFilterBar({ value = EMPTY_JOB_LIST_FILTERS, onChange, jobTypeOptions = [], showBidsFilter = true, sx }) {
  const update = (patch) => onChange?.({ ...value, ...patch });
  const labelById = new Map(jobTypeOptions.map((option) => [option.id, option.label]));

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center', ...sx }}>
      <TextField
        size="small"
        type="date"
        label="From"
        value={value.startDate}
        // A start after the end would be rejected by the API, so drop the end date.
        onChange={(e) => {
          const startDate = e.target.value;
          update(value.endDate && startDate && startDate > value.endDate ? { startDate, endDate: '' } : { startDate });
        }}
        InputLabelProps={{ shrink: true }}
        sx={FIELD_SX}
      />
      <TextField
        size="small"
        type="date"
        label="To"
        value={value.endDate}
        onChange={(e) => update({ endDate: e.target.value })}
        InputLabelProps={{ shrink: true }}
        inputProps={{ min: value.startDate || undefined }}
        sx={FIELD_SX}
      />

      <FormControl size="small" sx={{ ...FIELD_SX, minWidth: { xs: 1, sm: 220 }, maxWidth: { sm: 320 } }}>
        <InputLabel id="job-list-types-label">Job Types</InputLabel>
        <Select
          labelId="job-list-types-label"
          multiple
          label="Job Types"
          value={value.jobRoles}
          onChange={(e) => {
            const next = e.target.value;
            update({ jobRoles: typeof next === 'string' ? next.split(',') : next });
          }}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', gap: 0.5, overflow: 'hidden' }}>
              {selected.map((id) => (
                <Chip key={id} size="small" label={labelById.get(id) || 'Job type'} />
              ))}
            </Box>
          )}
          MenuProps={{ PaperProps: { sx: { maxHeight: 320 } } }}
        >
          {jobTypeOptions.length ? (
            jobTypeOptions.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                <Checkbox size="small" checked={value.jobRoles.includes(option.id)} />
                <ListItemText primary={option.label} />
              </MenuItem>
            ))
          ) : (
            <MenuItem disabled>No active job types</MenuItem>
          )}
        </Select>
      </FormControl>

      {showBidsFilter && (
        <FormControl size="small" sx={FIELD_SX}>
          <InputLabel id="job-list-bids-label" shrink>
            Bids
          </InputLabel>
          <Select labelId="job-list-bids-label" label="Bids" notched displayEmpty value={value.bids} onChange={(e) => update({ bids: e.target.value })}>
            {JOB_BIDS_FILTER_OPTIONS.map((option) => (
              <MenuItem key={option.value || 'all'} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      <FormControl size="small" sx={FIELD_SX}>
        <InputLabel id="job-list-sort-label" shrink>
          Sort
        </InputLabel>
        <Select labelId="job-list-sort-label" label="Sort" notched displayEmpty value={value.sort} onChange={(e) => update({ sort: e.target.value })}>
          {JOB_RATE_SORT_OPTIONS.map((option) => (
            <MenuItem key={option.value || 'newest'} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
