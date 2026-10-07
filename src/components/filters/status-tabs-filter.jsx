import PropTypes from 'prop-types';
import { memo } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import { varAlpha } from 'src/theme/styles';

import { Label } from 'src/components/label';

// ----------------------------------------------------------------------

function StatusTabsFilter({ value, options, onChange, getCount, sx }) {
    return (
        <Tabs
            value={value}
            onChange={onChange}
            sx={{
                px: 2.5,
                boxShadow: (theme) =>
                    `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
                ...sx,
            }}
        >
            {options.map((tab) => (
                <Tab
                    key={tab.value}
                    iconPosition="end"
                    value={tab.value}
                    label={tab.label}
                    icon={
                        <Label
                            variant={((tab.value === 'all' || tab.value === value) && 'filled') || 'soft'}
                            color={tab.color || 'default'}
                        >
                            {getCount(tab.value)}
                        </Label>
                    }
                />
            ))}
        </Tabs>
    );
}

StatusTabsFilter.propTypes = {
    value: PropTypes.string.isRequired,
    options: PropTypes.arrayOf(
        PropTypes.shape({
            value: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
            color: PropTypes.string,
        })
    ).isRequired,
    onChange: PropTypes.func.isRequired,
    getCount: PropTypes.func.isRequired,
    sx: PropTypes.object,
};

export default memo(StatusTabsFilter);