import { Outlet } from 'react-router-dom';

import { StaffProvider } from 'src/sections/staff/context/staff-provider';

// ----------------------------------------------------------------------

export default function StaffLayout() {
  return (
    <StaffProvider>
      <Outlet />
    </StaffProvider>
  );
}
