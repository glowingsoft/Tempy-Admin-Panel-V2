import PropTypes from 'prop-types';

import Chip from '@mui/material/Chip';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';
import { fDate } from 'src/utils/format-time';

// ----------------------------------------------------------------------

export function UserTableFiltersResult({
  filters,
  totalResults,
  onResetPage,
  onRemoveKeyword,
  onRemoveStatus,
  onRemoveDate,
  onResetFilters,
  sx,
}) {
  return (
    <FiltersResult totalResults={totalResults} onReset={onResetFilters} sx={sx}>
      <FiltersBlock label="Status:" isShow={filters.state.status !== 'all'}>
        <Chip
          {...chipProps}
          label={filters.state.status}
          onDelete={onRemoveStatus}
          sx={{ textTransform: 'capitalize' }}
        />
      </FiltersBlock>

      <FiltersBlock label="Keyword:" isShow={!!filters.state.name}>
        <Chip {...chipProps} label={filters.state.name} onDelete={onRemoveKeyword} />
      </FiltersBlock>

      <FiltersBlock label="Date:" isShow={filters.state.date !== null}>
        <Chip
          {...chipProps}
          label={fDate(filters.state.date)}
          onDelete={onRemoveDate}
        />
      </FiltersBlock>
    </FiltersResult>
  );
}

UserTableFiltersResult.propTypes = {
  filters: PropTypes.object.isRequired,
  totalResults: PropTypes.number.isRequired,
  onResetPage: PropTypes.func.isRequired,
  onRemoveKeyword: PropTypes.func.isRequired,
  onRemoveStatus: PropTypes.func.isRequired,
  onRemoveDate: PropTypes.func.isRequired,
  onResetFilters: PropTypes.func.isRequired,
  sx: PropTypes.object,
};