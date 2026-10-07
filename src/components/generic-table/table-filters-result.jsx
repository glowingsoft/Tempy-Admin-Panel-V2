import { memo } from 'react';
import PropTypes from 'prop-types';
import Chip from '@mui/material/Chip';
import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';
import { formatDate } from 'src/utils/date-formatter';
import { FILTER_FIELD_TYPES } from './table-filter-fields';

/**
 * Format filter value for display in chips
 */
const formatFilterValue = (field, value) => {
    // Use custom formatter if provided
    if (field.formatter) {
        return field.formatter(value);
    }

    switch (field.type) {
        case FILTER_FIELD_TYPES.DATE:
            // Single date - use displayFormat
            return value ? formatDate(value, field.displayFormat) : '';

        case FILTER_FIELD_TYPES.DATE_RANGE:
            // Date range - format both dates
            if (!value?.startDate && !value?.endDate) return '';

            const startFormatted = value.startDate
                ? formatDate(value.startDate, field.displayFormat)
                : 'Start';
            const endFormatted = value.endDate
                ? formatDate(value.endDate, field.displayFormat)
                : 'End';

            return `${startFormatted} - ${endFormatted}`;

        case FILTER_FIELD_TYPES.MULTI_SELECT:
            return Array.isArray(value) ? value.join(', ') : '';

        case FILTER_FIELD_TYPES.SELECT:
        case FILTER_FIELD_TYPES.STATUS:
            const option = field.options?.find((opt) => opt.value === value);
            return option?.label || value;

        default:
            return String(value);
    }
};

/**
 * Flexible Table Filters Result Component
 */
export const FlexibleTableFiltersResult = memo(({
    activeFilters = [],
    totalResults,
    onResetFilters,
    onRemoveFilter,
    sx,
}) => {
    if (activeFilters.length === 0) return null;

    return (
        <FiltersResult totalResults={totalResults} onReset={onResetFilters} sx={sx}>
            {activeFilters.map((field) => (
                <FiltersBlock key={field.key} label={`${field.label}:`} isShow>
                    <Chip
                        {...chipProps}
                        label={formatFilterValue(field, field.value)}
                        onDelete={() => onRemoveFilter(field.key)}
                        sx={{ textTransform: 'capitalize' }}
                    />
                </FiltersBlock>
            ))}
        </FiltersResult>
    );
});

FlexibleTableFiltersResult.propTypes = {
    activeFilters: PropTypes.arrayOf(PropTypes.object),
    totalResults: PropTypes.number.isRequired,
    onResetFilters: PropTypes.func.isRequired,
    onRemoveFilter: PropTypes.func.isRequired,
    sx: PropTypes.object,
};

FlexibleTableFiltersResult.displayName = 'FlexibleTableFiltersResult';