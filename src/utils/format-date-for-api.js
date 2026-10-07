/**
 * Format date for API
 * Handles Dayjs, Moment, and native Date objects
 * @param {Date|Object} date - Date to format
 * @returns {string|undefined} Formatted date string (YYYY-MM-DD) or undefined
 */
export const formatDateForAPI = (date) => {
    if (!date) return undefined;

    try {
        let dateObj = date;

        // Handle Dayjs object
        if (date.$d) {
            dateObj = new Date(date.$d);
        }
        // Handle Moment object
        else if (typeof date.toDate === 'function') {
            dateObj = date.toDate();
        }
        // Handle string or timestamp
        else if (!(date instanceof Date)) {
            dateObj = new Date(date);
        }

        // Validate date
        if (isNaN(dateObj.getTime())) {
            console.error('Invalid date:', date);
            return undefined;
        }

        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    } catch (error) {
        console.error('Error formatting date:', error);
        return undefined;
    }
};

/**
 * Format date object to display string
 * @param {Date|Object} date - Date to format
 * @param {string} format - Format pattern (optional)
 * @returns {string} Formatted date string
 */
export const formatDateForDisplay = (date) => {
    if (!date) return '';

    try {
        let dateObj = date;

        if (date.$d) {
            dateObj = new Date(date.$d);
        } else if (typeof date.toDate === 'function') {
            dateObj = date.toDate();
        } else if (!(date instanceof Date)) {
            dateObj = new Date(date);
        }

        if (isNaN(dateObj.getTime())) {
            return '';
        }

        return dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch (error) {
        console.error('Error formatting date for display:', error);
        return '';
    }
};