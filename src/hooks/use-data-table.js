import { useCallback, useMemo, useState } from 'react';
import { useSetState } from 'src/hooks/use-set-state';
import { useTable } from 'src/components/table';
import { useDebouncedInput } from 'src/hooks/use-debounced-input';
import { FILTER_FIELD_TYPES } from 'src/components/generic-table/table-filter-fields';
import {
    formatDate,
    formatDateRangeForAPI,
    isDateObject,
    isDateRangeObject,
    DATE_RANGE_OUTPUT_FORMATS,
} from 'src/utils/date-formatter';

/**
 * Enterprise-grade data table hook with plugin architecture
 * @param {Object} config - Configuration object
 * @param {Function} config.queryHook - RTK Query hook for fetching data
 * @param {Object} config.defaultFilters - Default filter state
 * @param {Array} config.filterFields - Array of filter field configurations
 * @param {number} config.defaultRowsPerPage - Default rows per page
 * @param {number} config.debounceMs - Debounce delay for search in milliseconds
 * @param {Function} config.transformFilters - Transform filters before API call
 * @param {boolean} config.enableSearch - Enable/disable search functionality
 * @param {boolean} config.enablePagination - Enable/disable pagination
 * @param {boolean} config.enableSorting - Enable/disable sorting
 * @param {Object} config.queryOptions - Additional RTK Query options
 * @returns {Object} - Table state, data, handlers, and computed values
 */
export function useDataTable({
    queryHook,
    defaultFilters = {},
    filterFields = [],
    defaultRowsPerPage = 10,
    debounceMs = 500,
    transformFilters = null,
    enableSearch = true,
    enablePagination = true,
    enableSorting = true,
    queryOptions = {},
}) {
    const table = useTable({ defaultRowsPerPage });

    // Filter state - for UI display and non-search filters
    const filters = useSetState(defaultFilters);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(defaultRowsPerPage);

    // Debounced search hook - handles search with debouncing
    const {
        displayValue: searchDisplayValue,
        debouncedValue: searchQuery,
        handleChange: handleSearchInputChange,
        reset: resetSearch,
    } = useDebouncedInput(
        defaultFilters.search || '',
        () => {
            // Reset to first page when search changes
            setCurrentPage(0);
        },
        debounceMs
    );

    /**
     * Transform filter value based on field type and configuration
     * Handles date formatting, date range formatting, etc.
     */
    const transformFilterValue = useCallback((key, value, fieldConfig) => {
        if (!fieldConfig) return { [key]: value };

        // Use custom transform if provided
        if (fieldConfig.transformForAPI) {
            return fieldConfig.transformForAPI(value, key, fieldConfig);
        }

        switch (fieldConfig.type) {
            case FILTER_FIELD_TYPES.DATE:
                // Single date: Format using apiFormat
                if (isDateObject(value)) {
                    const formatted = formatDate(value, fieldConfig.apiFormat);
                    return formatted ? { [key]: formatted } : {};
                }
                return { [key]: value };

            case FILTER_FIELD_TYPES.DATE_RANGE:
                // Date range: Format based on outputFormat configuration
                if (isDateRangeObject(value)) {
                    const hasStartDate = value.startDate && isDateObject(value.startDate);
                    const hasEndDate = value.endDate && isDateObject(value.endDate);

                    if (!hasStartDate && !hasEndDate) return {};

                    const outputFormat = fieldConfig.outputFormat || DATE_RANGE_OUTPUT_FORMATS.ARRAY;

                    const formatted = formatDateRangeForAPI(value, fieldConfig.apiFormat, {
                        startKey: fieldConfig.startKey,
                        endKey: fieldConfig.endKey,
                        includeTime: fieldConfig.includeTime,
                        outputFormat,
                    });

                    if (!formatted) return {};

                    // Handle different output formats - compare with both string and constant
                    if (outputFormat === 'flat' || outputFormat === DATE_RANGE_OUTPUT_FORMATS.FLAT) {
                        // Spread directly into parent object
                        return formatted;
                    }

                    // ARRAY or OBJECT format - use the key
                    return { [key]: formatted };
                }
                return {};

            default:
                return { [key]: value };
        }
    }, []);

    // Build query parameters dynamically
    const queryParams = useMemo(() => {
        const baseParams = {
            ...(enablePagination && {
                page: currentPage,
                limit: itemsPerPage,
            }),
            ...(enableSearch && searchQuery && { search: searchQuery }),
        };

        // Create a lookup map for filter field configurations
        const fieldConfigMap = filterFields.reduce((map, field) => {
            map[field.key] = field;
            return map;
        }, {});

        // Add all active filters (excluding search as it's handled separately)
        const filterParams = Object.entries(filters.state).reduce((acc, [key, value]) => {
            // Skip search field as it's handled by searchQuery state
            if (key === 'search') return acc;

            // Skip if value is default or empty
            const defaultValue = defaultFilters[key];
            if (value === defaultValue || value === undefined || value === null || value === '') {
                return acc;
            }

            // Handle 'all' status specially (common pattern in status filters)
            if (key === 'status' && value === 'all') {
                return acc;
            }

            // Get field configuration for transformation
            const fieldConfig = fieldConfigMap[key];

            // Transform the value based on field type
            const transformedValue = transformFilterValue(key, value, fieldConfig);

            return { ...acc, ...transformedValue };
        }, {});

        const combinedParams = { ...baseParams, ...filterParams };

        // Apply custom transformation if provided
        return transformFilters ? transformFilters(combinedParams) : combinedParams;
    }, [
        currentPage,
        searchQuery, // ✅ Only debounced value triggers API call
        itemsPerPage,
        filters.state,
        defaultFilters,
        filterFields,
        transformFilters,
        transformFilterValue,
        enablePagination,
        enableSearch,
    ]);

    // Fetch data using RTK Query
    const {
        data: responseData,
        isLoading,
        isFetching,
        error,
        refetch,
    } = queryHook(queryParams, {
        refetchOnMountOrArgChange: 30,
        ...queryOptions,
    });

    // Generic filter change handler for non-search filters
    const handleFilterChange = useCallback(
        (filterKey, value) => {
            filters.setState({ [filterKey]: value });
            setCurrentPage(0); // Reset to first page when filter changes
        },
        [filters]
    );

    // Search change handler - updates both UI and filters state
    const handleSearchChange = useCallback(
        (event) => {
            const value = event.target.value;

            // Update input field immediately for responsive UX
            handleSearchInputChange(event);

            // Also update filters state for consistency
            filters.setState({ search: value });
        },
        [handleSearchInputChange, filters]
    );

    // Pagination handlers
    const handlePageChange = useCallback((event, newPage) => {
        setCurrentPage(newPage);
    }, []);

    const handleRowsPerPageChange = useCallback((event) => {
        setItemsPerPage(parseInt(event.target.value, 10));
        setCurrentPage(0);
    }, []);

    const handleResetPage = useCallback(() => {
        setCurrentPage(0);
    }, []);

    // Remove individual filter
    const handleRemoveFilter = useCallback(
        (filterKey) => {
            const defaultValue = defaultFilters[filterKey];
            filters.setState({ [filterKey]: defaultValue });

            // If removing search, also reset the debounced input
            if (filterKey === 'search') {
                resetSearch();
            }

            setCurrentPage(0);
        },
        [filters, defaultFilters, resetSearch]
    );

    // Reset all filters to default
    const handleResetFilters = useCallback(() => {
        filters.setState(defaultFilters);
        resetSearch();
        setCurrentPage(0);
    }, [filters, defaultFilters, resetSearch]);

    // Computed values from API response
    const dataList = useMemo(
        () => responseData?.data || [],
        [responseData?.data]
    );

    const totalRecords = useMemo(
        () => responseData?.total_length || 0,
        [responseData?.total_length]
    );

    const meta = useMemo(
        () => responseData?.meta || {},
        [responseData?.meta]
    );

    // Check if any filter is active (different from default)
    const canReset = useMemo(() => {
        // Check search separately
        if (searchDisplayValue !== (defaultFilters.search || '')) {
            return true;
        }

        // Check other filters
        return Object.entries(filters.state).some(([key, value]) => {
            if (key === 'search') return false; // Already checked above

            const defaultValue = defaultFilters[key];
            return value !== defaultValue && value !== '' && value !== null && value !== undefined;
        });
    }, [filters.state, defaultFilters, searchDisplayValue]);

    // Check if no data found
    const notFound = useMemo(
        () => !isLoading && !isFetching && dataList.length === 0,
        [isLoading, isFetching, dataList.length]
    );

    // Get active filters for display (filter chips)
    const activeFilters = useMemo(() => {
        const activeFiltersList = [];

        // Add search filter if active
        const searchField = filterFields.find((f) => f.key === 'search');
        if (searchField && searchDisplayValue && searchDisplayValue !== (defaultFilters.search || '')) {
            activeFiltersList.push({
                ...searchField,
                value: searchDisplayValue,
                isActive: true,
            });
        }

        // Add other active filters
        filterFields.forEach((field) => {
            if (field.key === 'search') return; // Already handled above

            const value = filters.state[field.key];
            const defaultValue = defaultFilters[field.key];

            // Determine if filter is active
            const isActive =
                value !== defaultValue &&
                value !== '' &&
                value !== null &&
                value !== undefined &&
                !(field.key === 'status' && value === 'all');

            if (isActive) {
                activeFiltersList.push({
                    ...field,
                    value,
                    isActive: true,
                });
            }
        });

        return activeFiltersList;
    }, [filters.state, filterFields, defaultFilters, searchDisplayValue]);

    return {
        // Table state
        table,
        filters,
        currentPage,
        itemsPerPage,
        searchQuery, // Debounced search value (what's sent to API)
        searchDisplayValue, // Display search value (what's shown in input)

        // Data
        dataList,
        totalRecords,
        meta,
        isLoading,
        isFetching,
        error,
        refetch,

        // Computed
        canReset,
        notFound,
        activeFilters,

        // Handlers
        handleSearchChange,
        handleFilterChange,
        handlePageChange,
        handleRowsPerPageChange,
        handleResetPage,
        handleRemoveFilter,
        handleResetFilters,

        // Config
        enableSearch,
        enablePagination,
        enableSorting,
    };
}