import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { renderWithTempyBrand } from 'src/components/tempy-brand';

import { TempyPageLayout } from '../tempy-page-layout';
import { TEMPY_GRADIENT } from '../tempy-theme';

// ----------------------------------------------------------------------

export function TempyLegalPage({ title, subtitle, lastUpdated, sections = [] }) {
  const theme = useTheme();

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
            {renderWithTempyBrand(title)}
          </Typography>
          {subtitle && (
            <Typography variant="body1" sx={{ opacity: 0.92, maxWidth: 720 }}>
              {renderWithTempyBrand(subtitle)}
            </Typography>
          )}
          {lastUpdated && (
            <Typography variant="caption" sx={{ display: 'block', mt: 2, opacity: 0.8 }}>
              Last updated: {lastUpdated}
            </Typography>
          )}
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ py: { xs: 5, md: 8 } }}>
        <Stack spacing={4}>
          {sections.map((section) => (
            <Box
              key={section.title}
              sx={{
                p: { xs: 2.5, md: 3 },
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: alpha(theme.palette.background.paper, 0.9),
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5 }}>
                {renderWithTempyBrand(section.title)}
              </Typography>

              <Stack spacing={1.25}>
                {section.paragraphs?.map((paragraph, index) => (
                  <Typography key={index} variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                    {renderWithTempyBrand(paragraph)}
                  </Typography>
                ))}

                {section.bullets?.length > 0 && (
                  <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                    {section.bullets.map((item) => (
                      <Typography
                        key={item}
                        component="li"
                        variant="body2"
                        sx={{ color: 'text.secondary', lineHeight: 1.8, mb: 0.75 }}
                      >
                        {renderWithTempyBrand(item)}
                      </Typography>
                    ))}
                  </Box>
                )}
              </Stack>
            </Box>
          ))}
        </Stack>
      </Container>
    </TempyPageLayout>
  );
}
