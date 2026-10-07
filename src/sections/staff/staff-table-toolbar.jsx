import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import { STAFF_STATUS_TABS } from 'src/_mock/_staff';
import { countForStatusTab } from 'src/utils/status-counts';

import { Iconify } from 'src/components/iconify';
import {
  getStatusTabButtonSx,
  getStatusTabChipSx,
  STATUS_TAB_BUTTON_BASE_SX,
  STATUS_TABS_CONTAINER_SX,
} from 'src/components/table';

// ----------------------------------------------------------------------

export function StaffTableToolbar({
  filters,
  onResetPage,
  onOpenAdd,
  onOpenImport,
  addButtonColor = 'primary',
  staffList = [],
  statusCounts,
  showAddButton = true,
  showImportButton = false,
  statusTabs = STAFF_STATUS_TABS,
}) {
  const handleFilterName = useCallback(
    (event) => {
      onResetPage();
      filters.setState({ name: event.target.value });
    },
    [filters, onResetPage]
  );

  const handleStatusChange = useCallback(
    (status) => {
      onResetPage();
      filters.setState({ status });
    },
    [filters, onResetPage]
  );

  const getStatusCount = (status) => {
    if (statusCounts && statusCounts[status] != null) {
      return statusCounts[status];
    }
    return countForStatusTab(staffList, status, { fallback: 'pending' });
  };

  return (
    <Stack
      direction={{ xs: 'column', lg: 'row' }}
      alignItems={{ xs: 'stretch', lg: 'center' }}
      justifyContent="space-between"
      spacing={2}
      sx={{ p: 2.5, borderBottom: (theme) => `1px solid ${theme.vars.palette.divider}` }}
    >
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

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={1.5}
        sx={{ width: { xs: 1, lg: 'auto' }, flexShrink: 0 }}
      >
        <TextField
          size="small"
          value={filters.state.name}
          onChange={handleFilterName}
          placeholder="Search staff..."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
          sx={{ width: { xs: 1, sm: 280 } }}
        />

        <Button
          variant="outlined"
          color="inherit"
          startIcon={<Iconify icon="solar:upload-bold" />}
          onClick={onOpenImport}
          sx={{
            flexShrink: 0,
            whiteSpace: 'nowrap',
            display: showImportButton && onOpenImport ? 'inline-flex' : 'none',
          }}
        >
          Import staff
        </Button>

        <Button
          variant="contained"
          color={addButtonColor}
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={onOpenAdd}
          sx={{ flexShrink: 0, whiteSpace: 'nowrap', display: showAddButton && onOpenAdd ? 'inline-flex' : 'none' }}
        >
          Add Staff
        </Button>
      </Stack>
    </Stack>
  );
}
