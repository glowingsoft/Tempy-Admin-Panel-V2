import { useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';

import { AGENCY_BID_TABS } from 'src/_mock/_agency-bids';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function AgencyBidTableToolbar({
  filters,
  statusTabs = AGENCY_BID_TABS,
  statusCounts = {},
}) {
  const handleFilterName = useCallback(
    (event) => {
      filters.setState({ name: event.target.value });
    },
    [filters]
  );

  const handleStatusChange = useCallback(
    (event) => {
      filters.setState({ status: event.target.value });
    },
    [filters]
  );

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ xs: 'stretch', sm: 'center' }}
      justifyContent="space-between"
      spacing={2}
      sx={{ p: 2.5, borderBottom: (theme) => `1px solid ${theme.vars.palette.divider}` }}
    >
      <FormControl size="small" sx={{ minWidth: { xs: 1, sm: 280 } }}>
        <InputLabel>Status</InputLabel>
        <Select
          value={filters.state.status}
          label="Status"
          onChange={handleStatusChange}
          renderValue={(selected) =>
            statusTabs.find((tab) => tab.value === selected)?.label || 'All'
          }
        >
          {statusTabs.map((tab) => (
            <MenuItem key={tab.value} value={tab.value}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: 1 }}>
                <Typography variant="body2">{tab.label}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                  {statusCounts[tab.value] || 0}
                </Typography>
              </Stack>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        size="small"
        value={filters.state.name}
        onChange={handleFilterName}
        placeholder="Search jobs, care homes..."
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
            </InputAdornment>
          ),
        }}
        sx={{ width: { xs: 1, sm: 280 }, flexShrink: 0 }}
      />
    </Stack>
  );
}
