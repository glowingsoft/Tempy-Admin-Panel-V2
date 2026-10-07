import { Outlet } from 'react-router-dom';

import { StaffProvider } from 'src/sections/staff/context/staff-provider';

// ----------------------------------------------------------------------

export default function AgencyStaffLayout() {
  return (
    <StaffProvider>
      <Outlet />
    </StaffProvider>
  );
}
