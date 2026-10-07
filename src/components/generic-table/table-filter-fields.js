import { DATE_FORMAT_PRESETS, DATE_RANGE_OUTPUT_FORMATS } from 'src/utils/date-formatter';

/**
 * Filter field type constants
 */
export const FILTER_FIELD_TYPES = {
    SEARCH: 'search',
    STATUS: 'status',
    DATE: 'date',
    DATE_RANGE: 'dateRange',
    SELECT: 'select',
    MULTI_SELECT: 'multiSelect',
    CUSTOM: 'custom',
};

/**
 * Filter field configuration factory
 * Provides convenient methods to create filter field configurations
 */
export const createFilterField = {
    /**
     * Search field
     */
    search: (config = {}) => ({
        type: FILTER_FIELD_TYPES.SEARCH,
        key: 'search',
        label: 'Search',
        placeholder: 'Search...',
        defaultValue: '',
        ...config,
    }),

    /**
     * Status filter with tabs
     */
    status: (config = {}) => ({
        type: FILTER_FIELD_TYPES.STATUS,
        key: 'status',
        label: 'Status',
        defaultValue: 'all',
        options: [{ value: 'all', label: 'All' }],
        showCounts: true,
        ...config,
    }),

    /**
     * Single date picker
     * @param {Object} config - Configuration
     * @param {string} config.key - Filter key (default: 'date')
     * @param {string} config.label - Display label
     * @param {string} config.displayFormat - Format for display in chips (default: 'dd/MM/yyyy')
     * @param {string} config.pickerFormat - Format for DatePicker display (default: 'DD/MM/YYYY')
     * @param {string} config.apiFormat - Format for API requests (default: 'yyyy-MM-dd')
     * @param {Function} config.transformForAPI - Custom transformation function for full control
     * 
     * @example
     * // ISO format (default): "2025-12-04"
     * createFilterField.date({ key: 'createdAt' })
     * 
     * // DD-MM-YYYY format: "04-12-2025"
     * createFilterField.date({ 
     *   key: 'createdAt', 
     *   apiFormat: DATE_FORMAT_PRESETS.DASH 
     * })
     * 
     * // Custom format: "12/04/2025"
     * createFilterField.date({ 
     *   key: 'createdAt', 
     *   apiFormat: 'MM/dd/yyyy' 
     * })
     */
    date: (config = {}) => ({
        type: FILTER_FIELD_TYPES.DATE,
        key: 'date',
        label: 'Date',
        placeholder: 'Select date',
        defaultValue: null,
        displayFormat: DATE_FORMAT_PRESETS.UK, // How it's shown in chips (dd/MM/yyyy)
        pickerFormat: 'DD/MM/YYYY', // How it's shown in DatePicker (Day.js format)
        apiFormat: DATE_FORMAT_PRESETS.ISO, // How it's sent to API
        ...config,
    }),

    /**
     * Date range picker (start and end dates)
     * @param {Object} config - Configuration
     * @param {string} config.key - Filter key (default: 'dateRange')
     * @param {string} config.displayFormat - Format for display in chips (default: 'dd/MM/yyyy')
     * @param {string} config.pickerFormat - Format for DatePicker display (default: 'DD/MM/YYYY')
     * @param {string} config.apiFormat - Format for dates sent to API
     * @param {string} config.startKey - Key for start date when outputFormat is 'object' or 'flat'
     * @param {string} config.endKey - Key for end date when outputFormat is 'object' or 'flat'
     * @param {boolean} config.includeTime - Include time in API format
     * @param {string} config.outputFormat - How to structure the output:
     *   - 'array': ["2025-01-01", "2025-01-31"]
     *   - 'object': { dateRange: { startDate: "2025-01-01", endDate: "2025-01-31" } }
     *   - 'flat': { startDate: "2025-01-01", endDate: "2025-01-31" } (spreads into query params) - RECOMMENDED
     * @param {Function} config.transformForAPI - Custom transformation function for full control
     * 
     * @example
     * // Flat format (recommended): { startDate: "2025-01-01", endDate: "2025-01-31" }
     * createFilterField.dateRange({ 
     *   key: 'dateRange',
     *   outputFormat: 'flat' 
     * })
     * 
     * // Array format: { dateRange: ["2025-01-01", "2025-01-31"] }
     * createFilterField.dateRange({ 
     *   key: 'dateRange',
     *   outputFormat: 'array' 
     * })
     * 
     * // Custom format with DD-MM-YYYY
     * createFilterField.dateRange({ 
     *   key: 'dateRange', 
     *   apiFormat: DATE_FORMAT_PRESETS.DASH 
     * })
     */
    dateRange: (config = {}) => ({
        type: FILTER_FIELD_TYPES.DATE_RANGE,
        key: 'dateRange',
        label: 'Date Range',
        startKey: 'startDate',
        endKey: 'endDate',
        startLabel: 'Start Date',
        endLabel: 'End Date',
        defaultValue: { startDate: null, endDate: null },
        displayFormat: DATE_FORMAT_PRESETS.UK, // How it's shown in chips (dd/MM/yyyy)
        pickerFormat: 'DD/MM/YYYY', // How it's shown in DatePicker (Day.js format)
        apiFormat: DATE_FORMAT_PRESETS.ISO, // How it's sent to API
        outputFormat: DATE_RANGE_OUTPUT_FORMATS.FLAT, // Sends startDate and endDate as separate params
        includeTime: false, // Include time in API format
        ...config,
    }),

    /**
     * Dropdown select
     */
    select: (config = {}) => ({
        type: FILTER_FIELD_TYPES.SELECT,
        key: config.key || 'select',
        label: config.label || 'Select',
        placeholder: config.placeholder || 'Choose option',
        defaultValue: 'all',
        options: [],
        ...config,
    }),

    /**
     * Multi-select dropdown
     */
    multiSelect: (config = {}) => ({
        type: FILTER_FIELD_TYPES.MULTI_SELECT,
        key: config.key || 'multiSelect',
        label: config.label || 'Multi Select',
        placeholder: config.placeholder || 'Choose options',
        defaultValue: [],
        options: [],
        ...config,
    }),

    /**
     * Custom filter component
     * @param {Object} config - Configuration
     * @param {string} config.key - Filter key (required)
     * @param {string} config.label - Display label
     * @param {any} config.defaultValue - Default value
     * @param {React.Component} config.component - Custom React component
     * @param {Function} config.formatter - Custom formatter for chip display
     * @param {Function} config.transformForAPI - Custom transformation for API
     * 
     * @example
     * createFilterField.custom({
     *   key: 'customFilter',
     *   label: 'Custom Filter',
     *   defaultValue: null,
     *   component: MyCustomComponent,
     *   transformForAPI: (value, key) => ({ [key]: value.id }),
     * })
     */
    custom: (config = {}) => ({
        type: FILTER_FIELD_TYPES.CUSTOM,
        key: config.key,
        label: config.label,
        defaultValue: config.defaultValue,
        component: config.component,
        formatter: config.formatter,
        transformForAPI: config.transformForAPI,
        ...config,
    }),
};

// Re-export for convenience
export { DATE_FORMAT_PRESETS, DATE_RANGE_OUTPUT_FORMATS };
