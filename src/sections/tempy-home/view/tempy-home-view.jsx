import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import Box from '@mui/material/Box';

import { TempyHero } from '../tempy-hero';
import { TempyAbout } from '../tempy-about';
import { TempyFAQs } from '../tempy-faqs';
import { TempyStats } from '../tempy-stats';
import { TempyTrust } from '../tempy-trust';
import { TempyNavbar } from '../tempy-navbar';
import { TempyFooter } from '../tempy-footer';
import { TempyHowItWorks } from '../tempy-how-it-works';
import { TempyRecentShifts } from '../tempy-recent-shifts';
import { TempyOpportunities } from '../tempy-opportunities';
import { scrollToTempySection } from '../tempy-nav-utils';


export function TempyHomeView() {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return undefined;

    const timer = window.setTimeout(() => {
      scrollToTempySection(hash);
    }, 150);

    return () => window.clearTimeout(timer);
  }, [hash]);
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TempyNavbar overlay />

      <Box sx={{ flex: 1 }}>
        <TempyHero />

        <TempyStats />

        <TempyHowItWorks />

        <TempyOpportunities />

        <TempyRecentShifts />

        <TempyTrust />

        <TempyAbout />

        <TempyFAQs />
      </Box>

      <TempyFooter />
    </Box>
  );
}
