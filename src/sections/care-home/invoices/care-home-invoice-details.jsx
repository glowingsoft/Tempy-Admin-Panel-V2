import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Unstable_Grid2';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { AUTO_CHARGE_DAYS, PAYMENT_FLOW_STEPS, SHIFT_PAYMENT_STATUS } from './care-home-invoice-data';

function getFlowStepState(invoice, stepKey) {
  if (stepKey === 'shift') return 'done';
  if (stepKey === 'wait') {
    return invoice.paymentStatus === 'paid' ? 'done' : 'current';
  }
  return invoice.paymentStatus === 'paid' ? 'done' : 'upcoming';
}

function DetailLine({ label, value }) {
  return (
    <Stack direction="row" justifyContent="space-between" spacing={2}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="subtitle2">{value}</Typography>
    </Stack>
  );
}

export function CareHomeInvoiceDetails({ invoice }) {
  const statusMeta = SHIFT_PAYMENT_STATUS[invoice.paymentStatus] || SHIFT_PAYMENT_STATUS.scheduled;

  const flowSteps = PAYMENT_FLOW_STEPS.map((step) => ({
    ...step,
    state: getFlowStepState(invoice, step.key),
  }));

  return (
    <Stack spacing={3}>
      <Alert severity="info" icon={<Iconify icon="solar:card-bold" width={22} />} sx={{ borderRadius: 2 }}>
        Payment is automatic. {AUTO_CHARGE_DAYS} days after the shift, the saved card is charged in £.
        Rating does not stop payment. A poor rating is only for non-attendance.
      </Alert>

      <Card variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography variant="overline" color="text.secondary">
              Shift payment
            </Typography>
            <Typography variant="h4">{invoice.shiftTitle || invoice.invoiceNumber}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {invoice.shiftRef} · Occasional staff
            </Typography>
          </Box>
          <Label variant="soft" color={statusMeta.color} sx={{ typography: 'subtitle2', py: 1, px: 1.5 }}>
            {statusMeta.label}
          </Label>
        </Stack>

        <Grid container spacing={3}>
          <Grid xs={12} md={6}>
            <Stack spacing={1.25}>
              <DetailLine label="Care worker" value={invoice.worker?.name || '—'} />
              <DetailLine label="Agency" value={invoice.agency?.name || '—'} />
              <DetailLine label="Shift date" value={fDate(invoice.shiftDate || invoice.completedAt)} />
              <DetailLine
                label="Hours"
                value={invoice.hours ? `${invoice.hours}h at ${fCurrency(invoice.hourlyRate)}/h` : '—'}
              />
            </Stack>
          </Grid>
          <Grid xs={12} md={6}>
            <Stack spacing={1.25}>
              <DetailLine label="Amount" value={fCurrency(invoice.totalAmount)} />
              <DetailLine label="Card on file" value={`•••• ${invoice.cardLast4 || '4242'}`} />
              <DetailLine
                label={invoice.paymentStatus === 'paid' ? 'Charged on' : 'Charges on'}
                value={fDate(invoice.paidAt || invoice.chargeDate)}
              />
            </Stack>
          </Grid>
        </Grid>
      </Card>

      <Card variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Payment timeline
        </Typography>
        <Stack spacing={2} divider={<Divider flexItem />}>
          {flowSteps.map((step) => (
            <Stack key={step.key} direction="row" spacing={2} alignItems="flex-start">
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor:
                    step.state === 'done'
                      ? 'success.lighter'
                      : step.state === 'current'
                        ? 'warning.lighter'
                        : 'background.neutral',
                  color:
                    step.state === 'done'
                      ? 'success.dark'
                      : step.state === 'current'
                        ? 'warning.dark'
                        : 'text.disabled',
                }}
              >
                <Iconify icon={step.icon} width={20} />
              </Box>
              <Box>
                <Typography variant="subtitle2">{step.label}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {step.description}
                </Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
      </Card>
    </Stack>
  );
}
