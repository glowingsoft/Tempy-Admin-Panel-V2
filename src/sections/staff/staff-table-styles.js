// ----------------------------------------------------------------------

export const STAFF_TABLE_SX = {
  minWidth: 1100,
  width: '100%',
  '& .MuiTableCell-root': {
    px: 2,
    py: 1.25,
    typography: 'body2',
  },
  '& .MuiTableCell-head': {
    py: 1.5,
    typography: 'subtitle2',
    color: 'text.secondary',
    bgcolor: 'background.neutral',
    whiteSpace: 'nowrap',
  },
};

export const CARE_HOME_STAFF_TABLE_HEAD = [
  { id: 'name', label: 'Staff', minWidth: 200 },
  { id: 'role', label: 'Role', minWidth: 100 },
  { id: 'bookingCount', label: 'Bookings', minWidth: 88, align: 'center' },
  { id: 'addedOn', label: 'Added On', minWidth: 112 },
  { id: 'latestShiftDate', label: 'Latest Shift', minWidth: 120 },
  { id: 'rating', label: 'Avg. Rating', minWidth: 132 },
  { id: 'status', label: 'Status', minWidth: 96 },
  { id: 'action', label: 'Action', minWidth: 56, align: 'center' },
];

export const AGENCY_STAFF_TABLE_HEAD = [
  { id: 'name', label: 'Staff', minWidth: 200 },
  { id: 'specialty', label: 'Specialty', minWidth: 140 },
  { id: 'ratePerHour', label: 'Rate / hr', minWidth: 100, align: 'center' },
  { id: 'platformPercent', label: 'Platform %', minWidth: 100, align: 'center' },
  { id: 'addedOn', label: 'Added On', minWidth: 112 },
  { id: 'status', label: 'Status', minWidth: 96 },
  { id: 'action', label: 'Action', minWidth: 116, align: 'center' },
];
