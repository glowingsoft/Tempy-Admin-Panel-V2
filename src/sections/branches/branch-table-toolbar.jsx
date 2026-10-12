import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import { countForStatusTab } from 'src/utils/status-counts';

import { BRANCH_STATUS_TABS } from './branches-constants';

import { Iconify } from 'src/components/iconify';
import {
  getStatusTabButtonSx,
  getStatusTabChipSx,
  STATUS_TAB_BUTTON_BASE_SX,
  STATUS_TABS_CONTAINER_SX,
} from 'src/components/table';


export function BranchTableToolbar({
  filters,
  onResetPage,
  branchList = [],
  statusTabs = BRANCH_STATUS_TABS,
  statusCounts,
  searchPlaceholder = 'Search locations...',
  hideStatusTabs = false,
}) {
  const handleFilterName = useCallback(
    (event) => {
      onResetPage?.();
      filters.setState({ name: event.target.value });
    },
    [filters, onResetPage]
  );

  const handleStatusChange = useCallback(
    (status) => {
      onResetPage?.();
      filters.setState({ status });
    },
    [filters, onResetPage]
  );

  const getStatusCount = (status) => {
    if (statusCounts && statusCounts[status] != null) {
      return statusCounts[status];
    }
    return countForStatusTab(branchList, status);
  };

  return (
    <Stack
      direction={{ xs: 'column', lg: 'row' }}
      alignItems={{ xs: 'stretch', lg: 'center' }}
      justifyContent="space-between"
      spacing={2}
      sx={{ p: 2.5, borderBottom: (theme) => `1px solid ${theme.vars.palette.divider}` }}
    >
      {!hideStatusTabs && (
        <Box sx={STATUS_TABS_CONTAINER_SX}>
          {statusTabs.map((tab, index) => {
            const isActive = filters.state.status === tab.value;
            const tabColor = tab.color || 'default';
            const count = getStatusCount(tab.value);

            return (
              <Button
                key={tab.value}
                onClick={() => handleStatusChange(tab.value)}
                sx={{
                  ...STATUS_TAB_BUTTON_BASE_SX,
                  fontWeight: isActive ? 700 : 500,
                  borderRight: (theme) =>
                    index < statusTabs.length - 1
                      ? `1px solid ${theme.vars.palette.divider}`
                      : 'none',
                  ...getStatusTabButtonSx(tabColor, isActive),
                }}
              >
                {tab.label}
                <Chip
                  label={count}
                  size="small"
                  sx={{
                    ml: 0.75,
                    height: 20,
                    minWidth: 20,
                    fontSize: 11,
                    fontWeight: 700,
                    ...getStatusTabChipSx(tabColor, isActive),
                  }}
                />
              </Button>
            );
          })}
        </Box>
      )}

      <TextField
        size="small"
        value={filters.state.name}
        onChange={handleFilterName}
        placeholder={searchPlaceholder}
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
