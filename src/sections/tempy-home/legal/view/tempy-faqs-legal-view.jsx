import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { renderWithTempyBrand } from 'src/components/tempy-brand';

import { TempyFAQs } from '../../tempy-faqs';
import { TempyPageLayout } from '../../tempy-page-layout';
import { TEMPY_GRADIENT } from '../../tempy-theme';

export function TempyFaqsLegalView() {
  return (
    <TempyPageLayout>
      <Box
        sx={{
          py: { xs: 5, md: 7 },
          background: TEMPY_GRADIENT,
          color: 'common.white',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 1.5 }}>
            FAQs
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.92, maxWidth: 720 }}>
            {renderWithTempyBrand(
              'Answers to common questions about posting shifts, hiring carers, and using the Tempy platform.'
            )}
          </Typography>
        </Container>
      </Box>

      <TempyFAQs showHeader={false} />
    </TempyPageLayout>
  );
}
