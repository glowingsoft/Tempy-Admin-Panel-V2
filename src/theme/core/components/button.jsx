import { buttonClasses } from '@mui/material/Button';
import { loadingButtonClasses } from '@mui/lab/LoadingButton';

import { varAlpha, stylesMode } from '../../styles';

const COLORS = ['primary', 'secondary', 'info', 'success', 'warning', 'error'];

const PRIMARY_ACTION_COLORS = new Set(['inherit', 'success']);

function resolveThemeColor(color) {
  return color === 'success' ? 'primary' : color;
}

function styleColors(ownerState, styles) {
  const outputStyle = COLORS.reduce((acc, color) => {
    if (!ownerState.disabled && ownerState.color === color) {
      acc = styles(resolveThemeColor(color));
    }
    return acc;
  }, {});

  return outputStyle;
}

function primaryActionButtonStyles(theme, ownerState) {
  if (ownerState.disabled || !PRIMARY_ACTION_COLORS.has(ownerState.color)) {
    return {};
  }

  if (ownerState.variant === 'contained') {
    return {
      color: theme.vars.palette.primary.contrastText,
      backgroundColor: theme.vars.palette.primary.main,
      '&:hover': {
        backgroundColor: theme.vars.palette.primary.dark,
        boxShadow: theme.customShadows.primary,
      },
    };
  }

  if (ownerState.variant === 'outlined') {
    return {
      color: theme.vars.palette.primary.main,
      borderColor: varAlpha(theme.vars.palette.primary.mainChannel, 0.48),
    };
  }

  if (ownerState.variant === 'soft') {
    return {
      color: theme.vars.palette.primary.dark,
      backgroundColor: varAlpha(theme.vars.palette.primary.mainChannel, 0.16),
      '&:hover': { backgroundColor: varAlpha(theme.vars.palette.primary.mainChannel, 0.32) },
      [stylesMode.dark]: { color: theme.vars.palette.primary.light },
    };
  }

  if (ownerState.variant === 'text') {
    return {
      color: theme.vars.palette.primary.main,
    };
  }

  return {};
}

// ----------------------------------------------------------------------

const MuiButtonBase = {
  styleOverrides: { root: ({ theme }) => ({ fontFamily: theme.typography.fontFamily }) },
};

// ----------------------------------------------------------------------

const softVariant = {
  colors: COLORS.map((color) => ({
    props: ({ ownerState }) =>
      !ownerState.disabled && ownerState.variant === 'soft' && ownerState.color === color,
    style: ({ theme }) => {
      const paletteColor = resolveThemeColor(color);

      return {
        color: theme.vars.palette[paletteColor].dark,
        backgroundColor: varAlpha(theme.vars.palette[paletteColor].mainChannel, 0.16),
        '&:hover': { backgroundColor: varAlpha(theme.vars.palette[paletteColor].mainChannel, 0.32) },
        [stylesMode.dark]: { color: theme.vars.palette[paletteColor].light },
      };
    },
  })),
  base: [
    {
      props: ({ ownerState }) => ownerState.variant === 'soft',
      style: ({ theme }) => ({
        backgroundColor: varAlpha(theme.vars.palette.grey['500Channel'], 0.08),
        '&:hover': { backgroundColor: varAlpha(theme.vars.palette.grey['500Channel'], 0.24) },
        [`&.${buttonClasses.disabled}`]: {
          backgroundColor: theme.vars.palette.action.disabledBackground,
        },
        [`& .${loadingButtonClasses.loadingIndicatorStart}`]: { left: 14 },
        [`& .${loadingButtonClasses.loadingIndicatorEnd}`]: { right: 14 },
        [`&.${buttonClasses.sizeSmall}`]: {
          [`& .${loadingButtonClasses.loadingIndicatorStart}`]: { left: 10 },
          [`& .${loadingButtonClasses.loadingIndicatorEnd}`]: { right: 10 },
        },
      }),
    },
  ],
};

const MuiButton = {
  defaultProps: { color: 'primary', disableElevation: true },

  variants: [...[...softVariant.base, ...softVariant.colors]],

  styleOverrides: {
    root: ({ theme, ownerState }) => primaryActionButtonStyles(theme, ownerState),
    contained: ({ theme, ownerState }) => ({
      ...styleColors(ownerState, (color) => ({
        '&:hover': { boxShadow: theme.customShadows[color] },
      })),
    }),
    outlined: ({ theme, ownerState }) => ({
      ...styleColors(ownerState, (color) => ({
        borderColor: varAlpha(theme.vars.palette[color].mainChannel, 0.48),
      })),
      '&:hover': { borderColor: 'currentColor', boxShadow: '0 0 0 0.75px currentColor' },
    }),
    text: ({ ownerState, theme }) => ({
      ...(ownerState.color === 'inherit' &&
        !ownerState.disabled && {
          '&:hover': { backgroundColor: theme.vars.palette.action.hover },
        }),
    }),
    sizeSmall: ({ ownerState }) => ({
      height: 30,
      ...(ownerState.variant === 'text'
        ? { paddingLeft: '4px', paddingRight: '4px' }
        : { paddingLeft: '8px', paddingRight: '8px' }),
    }),
    sizeMedium: ({ ownerState }) => ({
      ...(ownerState.variant === 'text'
        ? { paddingLeft: '8px', paddingRight: '8px' }
        : { paddingLeft: '12px', paddingRight: '12px' }),
    }),
    sizeLarge: ({ ownerState }) => ({
      height: 48,
      ...(ownerState.variant === 'text'
        ? { paddingLeft: '10px', paddingRight: '10px' }
        : { paddingLeft: '16px', paddingRight: '16px' }),
    }),
  },
};

const MuiLoadingButton = {
  defaultProps: {
    color: 'primary',
  },
};

// ----------------------------------------------------------------------

export const button = { MuiButtonBase, MuiButton, MuiLoadingButton };
