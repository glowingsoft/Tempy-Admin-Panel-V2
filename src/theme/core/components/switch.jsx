import { switchClasses } from '@mui/material/Switch';

import { varAlpha, stylesMode } from '../../styles';

// ----------------------------------------------------------------------

const MuiSwitch = {
  /** **************************************
   * DEFAULT PROPS
   *************************************** */
  defaultProps: {
    color: 'primary',
  },

  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    root: { alignItems: 'center' },
    switchBase: ({ ownerState, theme }) => ({
      top: 'unset',
      transform: 'translateX(6px)',
      [`&.${switchClasses.checked}`]: {
        [`& .${switchClasses.thumb}`]: {
          ...(ownerState.color === 'default' && {
            [stylesMode.dark]: { color: theme.vars.palette.grey[800] },
          }),
        },
        [`&+.${switchClasses.track}`]: {
          opacity: 1,
          ...((ownerState.color === 'default' || ownerState.color === 'primary') && {
            backgroundColor: theme.vars.palette.primary.main,
          }),
          ...(ownerState.color === 'success' && {
            backgroundColor: theme.vars.palette.primary.main,
          }),
        },
      },
      [`&.${switchClasses.disabled}`]: {
        [`& .${switchClasses.thumb}`]: { opacity: 1, [stylesMode.dark]: { opacity: 0.48 } },
        [`&+.${switchClasses.track}`]: { opacity: 0.48 },
      },
    }),
    track: ({ theme }) => ({
      opacity: 1,
      borderRadius: 10,
      backgroundColor: varAlpha(theme.vars.palette.grey['500Channel'], 0.48),
    }),
    thumb: ({ theme }) => ({ color: theme.vars.palette.common.white }),
    sizeMedium: {
      [`& .${switchClasses.track}`]: { height: 20 },
      [`& .${switchClasses.thumb}`]: { width: 14, height: 14 },
    },
    sizeSmall: {
      [`& .${switchClasses.track}`]: { height: 16 },
      [`& .${switchClasses.thumb}`]: { width: 10, height: 10 },
    },
  },
};

// ----------------------------------------------------------------------

export const switches = { MuiSwitch };
