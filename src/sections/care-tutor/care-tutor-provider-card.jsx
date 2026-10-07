import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { CARE_TUTOR_PROVIDER_META } from './care-tutor-data';

// ----------------------------------------------------------------------

export function CareTutorProviderCard({ settings, onSync }) {
  const provider = CARE_TUTOR_PROVIDER_META;
  const connected = settings?.accountLinked !== false;

  return (
    <Card
      sx={{
        p: 2.5,
        borderRadius: 2,
        border: (theme) => `1px solid ${theme.vars.palette.success.main}`,
        bgcolor: (theme) => theme.vars.palette.success.lighter,
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
      >
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'success.main',
              color: 'common.white',
              flexShrink: 0,
            }}
          >
            <Iconify icon={provider.icon} width={28} />
          </Box>

          <Box>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="h6">{provider.name}</Typography>
              <Label variant="soft" color={connected ? 'success' : 'default'}>
                {connected ? 'Connected' : 'Not connected'}
              </Label>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {provider.tagline}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
              Last sync: {settings?.lastSync || '—'} · Tempy commission: {settings?.commissionPercent ?? 10}%
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} flexShrink={0}>
          {onSync ? (
            <Button
              size="small"
              variant="outlined"
              color="success"
              startIcon={<Iconify icon="eva:refresh-fill" />}
              onClick={onSync}
            >
              Sync
            </Button>
          ) : null}
          <Button
            size="small"
            variant="contained"
            color="success"
            href={provider.portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            startIcon={<Iconify icon="eva:external-link-fill" />}
          >
            Open portal
          </Button>
        </Stack>
      </Stack>
    </Card>
  );
}
