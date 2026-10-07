import Button from '@mui/material/Button';
import LoadingButton from '@mui/lab/LoadingButton';


export const appButtonProps = {
  color: 'primary',
  variant: 'contained',
  size: 'large',
};

export const appToggleGroupSx = {
  width: { xs: 1, sm: 320 },
  '& .MuiToggleButtonGroup-grouped': {
    border: '1px solid',
    borderColor: 'divider',
    '&:not(:first-of-type)': {
      borderLeft: '1px solid',
      borderColor: 'divider',
      ml: 0,
    },
  },
  '& .MuiToggleButton-root': {
    flex: 1,
    py: 1.25,
    typography: 'subtitle2',
    textTransform: 'none',
    color: 'text.secondary',
    borderColor: 'divider',
    '&:hover': {
      bgcolor: 'action.hover',
    },
    '&.Mui-selected': {
      bgcolor: 'primary.main',
      color: 'primary.contrastText',
      borderColor: 'primary.main',
      fontWeight: 600,
      '&:hover': {
        bgcolor: 'primary.dark',
      },
    },
  },
};

export const appToggleGroupFullSx = {
  ...appToggleGroupSx,
  width: 1,
};


export function AppButton({ loading, children, ...other }) {
  if (typeof loading === 'boolean') {
    return (
      <LoadingButton {...appButtonProps} loading={loading} {...other}>
        {children}
      </LoadingButton>
    );
  }

  return (
    <Button {...appButtonProps} {...other}>
      {children}
    </Button>
  );
}
