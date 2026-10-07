import { useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { alpha } from '@mui/material/styles';
import useScrollTrigger from '@mui/material/useScrollTrigger';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';
import { HEALTH_CARE_LOGO, TEMPY_WHITE_LOGO } from 'src/components/logo/logo';
import { TempyBrand, tempyBrandSx } from 'src/components/tempy-brand';

import { TEMPY_NAV_LINKS, scrollToTempySection } from './tempy-nav-utils';

const NAV_LINKS = TEMPY_NAV_LINKS;

export function TempyNavbar({ overlay = false }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const trigger = useScrollTrigger({ disableHysteresis: true, threshold: 24 });
  const isTransparent = overlay && !trigger;
  const logoSrc = isTransparent ? TEMPY_WHITE_LOGO : HEALTH_CARE_LOGO;

  const handleNavClick = useCallback(
    (link) => (event) => {
      setMobileOpen(false);

      if (link.hash) {
        if (location.pathname === '/') {
          event.preventDefault();
          scrollToTempySection(link.hash);
          window.history.replaceState(null, '', `#${link.hash}`);
        }
        return;
      }

      if (link.to === '/' && location.pathname === '/') {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        window.history.replaceState(null, '', '/');
      }
    },
    [location.pathname]
  );

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        bgcolor: isTransparent ? 'transparent' : 'background.paper',
        borderBottom: isTransparent ? 'none' : trigger ? 'none' : '1px solid',
        borderColor: 'divider',
        boxShadow: isTransparent ? 'none' : trigger ? (theme) => theme.shadows[2] : 'none',
        transition: 'background-color 0.3s, box-shadow 0.3s, border-color 0.3s',
      }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 4, md: 6 } }}>
        <Toolbar disableGutters sx={{ height: 64 }}>

          {/* Logo - far left */}
          <Box
            component={RouterLink}
            href="/"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1.25,
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <Box
              component="img"
              src={logoSrc}
              alt="Tempy"
              sx={{ height: 40, width: 40, objectFit: 'contain', flexShrink: 0 }}
            />
            <TempyBrand
              component={Typography}
              variant="h6"
              sx={{
                ...tempyBrandSx,
                color: isTransparent ? 'common.white' : 'text.primary',
                fontSize: 22,
                letterSpacing: 0.5,
                display: { xs: 'none', sm: 'block' },
              }}
            />
          </Box>

          {/* Spacer */}
          <Box sx={{ flex: 1 }} />

          {/* Nav links - center */}
          <Stack
            direction="row"
            spacing={0.5}
            sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}
          >
            {NAV_LINKS.map((link, index) => (
              <Link
                key={link.label}
                component={RouterLink}
                to={link.hash ? { pathname: '/', hash: link.hash } : link.to}
                onClick={handleNavClick(link)}
                underline="none"
                sx={{
                  px: 1.5,
                  py: 0.6,
                  fontSize: 14,
                  fontWeight: 500,
                  color: isTransparent
                    ? index === 0
                      ? 'common.white'
                      : alpha('#fff', 0.88)
                    : index === 0
                      ? 'primary.main'
                      : 'text.primary',
                  borderRadius: 1,
                  bgcolor: isTransparent
                    ? index === 0
                      ? alpha('#fff', 0.16)
                      : 'transparent'
                    : index === 0
                      ? 'primary.lighter'
                      : 'transparent',
                  '&:hover': {
                    color: isTransparent ? 'common.white' : 'primary.main',
                    bgcolor: isTransparent
                      ? alpha('#fff', 0.14)
                      : index === 0
                        ? 'primary.lighter'
                        : 'action.hover',
                  },
                }}
              >
                {link.label}
              </Link>
            ))}
          </Stack>

          {/* Spacer */}
          <Box sx={{ flex: 1 }} />

          {/* Auth Buttons - far right */}
          <Stack direction="row" spacing={1.5} sx={{ display: { xs: 'none', md: 'flex' } }}>
            <Button
              component={RouterLink}
              href={paths.auth.jwt.signIn}
              variant="outlined"
              color={isTransparent ? 'inherit' : 'primary'}
              size="medium"
              sx={{
                borderRadius: 1.5,
                px: 3,
                fontWeight: 600,
                ...(isTransparent && {
                  color: 'common.white',
                  borderColor: alpha('#fff', 0.7),
                  '&:hover': {
                    borderColor: 'common.white',
                    bgcolor: alpha('#fff', 0.08),
                  },
                }),
              }}
            >
              Log in
            </Button>
            <Button
              component={RouterLink}
              href={paths.auth.jwt.signUp}
              variant="contained"
              color="primary"
              size="medium"
              sx={{
                borderRadius: 1.5,
                px: 3,
                fontWeight: 600,
                ...(isTransparent && {
                  bgcolor: 'common.white',
                  color: 'primary.main',
                  '&:hover': { bgcolor: alpha('#fff', 0.9) },
                }),
              }}
            >
              Sign up
            </Button>
          </Stack>

          {/* Mobile menu button */}
          <IconButton
            onClick={() => setMobileOpen(true)}
            sx={{ display: { md: 'none' }, color: isTransparent ? 'common.white' : 'text.primary' }}
          >
            <Iconify icon="solar:hamburger-menu-bold" />
          </IconButton>
        </Toolbar>
      </Container>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        PaperProps={{ sx: { width: 260, p: 3 } }}
      >
        <Stack spacing={0.5}>
          <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2 }}>
            <Box
              component="img"
              src={HEALTH_CARE_LOGO}
              alt="Health Care"
              sx={{ height: 36, width: 36, objectFit: 'contain', flexShrink: 0 }}
            />
            <TempyBrand
              component={Typography}
              variant="h6"
              sx={{ ...tempyBrandSx, color: 'text.primary', fontSize: 22, letterSpacing: 0.5 }}
            />
          </Stack>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              component={RouterLink}
              to={link.hash ? { pathname: '/', hash: link.hash } : link.to}
              onClick={handleNavClick(link)}
              underline="none"
              sx={{
                py: 1,
                px: 1.5,
                fontSize: 14,
                fontWeight: 500,
                color: 'text.primary',
                borderRadius: 1,
                display: 'block',
                '&:hover': { color: 'primary.main', bgcolor: 'action.hover' },
              }}
            >
              {link.label}
            </Link>
          ))}
          <Box sx={{ pt: 2 }}>
            <Button
              component={RouterLink}
              href={paths.auth.jwt.signIn}
              variant="outlined"
              color="primary"
              fullWidth
              sx={{ mb: 1 }}
              onClick={() => setMobileOpen(false)}
            >
              Log in
            </Button>
            <Button
              component={RouterLink}
              href={paths.auth.jwt.signUp}
              variant="contained"
              color="primary"
              fullWidth
              onClick={() => setMobileOpen(false)}
            >
              Sign up
            </Button>
          </Box>
        </Stack>
      </Drawer>
    </AppBar>
  );
}
