/** Shared status-tab chip/button styles for dashboard list toolbars */

export function getStatusTabChipSx(color, isActive) {
  if (color === 'default') {
    return {
      bgcolor: isActive ? 'grey.600' : 'grey.300',
      color: isActive ? 'common.white' : 'text.secondary',
    };
  }

  return {
    bgcolor: isActive ? `${color}.main` : `${color}.lighter`,
    color: isActive ? 'common.white' : `${color}.dark`,
  };
}

export function getStatusTabButtonSx(color, isActive) {
  if (color === 'default') {
    return {
      bgcolor: isActive ? 'grey.200' : 'background.paper',
      '&:hover': { bgcolor: isActive ? 'grey.200' : 'action.hover' },
    };
  }

  return {
    bgcolor: isActive ? `${color}.lighter` : 'background.paper',
    '&:hover': { bgcolor: isActive ? `${color}.lighter` : 'action.hover' },
  };
}

export const STATUS_TABS_CONTAINER_SX = {
  display: 'inline-flex',
  flexWrap: 'nowrap',
  border: (theme) => `1px solid ${theme.vars.palette.divider}`,
  borderRadius: 1,
  overflowX: 'auto',
  maxWidth: 1,
  flexShrink: 1,
  WebkitOverflowScrolling: 'touch',
  '&::-webkit-scrollbar': { height: 4 },
};

export const STATUS_TAB_BUTTON_BASE_SX = {
  py: 1,
  px: { xs: 1.25, sm: 1.75 },
  minWidth: { xs: 96, sm: 108 },
  whiteSpace: 'nowrap',
  borderRadius: 0,
  fontSize: 13,
  color: 'text.primary',
};
