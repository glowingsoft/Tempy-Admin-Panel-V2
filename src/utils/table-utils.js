/**
 * Apply client-side sorting to table data
 * @param {Array} data - Array of data to sort
 * @param {string} orderBy - Column key to sort by
 * @param {string} order - Sort direction ('asc' or 'desc')
 * @returns {Array} Sorted array
 */
export const applySorting = (data, orderBy, order) => {
    if (!orderBy || !data?.length) return data;

    return [...data].sort((a, b) => {
        let aValue = a[orderBy];
        let bValue = b[orderBy];

        // Handle null/undefined values
        if (aValue == null) return order === 'asc' ? 1 : -1;
        if (bValue == null) return order === 'asc' ? -1 : 1;

        // Handle different data types
        if (orderBy === 'balance' || typeof aValue === 'number') {
            aValue = Number(aValue) || 0;
            bValue = Number(bValue) || 0;
        } else if (orderBy === 'createdAt' || orderBy === 'updatedAt') {
            aValue = new Date(aValue).getTime();
            bValue = new Date(bValue).getTime();
        } else if (typeof aValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) {
            return order === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
            return order === 'asc' ? 1 : -1;
        }
        return 0;
    });
};

/**
 * Calculate serial number for paginated table rows
 * @param {number} page - Current page (0-indexed)
 * @param {number} rowsPerPage - Number of rows per page
 * @param {number} index - Row index in current page
 * @returns {number} Serial number
 */
export const calculateSerialNumber = (page, rowsPerPage, index) => {
    return page * rowsPerPage + index + 1;
};

/**
 * Check if filters are active (for reset button visibility)
 * @param {Object} filters - Filter state object
 * @param {Object} defaultFilters - Default filter values
 * @returns {boolean} True if any filter differs from default
 */
export const hasActiveFilters = (filters, defaultFilters) => {
    return Object.keys(defaultFilters).some(
        (key) => filters[key] !== defaultFilters[key]
    );
};

/**
 * Get status color for Label component
 * @param {string} status - Status value
 * @returns {string} Color name
 */
export const getStatusColor = (status) => {
    const statusColorMap = {
        active: 'success',
        inactive: 'error',
        pending: 'warning',
        banned: 'error',
        rejected: 'error',
    };
    return statusColorMap[status] || 'default';
};