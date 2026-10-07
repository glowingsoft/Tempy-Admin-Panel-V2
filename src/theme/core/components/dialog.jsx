import { buttonClasses } from '@mui/material/Button';
import { loadingButtonClasses } from '@mui/lab/LoadingButton';

// ----------------------------------------------------------------------

function dialogPrimaryContainedStyles(theme) {
  return {
    [`& .${buttonClasses.contained}.${buttonClasses.colorInherit}, & .${buttonClasses.contained}.${buttonClasses.colorSuccess}`]:
      {
        color: theme.vars.palette.primary.contrastText,
        backgroundColor: theme.vars.palette.primary.main,
        '&:hover': {
          backgroundColor: theme.vars.palette.primary.dark,
          boxShadow: theme.customShadows.primary,
        },
      },
  };
}

/** Compact, consistent action buttons in every modal footer */
function dialogActionButtonStyles(theme) {
  return {
    [`& .${buttonClasses.root}`]: {
      height: 32,
      minHeight: 32,
      fontSize: theme.typography.pxToRem(13),
      fontWeight: 600,
      lineHeight: 1.2,
      paddingTop: 0,
      paddingBottom: 0,
      paddingLeft: theme.spacing(1.5),
      paddingRight: theme.spacing(1.5),
      borderRadius: Number(theme.shape.borderRadius) * 1.25,
    },
    [`& .${buttonClasses.sizeLarge}`]: {
      height: 32,
      minHeight: 32,
      fontSize: theme.typography.pxToRem(13),
      paddingLeft: theme.spacing(1.5),
      paddingRight: theme.spacing(1.5),
    },
    [`& .${buttonClasses.sizeMedium}`]: {
      height: 32,
      minHeight: 32,
      fontSize: theme.typography.pxToRem(13),
      paddingLeft: theme.spacing(1.5),
      paddingRight: theme.spacing(1.5),
    },
    [`& .${buttonClasses.sizeSmall}`]: {
      height: 32,
      minHeight: 32,
      fontSize: theme.typography.pxToRem(13),
      paddingLeft: theme.spacing(1.5),
      paddingRight: theme.spacing(1.5),
    },
    [`& .${buttonClasses.text}`]: {
      paddingLeft: theme.spacing(1),
      paddingRight: theme.spacing(1),
    },
    [`& .${loadingButtonClasses.root}`]: {
      height: 32,
      minHeight: 32,
    },
    [`& .${buttonClasses.startIcon}`]: {
      marginRight: theme.spacing(0.75),
      '& > *:nth-of-type(1)': { fontSize: 16 },
    },
    [`& .${buttonClasses.endIcon}`]: {
      marginLeft: theme.spacing(0.75),
      '& > *:nth-of-type(1)': { fontSize: 16 },
    },
  };
}

const MuiDialog = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    paper: ({ ownerState, theme }) => ({
      boxShadow: theme.customShadows.dialog,
      borderRadius: theme.shape.borderRadius * 2,
      ...(!ownerState.fullScreen && { margin: theme.spacing(2) }),
      ...dialogPrimaryContainedStyles(theme),
      // All modal Button / LoadingButton sizes match site-wide (IconButton untouched)
      ...dialogActionButtonStyles(theme),
    }),
    paperFullScreen: { borderRadius: 0 },
  },
};

const MuiDialogTitle = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: { root: ({ theme }) => ({ padding: theme.spacing(3) }) },
};

const MuiDialogContent = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    root: ({ theme }) => ({ padding: theme.spacing(0, 3) }),
    dividers: ({ theme }) => ({
      borderTop: 0,
      borderBottomStyle: 'dashed',
      paddingBottom: theme.spacing(3),
    }),
  },
};

const MuiDialogActions = {
  /** **************************************
   * DEFAULT PROPS
   *************************************** */
  defaultProps: { disableSpacing: true },

  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    root: ({ theme }) => ({
      padding: theme.spacing(2, 3),
      '& > :not(:first-of-type)': { marginLeft: theme.spacing(1) },
      ...dialogPrimaryContainedStyles(theme),
    }),
  },
};

// ----------------------------------------------------------------------

export const dialog = {
  MuiDialog,
  MuiDialogTitle,
  MuiDialogContent,
  MuiDialogActions,
};
