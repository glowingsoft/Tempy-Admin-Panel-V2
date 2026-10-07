import { useCallback } from 'react';
import { useLocation } from 'react-router-dom';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Unstable_Grid2';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { renderWithTempyBrand } from 'src/components/tempy-brand';

import { scrollToTempySection } from './tempy-nav-utils';

const LINKS_COL1 = [
  { label: 'Home', to: '/' },
  { label: 'How It Works', to: '/', hash: 'how-it-works' },
  { label: 'Services', to: '/', hash: 'services' },
];

const LINKS_COL2 = [
  { label: 'About US', href: paths.about },
  { label: 'Privacy Policy', href: paths.privacy },
  { label: 'Terms of Service', href: paths.terms },
  { label: 'FAQs', href: paths.faqs },
];

const linkSx = {
  display: 'block',
  py: 0.4,
  fontSize: 14,
  color: 'grey.400',
  cursor: 'pointer',
  '&:hover': { color: 'primary.light' },
  transition: 'color 0.2s',
};

function FooterLink({ label, href }) {
  return (
    <Link
      component={RouterLink}
      href={href}
      underline="none"
      sx={{
        ...linkSx,
        color: 'text.secondary',
        '&:hover': { color: 'primary.main' },
      }}
    >
      {label}
    </Link>
  );
}

function FooterSectionLink({ label, to, hash }) {
  const location = useLocation();

  const handleClick = useCallback(
    (event) => {
      if (hash) {
        if (location.pathname === '/' || location.pathname === '') {
          event.preventDefault();
          scrollToTempySection(hash);
          window.history.replaceState(null, '', `#${hash}`);
        }
        return;
      }

      if (to === '/' && (location.pathname === '/' || location.pathname === '')) {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        window.history.replaceState(null, '', '/');
      }
    },
    [hash, location.pathname, to]
  );

  return (
    <Link
      component={RouterLink}
      href={hash ? { pathname: '/', hash } : to}
      onClick={handleClick}
      underline="none"
      sx={linkSx}
    >
      {label}
    </Link>
  );
}

export function TempyFooter() {
  const theme = useTheme();

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: theme.palette.grey[900],
        color: 'common.white',
        pt: { xs: 6, md: 8 },
        pb: 3,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Column 1: Links */}
          <Grid xs={12} sm={6} md={3}>
            <Typography
              variant="overline"
              sx={{ fontWeight: 700, color: 'grey.400', letterSpacing: 1.5, mb: 2, display: 'block' }}
            >
              LINKS
            </Typography>
            <Stack spacing={0.25}>
              {LINKS_COL1.map((link) => (
                <FooterSectionLink key={link.label} {...link} />
              ))}
            </Stack>
          </Grid>

          {/* Column 2: More Links */}
          <Grid xs={12} sm={6} md={3}>
            <Stack spacing={0.25}>
              <Typography
                variant="overline"
                sx={{ fontWeight: 700, color: 'grey.400', letterSpacing: 1.5, mb: 2, display: 'block' }}
              >
                Legal
              </Typography>
              {LINKS_COL2.map((link) => (
                <FooterLink key={link.label} label={link.label} href={link.href} />
              ))}
            </Stack>
          </Grid>

          {/* Column 3: Empty / spacer on md+ */}
          <Grid xs={0} md={2} sx={{ display: { xs: 'none', md: 'block' } }} />

          {/* Column 4: Contact */}
          <Grid xs={12} sm={6} md={4}>
            <Typography
              variant="overline"
              sx={{ fontWeight: 700, color: 'grey.400', letterSpacing: 1.5, mb: 2, display: 'block' }}
            >
              CONTACT
            </Typography>
            <Stack spacing={1}>
              <Box>
                <Typography variant="body2" sx={{ color: 'grey.300', fontSize: 14 }}>
                  Phone: 09 123 4567
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: 'grey.300', fontSize: 14 }}>
                  Email:{' '}
                  <Link
                    href="mailto:info@tempy.com"
                    sx={{
                      color: 'primary.light',
                      '&:hover': { color: 'primary.main' },
                    }}
                  >
                    info@tempy.com
                  </Link>
                </Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ borderColor: alpha('#fff', 0.1), my: 4 }} />

        <Typography variant="body2" align="center" sx={{ color: 'grey.500', fontSize: 13 }}>
          ©{new Date().getFullYear()} {renderWithTempyBrand('TEMPY')} All Rights Reserved
        </Typography>
      </Container>
    </Box>
  );
}
