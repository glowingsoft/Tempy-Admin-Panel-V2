import { useSelector } from 'react-redux';

import MenuItem from '@mui/material/MenuItem';

import { Field } from 'src/components/hook-form';

const ADD_STAFF_STATUS_OPTIONS = [{ value: 'pending', label: 'Pending' }];

const EDIT_STAFF_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'active', label: 'Active' },
  { value: 'deleted', label: 'Deleted' },
  { value: 'left', label: 'Left' },
];

const ADMIN_STAFF_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'active', label: 'Active' },
  { value: 'deleted', label: 'Deleted' },
  { value: 'left', label: 'Left' },
];

function getStatusLabel(value) {
  if (value === 'accepted') return 'Active';
  if (value === 'active') return 'Active';
  if (value === 'inactive') return 'Inactive';
  if (value === 'suspended') return 'Suspended';
  if (value === 'pending') return 'Pending';
  if (value === 'deleted') return 'Deleted';
  if (value === 'left') return 'Left';
  return value;
}


export function getSupplierStaffStatusOptions({ isAdminImpersonating, currentStatus, isEdit } = {}) {
  if (isAdminImpersonating) {
    return isEdit ? ADMIN_STAFF_STATUS_OPTIONS : ADD_STAFF_STATUS_OPTIONS;
  }

  const options = isEdit ? [...EDIT_STAFF_STATUS_OPTIONS] : [...ADD_STAFF_STATUS_OPTIONS];
  const current = String(currentStatus || '').trim().toLowerCase();

  if (current && !options.some((option) => option.value === current)) {
    options.unshift({ value: current, label: getStatusLabel(current) });
  }

  return options;
}

export function SupplierStaffStatusField({
  name = 'status',
  currentStatus,
  required = false,
  isEdit = false,
  ...other
}) {
  const isAdminImpersonating = Boolean(useSelector((state) => state.impersonation?.isActive));
  const options = getSupplierStaffStatusOptions({ isAdminImpersonating, currentStatus, isEdit });

  return (
    <Field.Select
      name={name}
      label={required ? 'Status *' : 'Status'}
      InputLabelProps={{ shrink: true }}
      {...other}
    >
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </Field.Select>
  );
}
