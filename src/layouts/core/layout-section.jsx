import Box from '@mui/material/Box';
import GlobalStyles from '@mui/material/GlobalStyles';

import { layoutClasses } from '../classes';


export function LayoutSection({
  sx,
  cssVars,
  children,
  footerSection,
  headerSection,
  sidebarSection,
}) {
  const inputGlobalStyles = (
    <GlobalStyles
      styles={{
        body: {
          '--layout-nav-zIndex': 1101,
          '--layout-nav-mobile-width': 'min(320px, 100vw)',
          '--layout-header-blur': '8px',
          '--layout-header-zIndex': 1100,
          '--layout-header-mobile-height': '64px',
          '--layout-header-desktop-height': '72px',
          ...cssVars,
        },
      }}
    />
  );

  return (
    <>
      {inputGlobalStyles}

      <Box id="root__layout" className={layoutClasses.root} sx={{ overflowX: 'hidden', ...sx }}>
        {sidebarSection ? (
          <>
            {sidebarSection}
            <Box
              display="flex"
              flex="1 1 auto"
              flexDirection="column"
              className={layoutClasses.hasSidebar}
              sx={{ minWidth: 0, width: 1, maxWidth: 1, overflowX: 'hidden' }}
            >
              {headerSection}
              {children}
              {footerSection}
            </Box>
          </>
        ) : (
          <>
            {headerSection}
            {children}
            {footerSection}
          </>
        )}
      </Box>
    </>
  );
}
