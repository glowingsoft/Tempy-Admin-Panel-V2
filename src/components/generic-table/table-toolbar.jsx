import { memo } from 'react';
import PropTypes from 'prop-types';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Iconify } from 'src/components/iconify';
import { FILTER_FIELD_TYPES } from './table-filter-fields';

// Filter Field Component (same as before, but add search handler)
const FilterField = memo(({ field, value, onChange, onSearchChange }) => {
    switch (field.type) {
        case FILTER_FIELD_TYPES.SEARCH:
            return (
                <TextField
                    fullWidth
                    value={value}
                    onChange={onSearchChange || ((e) => onChange(field.key, e.target.value))}
                    placeholder={field.placeholder}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                            </InputAdornment>
                        ),
                    }}
                />
            );

        case FILTER_FIELD_TYPES.DATE:
            return (
                <DatePicker
                    label={field.label}
                    value={value}
                    onChange={(newValue) => onChange(field.key, newValue)}
                    format={field.pickerFormat || 'DD/MM/YYYY'}
                    slotProps={{
                        textField: {
                            fullWidth: true,
                            placeholder: field.placeholder,
                        },
                    }}
                />
            );

        case FILTER_FIELD_TYPES.DATE_RANGE:
            return (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: 1 }}>
                    <DatePicker
                        label={field.startLabel}
                        value={value?.startDate || null}
                        onChange={(newValue) =>
                            onChange(field.key, { ...value, startDate: newValue })
                        }
                        format={field.pickerFormat || 'DD/MM/YYYY'}
                        slotProps={{
                            textField: {
                                fullWidth: true,
                            },
                        }}
                    />
                    <DatePicker
                        label={field.endLabel}
                        value={value?.endDate || null}
                        onChange={(newValue) =>
                            onChange(field.key, { ...value, endDate: newValue })
                        }
                        format={field.pickerFormat || 'DD/MM/YYYY'}
                        slotProps={{
                            textField: {
                                fullWidth: true,
                            },
                        }}
                    />
                </Stack>
            );

        case FILTER_FIELD_TYPES.SELECT:
            return (
                <TextField
                    select
                    fullWidth
                    label={field.label}
                    value={value}
                    onChange={(e) => onChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                >
                    {field.options.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                            {option.label}
                        </MenuItem>
                    ))}
                </TextField>
            );

        case FILTER_FIELD_TYPES.CUSTOM:
            const CustomComponent = field.component;
            return (
                <CustomComponent
                    value={value}
                    onChange={(newValue) => onChange(field.key, newValue)}
                    {...field.componentProps}
                />
            );

        default:
            return null;
    }
});

FilterField.displayName = 'FilterField';

FilterField.propTypes = {
    field: PropTypes.object.isRequired,
    value: PropTypes.any,
    onChange: PropTypes.func.isRequired,
    onSearchChange: PropTypes.func,
};

/**
 * Flexible Table Toolbar with dynamic filter fields
 */
export const FlexibleTableToolbar = memo(({
    filterFields = [],
    filterValues = {},
    onFilterChange,
    onSearchChange, // ✅ New prop for custom search handler
    slots = {},
}) => {
    // Separate search from other filters
    const searchField = filterFields.find((f) => f.type === FILTER_FIELD_TYPES.SEARCH);
    const otherFields = filterFields.filter((f) => f.type !== FILTER_FIELD_TYPES.SEARCH);

    return (
        <Stack spacing={2} sx={{ p: 2.5 }}>
            {/* First Row: Search + Custom Slots */}
            {(searchField || slots.beforeFilters || slots.afterFilters) && (
                <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={2}
                    alignItems={{ xs: 'stretch', md: 'center' }}
                >
                    {slots.beforeFilters}

                    {searchField && (
                        <Box sx={{ flexGrow: 1 }}>
                            <FilterField
                                field={searchField}
                                value={filterValues[searchField.key]}
                                onChange={onFilterChange}
                                onSearchChange={onSearchChange} // ✅ Pass custom search handler
                            />
                        </Box>
                    )}

                    {slots.afterFilters}
                </Stack>
            )}

            {/* Second Row: Additional Filters */}
            {otherFields.length > 0 && (
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    alignItems={{ xs: 'stretch', sm: 'center' }}
                    flexWrap="wrap"
                >
                    {otherFields.map((field) => (
                        <Box
                            key={field.key}
                            sx={{
                                minWidth: field.minWidth || 200,
                                flexGrow: field.flexGrow || 0,
                                flexBasis: field.flexBasis || 'auto',
                            }}
                        >
                            <FilterField
                                field={field}
                                value={filterValues[field.key]}
                                onChange={onFilterChange}
                            />
                        </Box>
                    ))}
                </Stack>
            )}
        </Stack>
    );
});

FlexibleTableToolbar.propTypes = {
    filterFields: PropTypes.arrayOf(PropTypes.object),
    filterValues: PropTypes.object,
    onFilterChange: PropTypes.func.isRequired,
    onSearchChange: PropTypes.func,
    slots: PropTypes.shape({
        beforeFilters: PropTypes.node,
        afterFilters: PropTypes.node,
    }),
};

FlexibleTableToolbar.displayName = 'FlexibleTableToolbar';