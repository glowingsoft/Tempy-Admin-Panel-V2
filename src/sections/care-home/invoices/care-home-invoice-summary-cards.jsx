import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Unstable_Grid2';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { fCurrency } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function CareHomeInvoiceSummaryCards({ cards, activeFilter, onFilter }) {
  return (
    <Grid container spacing={2} sx={{ mb: { xs: 3, md: 4 } }}>
      {cards.map((card) => {
        const isActive = activeFilter === card.value;

        return (
          <Grid key={card.value} xs={12} sm={6} md={4}>
            <Card
              component="button"
              type="button"
              onClick={() => onFilter?.(card.value)}
              variant="outlined"
              sx={{
                p: 2.5,
                width: '100%',
                textAlign: 'left',
                borderRadius: 2.5,
                cursor: 'pointer',
                border: (theme) =>
                  `2px solid ${isActive ? theme.vars.palette[card.color].main : theme.vars.palette.divider}`,
                bgcolor: isActive ? `${card.color}.lighter` : 'background.paper',
                transition: (theme) => theme.transitions.create(['border-color', 'box-shadow', 'background-color']),
                '&:hover': {
                  borderColor: `${card.color}.main`,
                  boxShadow: (theme) => theme.customShadows?.z8,
                },
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: `${card.color}.lighter`,
                    color: `${card.color}.dark`,
                    flexShrink: 0,
                  }}
                >
                  <Iconify icon={card.icon} width={22} />
                </Box>

                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h4" sx={{ lineHeight: 1.1 }}>
                    {card.count}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ mt: 0.25 }}>
                    {card.label}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {fCurrency(card.amount)}
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}
