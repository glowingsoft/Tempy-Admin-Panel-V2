import { isValidElement } from 'react';

import IconButton from '@mui/material/IconButton';
import MuiDialog from '@mui/material/Dialog/Dialog.js';

import { Iconify } from 'src/components/iconify';

export { default as dialogClasses } from '@mui/material/Dialog/dialogClasses.js';

function iconName(element) {
  const icon = element?.props?.icon;
  return typeof icon === 'string' ? icon : '';
}

function hasCloseControl(node) {
  if (node == null || typeof node === 'boolean') return false;
  if (Array.isArray(node)) return node.some(hasCloseControl);
  if (!isValidElement(node)) return false;

  const label = String(node.props?.['aria-label'] || '').toLowerCase();
  if (label.includes('close')) return true;
  if (/close/i.test(iconName(node))) return true;

  return hasCloseControl(node.props?.children);
}

export default function Dialog({ children, onClose, PaperProps, ...other }) {
  const showClose = typeof onClose === 'function' && !hasCloseControl(children);

  return (
    <MuiDialog
      onClose={onClose}
      PaperProps={{
        ...PaperProps,
        sx: [{ position: 'relative' }, PaperProps?.sx],
      }}
      {...other}
    >
      {showClose ? (
        <IconButton
          type="button"
          aria-label="Close"
          onClick={(event) => onClose(event, 'closeButton')}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 2,
            color: 'text.secondary',
          }}
        >
          <Iconify icon="mingcute:close-line" width={20} />
        </IconButton>
      ) : null}
      {children}
    </MuiDialog>
  );
}
