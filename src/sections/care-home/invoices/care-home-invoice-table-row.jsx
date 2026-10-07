import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';

import { fCurrency } from 'src/utils/format-number';
import { fDate } from 'src/utils/format-time';

import { Label } from 'src/components/label';

import { SHIFT_PAYMENT_STATUS } from './care-home-invoice-data';

function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function CareHomeInvoiceTableRow({ row, onOpenDetails }) {
  const statusMeta = SHIFT_PAYMENT_STATUS[row.paymentStatus] || SHIFT_PAYMENT_STATUS.scheduled;

  return (
    <TableRow hover sx={{ cursor: 'pointer' }} onClick={onOpenDetails}>
      <TableCell sx={{ whiteSpace: 'normal', verticalAlign: 'top', py: 1.5 }}>
        <Stack spacing={0.25} sx={{ minWidth: 0 }}>
          <Link
            variant="subtitle2"
            onClick={onOpenDetails}
            sx={{ cursor: 'pointer', display: 'block', lineHeight: 1.35 }}
          >
            {row.shiftTitle || row.invoiceNumber}
          </Link>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>
            {row.shiftRef}
            {row.hours ? ` · ${row.hours}h at ${fCurrency(row.hourlyRate)}/h` : ''}
          </Typography>
        </Stack>
      </TableCell>

      <TableCell sx={{ whiteSpace: 'nowrap' }}>{fDate(row.shiftDate || row.completedAt)}</TableCell>

      <TableCell>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Avatar sx={{ width: 32, height: 32, fontSize: 13 }}>{initials(row.worker?.name)}</Avatar>
          <Typography variant="body2" noWrap>
            {row.worker?.name || '—'}
          </Typography>
        </Stack>
      </TableCell>

      <TableCell>
        <Typography variant="body2" noWrap>
          {row.agency?.name || '—'}
        </Typography>
      </TableCell>

      <TableCell>
        <Typography variant="subtitle2">{fCurrency(row.totalAmount)}</Typography>
      </TableCell>

      <TableCell>
        <Stack spacing={0.25}>
          <Label variant="soft" color={statusMeta.color}>
            {statusMeta.label}
          </Label>
          <Typography variant="caption" color="text.secondary">
            {row.paymentStatus === 'paid'
              ? `Charged ${fDate(row.paidAt || row.chargeDate)}`
              : `Charges ${fDate(row.chargeDate)}`}
          </Typography>
        </Stack>
      </TableCell>
    </TableRow>
  );
}
