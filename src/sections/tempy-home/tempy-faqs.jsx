import { useState } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Unstable_Grid2';
import Collapse from '@mui/material/Collapse';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { Iconify } from 'src/components/iconify';
import { renderWithTempyBrand } from 'src/components/tempy-brand';

import { TEMPY_SECTION_SCROLL_SX } from './tempy-nav-utils';


const FAQS = [
  {
    q: 'Does Tempy Cover My Area?',
    a: 'Tempy operates across the United Kingdom. We have verified agencies and freelance carers registered in all major cities including London, Manchester, Birmingham, Leeds, Bristol, Sheffield, and surrounding areas. If you post a shift in your area, local professionals will be notified instantly.',
  },
  {
    q: 'How Are Healthcare Professionals Verified?',
    a: 'Every healthcare professional on Tempy undergoes a thorough verification process including DBS (Disclosure and Barring Service) checks, reference verification, qualification checks, and identity confirmation. Agencies are also vetted for CQC compliance before joining the platform.',
  },
  {
    q: 'Will My Data Be Kept Secure?',
    a: 'Yes. Tempy is fully GDPR compliant and uses industry-standard encryption for all data in transit and at rest. We never share your personal or business data with third parties without your explicit consent. Our platform is regularly audited for security compliance.',
  },
  {
    q: 'What If I Need to Cancel a Shift?',
    a: 'You can cancel a confirmed shift from your dashboard. We recommend notifying your selected carer or agency as soon as possible. Cancellation policies may vary depending on the agreement with the agency, but our support team is available 24/7 to help resolve any issues.',
  },
  {
    q: 'Can I Travel With My Carer?',
    a: 'Yes. Many of our registered carers offer live-in and travel care services. When posting a job, simply indicate whether travel or accommodation is required and carers with those capabilities will be highlighted in your bids.',
  },
  {
    q: 'How Many Bids Will I Receive?',
    a: 'There is no guarantee on the number of bids, but on average care providers receive 5–15 bids within the first hour of posting. Bids depend on the role, location, pay rate, and timing. Our network of 18,000+ carers and 1,200+ agencies ensures strong coverage.',
  },
  {
    q: 'Do Agencies Have Different Service Areas?',
    a: 'Yes. Each agency on Tempy sets its own service radius and specialities. When you post a shift, only agencies and carers operating in your area and matching the required skills will be notified, ensuring the bids you receive are relevant and actionable.',
  },
  {
    q: 'When Will I Receive a Quote?',
    a: 'You will typically start to receive quotes within 20–30 minutes of posting, often much sooner. Urgent shifts can be flagged to alert the network immediately. You can compare all bids side-by-side from your dashboard and accept the one that best fits your needs and budget.',
  },
];

function FAQItem({ q, a, isOpen, onToggle }) {
  const theme = useTheme();
  return (
    <Box
      sx={{
        mb: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: isOpen ? alpha(theme.palette.primary.main, 0.3) : 'divider',
        bgcolor: isOpen ? alpha(theme.palette.primary.main, 0.03) : 'background.paper',
        overflow: 'hidden',
        transition: 'border-color 0.2s, background 0.2s',
      }}
    >
      <Box
        onClick={onToggle}
        sx={{
          px: 2.5,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          gap: 2,
          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
        }}
      >
        <Typography
          variant="body2"
          sx={{ fontWeight: 700, color: isOpen ? 'primary.main' : 'text.primary', flex: 1, lineHeight: 1.5 }}
        >
          {renderWithTempyBrand(q)}
        </Typography>
        <Iconify
          icon={isOpen ? 'solar:alt-arrow-up-bold' : 'solar:alt-arrow-down-bold'}
          sx={{
            width: 18,
            height: 18,
            color: isOpen ? 'primary.main' : 'text.disabled',
            flexShrink: 0,
            transition: 'transform 0.2s',
          }}
        />
      </Box>
      <Collapse in={isOpen}>
        <Box sx={{ px: 2.5, pb: 2.5 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
            {renderWithTempyBrand(a)}
          </Typography>
        </Box>
      </Collapse>
    </Box>
  );
}

export function TempyFAQs({ showHeader = true }) {
  const [openIndex, setOpenIndex] = useState(null);

  const half = Math.ceil(FAQS.length / 2);
  const colA = FAQS.slice(0, half);
  const colB = FAQS.slice(half);

  const toggle = (i) => setOpenIndex(openIndex === i ? null : i);

  return (
    <Box id="help" sx={{ ...TEMPY_SECTION_SCROLL_SX, py: { xs: 8, md: 12 }, bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
        {showHeader && (
          <>
            <Typography
              variant="h4"
              align="center"
              sx={{ fontWeight: 700, mb: 1.5, color: 'text.primary' }}
            >
              Frequently Asked Questions
            </Typography>
            <Typography
              variant="body1"
              align="center"
              sx={{ color: 'text.secondary', mb: 6, maxWidth: 480, mx: 'auto' }}
            >
              {renderWithTempyBrand(
                'Everything you need to know about posting shifts and finding care staff on Tempy'
              )}
            </Typography>
          </>
        )}

        {!showHeader && <Box sx={{ mb: 2 }} />}

        <Grid container spacing={2}>
          <Grid xs={12} md={6}>
            {colA.map((faq, i) => (
              <FAQItem
                key={faq.q}
                q={faq.q}
                a={faq.a}
                isOpen={openIndex === i}
                onToggle={() => toggle(i)}
              />
            ))}
          </Grid>
          <Grid xs={12} md={6}>
            {colB.map((faq, i) => (
              <FAQItem
                key={faq.q}
                q={faq.q}
                a={faq.a}
                isOpen={openIndex === half + i}
                onToggle={() => toggle(half + i)}
              />
            ))}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
