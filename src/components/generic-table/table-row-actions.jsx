import { memo } from 'react';
import PropTypes from 'prop-types';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import { Iconify } from 'src/components/iconify';

export const GenericTableRowActions = memo(({ actions }) => (
    <Stack direction="row" alignItems="center" spacing={0.5}>
        {actions.map(({ key, icon, tooltip, color = 'default', onClick, hidden = false }) =>
            !hidden && (
                <Tooltip key={key} title={tooltip} placement="top" arrow>
                    <IconButton color={color} onClick={onClick}>
                        <Iconify icon={icon} />
                    </IconButton>
                </Tooltip>
            )
        )}
    </Stack>
));

GenericTableRowActions.propTypes = {
    actions: PropTypes.arrayOf(
        PropTypes.shape({
            key: PropTypes.string.isRequired,
            icon: PropTypes.string.isRequired,
            tooltip: PropTypes.string.isRequired,
            color: PropTypes.string,
            onClick: PropTypes.func.isRequired,
            hidden: PropTypes.bool,
        })
    ).isRequired,
};

GenericTableRowActions.displayName = 'GenericTableRowActions';