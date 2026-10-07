export const ADMIN_ENTITY_STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: 'success' },
  { value: 'pending', label: 'Pending', color: 'warning' },
  { value: 'inactive', label: 'Inactive', color: 'error' },
  { value: 'suspended', label: 'Suspended', color: 'error' },
];

export const ADMIN_ENTITY_STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  ...ADMIN_ENTITY_STATUS_OPTIONS,
];

export function getAdminEntityStatusOption(status) {
  return (
    ADMIN_ENTITY_STATUS_OPTIONS.find((option) => option.value === status) || {
      value: status,
      label: status ? String(status).replace(/_/g, ' ') : '—',
      color: 'default',
    }
  );
}
