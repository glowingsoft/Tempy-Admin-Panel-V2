import { toggleButtonClasses } from '@mui/material/ToggleButton';

import { varAlpha } from '../../styles';

// ----------------------------------------------------------------------

const COLORS = ['primary', 'secondary', 'info', 'success', 'warning', 'error'];

function styleColors(ownerState, styles) {
  const outputStyle = COLORS.reduce((acc, color) => {
    if (!ownerState.disabled && ownerState.color === color) {
      acc = styles(color === 'success' ? 'primary' : color);
    }
    return acc;
  }, {});

  return outputStyle;
}

// ----------------------------------------------------------------------

const MuiToggleButton = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    root: ({ theme, ownerState }) => {
      const styled = {
        colors: styleColors(ownerState, (color) => ({
          '&:hover': {
            borderColor: varAlpha(theme.vars.palette[color].mainChannel, 0.48),
            backgroundColor: varAlpha(
              theme.vars.palette[color].mainChannel,
              theme.vars.palette.action.hoverOpacity
            ),
          },
        })),
        selected: {
          [`&.${toggleButtonClasses.selected}`]: {
            borderColor: 'currentColor',
            boxShadow: '0 0 0 0.75px currentColor',
          },
        },
        disabled: {
          ...(ownerState.disabled && {
            [`&.${toggleButtonClasses.selected}`]: {
              color: theme.vars.palette.action.disabled,
              backgroundColor: theme.vars.palette.action.selected,
              borderColor: theme.vars.palette.action.disabledBackground,
            },
          }),
        },
        successAsPrimary: {
          ...(ownerState.color === 'success' && {
            [`&.${toggleButtonClasses.selected}`]: {
              color: theme.vars.palette.primary.main,
              backgroundColor: varAlpha(
                theme.vars.palette.primary.mainChannel,
                theme.vars.palette.action.selectedOpacity
              ),
              borderColor: varAlpha(theme.vars.palette.primary.mainChannel, 0.48),
            },
          }),
        },
      };

      return { ...styled.colors, ...styled.selected, ...styled.disabled, ...styled.successAsPrimary };
    },
  },
};

// ----------------------------------------------------------------------

const MuiToggleButtonGroup = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    root: ({ theme }) => ({
      gap: 4,
      padding: 4,
      border: `solid 1px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
    }),
    grouped: {
      [`&.${toggleButtonClasses.root}`]: { border: 'none', borderRadius: 'inherit' },
      [`&.${toggleButtonClasses.selected}`]: { boxShadow: 'none' },
    },
  },
};

// ----------------------------------------------------------------------

export const toggleButton = { MuiToggleButton, MuiToggleButtonGroup };
