import Box from '@mui/material/Box';

import { TempyNavbar } from './tempy-navbar';
import { TempyFooter } from './tempy-footer';

// ----------------------------------------------------------------------

export function TempyPageLayout({ children }) {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <TempyNavbar />

      <Box component="main" sx={{ flex: 1, pt: { xs: 10, md: 11 } }}>
        {children}
      </Box>

      <TempyFooter />
    </Box>
  );
}
