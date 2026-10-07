import { format, parse, isValid } from 'date-fns';

/**
 * Date format presets for common use cases
 * Use these presets in your filter field configurations
 */
export const DATE_FORMAT_PRESETS = {
    ISO: 'yyyy-MM-dd', // 2025-11-26 (API standard)
    ISO_DATETIME: "yyyy-MM-dd'T'HH:mm:ss'Z'", // 2025-11-26T19:00:00Z
    US: 'MM/dd/yyyy', // 11/26/2025
    UK: 'dd/MM/yyyy', // 26/11/2025
    DISPLAY: 'dd MMM yyyy', // 26 Nov 2025
    DISPLAY_LONG: 'dd MMMM yyyy', // 26 November 2025
    DASH: 'dd-MM-yyyy', // 26-11-2025
    DASH_REVERSE: 'yyyy-MM-dd', // 2025-11-26
    SLASH: 'dd/MM/yyyy', // 26/11/2025
    YEAR_FIRST: 'yyyy/MM/dd', // 2025/11/26
    TIMESTAMP: 'yyyy-MM-dd HH:mm:ss', // 2025-11-26 19:00:00
};

/**
 * Date range output formats
 * Controls how date ranges are sent to the API
 */
export const DATE_RANGE_OUTPUT_FORMATS = {
    ARRAY: 'array', // ["2025-01-01", "2025-01-31"]
    OBJECT: 'object', // { startDate: "2025-01-01", endDate: "2025-01-31" }
    FLAT: 'flat', // Spreads into separate keys: startDate: "2025-01-01", endDate: "2025-01-31"
};

/**
 * Format a date object to a specific format string
 * @param {Date|string|null} date - Date to format
 * @param {string} formatString - Format string (use DATE_FORMAT_PRESETS or custom)
 * @returns {string|null} - Formatted date string or null
 */
export function formatDate(date, formatString = DATE_FORMAT_PRESETS.ISO) {
    if (!date) return null;

    try {
        // Handle Day.js objects (from MUI DatePicker)
        if (date && typeof date === 'object' && typeof date.toDate === 'function') {
            date = date.toDate();
        }
        // Handle string dates
        else if (typeof date === 'string') {
            date = new Date(date);
        }

        // Validate date
        if (!isValid(date)) {
            console.warn('Invalid date provided to formatDate:', date);
            return null;
        }

        return format(date, formatString);
    } catch (error) {
        console.error('Error formatting date:', error);
        return null;
    }
}

/**
 * Format date range object for API
 * @param {Object} dateRange - { startDate, endDate }
 * @param {string} formatString - Format for dates
 * @param {Object} options - Configuration options
 * @param {string} options.startKey - Key name for start date (default: 'startDate')
 * @param {string} options.endKey - Key name for end date (default: 'endDate')
 * @param {boolean} options.includeTime - Include time in format
 * @param {string} options.outputFormat - Output format: 'array', 'object', or 'flat'
 * @returns {Array|Object|null} - Formatted date range based on outputFormat
 */
export function formatDateRangeForAPI(
    dateRange,
    formatString = DATE_FORMAT_PRESETS.ISO,
    options = {}
) {
    const {
        startKey = 'startDate',
        endKey = 'endDate',
        includeTime = false,
        outputFormat = DATE_RANGE_OUTPUT_FORMATS.ARRAY,
    } = options;

    if (!dateRange) return null;

    const actualFormat = includeTime ? DATE_FORMAT_PRESETS.ISO_DATETIME : formatString;

    const startFormatted = dateRange.startDate
        ? formatDate(dateRange.startDate, actualFormat)
        : null;
    const endFormatted = dateRange.endDate
        ? formatDate(dateRange.endDate, actualFormat)
        : null;

    // Return null if no valid dates
    if (!startFormatted && !endFormatted) return null;

    switch (outputFormat) {
        case DATE_RANGE_OUTPUT_FORMATS.ARRAY:
            // Output: ["2025-01-01", "2025-01-31"]
            // Only include if both dates exist for a valid range
            if (startFormatted && endFormatted) {
                return [startFormatted, endFormatted];
            }
            // If only one date, return array with available date
            return startFormatted ? [startFormatted] : [endFormatted];

        case DATE_RANGE_OUTPUT_FORMATS.OBJECT:
            // Output: { startDate: "2025-01-01", endDate: "2025-01-31" }
            const objectResult = {};
            if (startFormatted) objectResult[startKey] = startFormatted;
            if (endFormatted) objectResult[endKey] = endFormatted;
            return objectResult;

        case DATE_RANGE_OUTPUT_FORMATS.FLAT:
            // Output for spreading: { startDate: "2025-01-01", endDate: "2025-01-31" }
            // This is same structure but meant to be spread into parent object
            const flatResult = {};
            if (startFormatted) flatResult[startKey] = startFormatted;
            if (endFormatted) flatResult[endKey] = endFormatted;
            return flatResult;

        default:
            return [startFormatted, endFormatted].filter(Boolean);
    }
}

/**
 * Check if a value is a Date object or Day.js object
 * @param {any} value - Value to check
 * @returns {boolean} - True if value is a date-like object
 */
export function isDateObject(value) {
    if (!value) return false;

    // Check for native Date object
    if (value instanceof Date) return true;

    // Check for Day.js object (has toDate method and $d property)
    if (typeof value === 'object' && typeof value.toDate === 'function') return true;

    return false;
}

/**
 * Check if a value is a date range object
 * @param {any} value - Value to check
 * @returns {boolean} - True if value is a date range object
 */
export function isDateRangeObject(value) {
    if (!value || typeof value !== 'object') return false;

    // Check if it has startDate or endDate properties (can be null)
    return 'startDate' in value || 'endDate' in value;
}

/**
 * Parse a date string to Date object
 * @param {string} dateString - Date string to parse
 * @param {string} formatString - Expected format of the input string
 * @returns {Date|null} - Parsed Date object or null
 */
export function parseDate(dateString, formatString = DATE_FORMAT_PRESETS.ISO) {
    if (!dateString) return null;

    try {
        const parsedDate = parse(dateString, formatString, new Date());
        return isValid(parsedDate) ? parsedDate : null;
    } catch (error) {
        console.error('Error parsing date:', error);
        return null;
    }
}