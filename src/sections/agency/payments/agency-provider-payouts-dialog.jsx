import { useCallback, useEffect, useMemo, useState } from 'react';

import LoadingButton from '@mui/lab/LoadingButton';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import { fCurrency } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';
import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Scrollbar } from 'src/components/scrollbar';

import {
  TEMPY_PLATFORM_FEE_RATE,
  billStatusMeta,
  feeAmount,
  getReadyPayoutBills,
  netToProvider,
} from './agency-payments-data';


export function AgencyProviderPayoutsDialog({ open, bills = [], onClose, onConfirmPayout }) {
  const readyBills = useMemo(() => getReadyPayoutBills(bills), [bills]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelectedIds(readyBills.map((bill) => bill.id));
  }, [open, readyBills]);

  const selectedBills = useMemo(
    () => readyBills.filter((bill) => selectedIds.includes(bill.id)),
    [readyBills, selectedIds]
  );

  const totals = useMemo(() => {
    const gross = selectedBills.reduce((sum, bill) => sum + Number(bill.gross || 0), 0);
    const fee = selectedBills.reduce((sum, bill) => sum + feeAmount(bill.gross), 0);
    const net = selectedBills.reduce((sum, bill) => sum + netToProvider(bill.gross), 0);
    return { gross, fee, net, count: selectedBills.length };
  }, [selectedBills]);

  const allSelected = readyBills.length > 0 && selectedIds.length === readyBills.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < readyBills.length;

  const handleToggleAll = useCallback(() => {
    setSelectedIds((prev) =>
      prev.length === readyBills.length ? [] : readyBills.map((bill) => bill.id)
    );
  }, [readyBills]);

  const handleToggleOne = useCallback((id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!selectedBills.length) {
      toast.warning('Select at least one bill to pay out');
      return;
    }

    setSubmitting(true);
    try {
      await onConfirmPayout?.(selectedBills.map((bill) => bill.id));
      toast.success(
        `Marked ${selectedBills.length} payout${selectedBills.length === 1 ? '' : 's'} as sent to provider`
      );
      onClose?.(true);
    } catch (err) {
      toast.error(err?.message || 'Could not complete provider payout');
    } finally {
      setSubmitting(false);
    }
  }, [onClose, onConfirmPayout, selectedBills]);

  return (
    <Dialog open={open} onClose={() => onClose?.(false)} fullWidth maxWidth="md" scroll="paper">
      <DialogTitle sx={{ position: 'relative', pr: 6 }}>
        Review provider payouts
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 400 }}>
          Client payments already received by Tempy. Confirm sending the net amount (after{' '}
          {(TEMPY_PLATFORM_FEE_RATE * 100).toFixed(0)}% fee) to each home care provider.
        </Typography>
        <IconButton
          aria-label="Close"
          onClick={() => onClose?.(false)}
          sx={{ position: 'absolute', right: 12, top: 12 }}
        >
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 2.5, pb: 2 }}>
        {!readyBills.length ? (
          <Stack alignItems="center" spacing={1} sx={{ py: 6 }}>
            <Iconify icon="solar:inbox-bold-duotone" width={48} sx={{ color: 'text.disabled' }} />
            <Typography variant="subtitle1">Nothing ready to pay out</Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              When a client pays a care bill (online or bank transfer), it will appear here for
              provider payout.
            </Typography>
          </Stack>
        ) : (
          <Stack spacing={2}>
            <Box
              sx={{
                display: 'grid',
                gap: 1.5,
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              }}
            >
              <SummaryTile label="Selected bills" value={String(totals.count)} />
              <SummaryTile label="Client paid (gross)" value={fCurrency(totals.gross)} />
              <SummaryTile
                label={`Tempy fee (~${(TEMPY_PLATFORM_FEE_RATE * 100).toFixed(0)}%)`}
                value={fCurrency(totals.fee)}
              />
            </Box>

            <Box
              sx={{
                p: 1.5,
                borderRadius: 1.5,
                bgcolor: 'primary.lighter',
                border: (theme) => `1px solid ${theme.vars.palette.primary.light}`,
              }}
            >
              <Typography variant="caption" color="primary.dark" fontWeight={700} display="block">
                Total to send to providers
              </Typography>
              <Typography variant="h4" color="primary.darker">
                {fCurrency(totals.net)}
              </Typography>
            </Box>

            <Scrollbar sx={{ maxHeight: 360 }}>
              <Table size="small" stickyHeader sx={{ minWidth: 720 }}>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={someSelected}
                        checked={allSelected}
                        onChange={handleToggleAll}
                        inputProps={{ 'aria-label': 'Select all ready payouts' }}
                      />
                    </TableCell>
                    <TableCell>Reference</TableCell>
                    <TableCell>Provider</TableCell>
                    <TableCell>Client</TableCell>
                    <TableCell align="right">Gross</TableCell>
                    <TableCell align="right">Fee</TableCell>
                    <TableCell align="right">To provider</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {readyBills.map((bill) => {
                    const checked = selectedIds.includes(bill.id);
                    const status = billStatusMeta(bill.status);
                    return (
                      <TableRow key={bill.id} hover selected={checked}>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={checked}
                            onChange={() => handleToggleOne(bill.id)}
                            inputProps={{ 'aria-label': `Select ${bill.billRef}` }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2">{bill.billRef}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Paid {bill.paidAt || '—'} · {bill.payMethod || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>{bill.provider || 'Home care provider'}</TableCell>
                        <TableCell>{bill.client}</TableCell>
                        <TableCell align="right">{fCurrency(bill.gross)}</TableCell>
                        <TableCell align="right">{fCurrency(feeAmount(bill.gross))}</TableCell>
                        <TableCell align="right">
                          <Typography variant="subtitle2">{fCurrency(netToProvider(bill.gross))}</Typography>
                        </TableCell>
                        <TableCell>
                          <Label variant="soft" color={status.color}>
                            {status.label}
                          </Label>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Scrollbar>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="outlined" color="inherit" onClick={() => onClose?.(false)} disabled={submitting}>
          Cancel
        </Button>
        <LoadingButton
          variant="contained"
          loading={submitting}
          disabled={!selectedBills.length}
          startIcon={<Iconify icon="solar:plain-2-bold" width={18} />}
          onClick={handleConfirm}
        >
          Confirm payout{totals.count ? ` · ${fCurrency(totals.net)}` : ''}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

function SummaryTile({ label, value }) {
  return (
    <Box
      sx={{
        p: 1.25,
        borderRadius: 1.5,
        border: (theme) => `1px solid ${theme.vars.palette.divider}`,
        bgcolor: 'background.neutral',
      }}
    >
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography variant="subtitle1" fontWeight={700}>
        {value}
      </Typography>
    </Box>
  );
}
