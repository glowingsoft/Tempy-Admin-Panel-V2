import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { fDateRangeShortLabel } from 'src/utils/format-time';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';
import { Box, Button, Paper, Stack } from '@mui/material';
import { Iconify } from 'src/components/iconify';


// ----------------------------------------------------------------------

export function DevicesTableFiltersResult({ filters, totalResults, onResetPage, onResetFilters, results, sx, ...other }) {
  const handleRemoveKeyword = useCallback(() => {
    onResetPage();
    filters.setState({ name: '' });
  }, [filters, onResetPage]);

  const handleRemoveService = useCallback(
    (inputValue) => {
      const newValue = filters?.state?.service.filter((item) => item !== inputValue);

      onResetPage();
      filters.setState({ service: newValue });
    },
    [filters, onResetPage]
  );

  const handleRemoveStatus = useCallback(() => {
    onResetPage();
    filters.setState({ status: 'all' });
  }, [filters, onResetPage]);

  const handleRemoveDate = useCallback(() => {
    onResetPage();
    filters.setState({ startDate: null, endDate: null });
  }, [filters, onResetPage]);

  return (

    <Stack spacing={1.5} sx={{ px: 3, pb: 1 }} {...other}>
      <Box sx={{ typography: 'body2' }}>
        <strong>{results}</strong>
        <Box component="span" sx={{ color: 'text.secondary', ml: 0.25 }}>
          results found
        </Box>
      </Box>

      <Stack flexGrow={1} spacing={1} direction="row" flexWrap="wrap" alignItems="center">
        {filters.status !== 'all' && (
          <Block label="Status:">
            <Chip size="small" label={filters.status} onDelete={handleRemoveStatus} />
          </Block>
        )}

        {!!filters.role.length && (
          <Block label="Role:">
            {filters.role.map((item) => (
              <Chip key={item} label={item} size="small" onDelete={() => handleRemoveRole(item)} />
            ))}
          </Block>
        )}

        <Button
          color="error"
          onClick={onResetFilters}
          startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
        >
          Clear
        </Button>
      </Stack>
    </Stack>

    // <FiltersResult totalResults={totalResults} onReset={filters.onResetState} sx={sx}>
    //   <FiltersBlock label="Service:" isShow={!!filters?.state?.service.length}>
    //     {filters?.state?.service.map((item) => (
    //       <Chip {...chipProps} key={item} label={item} onDelete={() => handleRemoveService(item)} />
    //     ))}
    //   </FiltersBlock>

    //   <FiltersBlock label="Status:" isShow={filters?.state?.status !== 'all'}>
    //     <Chip
    //       {...chipProps}
    //       label={filters?.state?.status}
    //       onDelete={handleRemoveStatus}
    //       sx={{ textTransform: 'capitalize' }}
    //     />
    //   </FiltersBlock>

    //   <FiltersBlock
    //     label="Date:"
    //     isShow={Boolean(filters?.state?.startDate && filters?.state?.endDate)}
    //   >
    //     <Chip
    //       {...chipProps}
    //       label={fDateRangeShortLabel(filters?.state?.startDate, filters?.state?.endDate)}
    //       onDelete={handleRemoveDate}
    //     />
    //   </FiltersBlock>

    //   <FiltersBlock label="Keyword:" isShow={!!filters?.state?.name}>
    //     <Chip {...chipProps} label={filters?.state?.name} onDelete={handleRemoveKeyword} />
    //   </FiltersBlock>
    // </FiltersResult>
  );
}


function Block({ label, children, sx, ...other }) {
  return (
    <Stack
      component={Paper}
      variant="outlined"
      spacing={1}
      direction="row"
      sx={{
        p: 1,
        borderRadius: 1,
        overflow: 'hidden',
        borderStyle: 'dashed',
        ...sx,
      }}
      {...other}
    >
      <Box component="span" sx={{ typography: 'subtitle2' }}>
        {label}
      </Box>

      <Stack spacing={1} direction="row" flexWrap="wrap">
        {children}
      </Stack>
    </Stack>
  );
}