import { memo } from 'react';
import PropTypes from 'prop-types';
import StatusTabsFilter from 'src/components/filters/status-tabs-filter';

/**
 * Wrapper for Status Tabs Filter - conditionally rendered
 */
export const StatusTabsFilterWrapper = memo(({
    filterField,
    value,
    onChange,
    getCount,
}) => {
    if (!filterField || filterField.type !== 'status') return null;

    return (
        <StatusTabsFilter
            value={value}
            options={filterField.options}
            onChange={(event, newValue) => onChange(filterField.key, newValue)}
            getCount={getCount}
        />
    );
});

StatusTabsFilterWrapper.propTypes = {
    filterField: PropTypes.object,
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    getCount: PropTypes.func,
};

StatusTabsFilterWrapper.displayName = 'StatusTabsFilterWrapper';