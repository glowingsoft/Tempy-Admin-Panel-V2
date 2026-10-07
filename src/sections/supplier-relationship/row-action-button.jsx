import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

/** Icon-only table action with a tooltip, like the other list tables (e.g. Branches). */
export function RowActionButton({ title, icon, color = 'default', disabled, ...other }) {
  return (
    <Tooltip title={title}>
      {/* span keeps the tooltip working while the button is disabled */}
      <span>
        <IconButton size="small" color={color} disabled={disabled} aria-label={title} {...other}>
          <Iconify icon={icon} width={18} />
        </IconButton>
      </span>
    </Tooltip>
  );
}
