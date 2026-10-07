import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import {
  RATE_SLOTS,
  RATE_STATUS,
  HIRE_STATUS,
  formatSpecialDayDate,
} from './supplier-relationship-utils';

// ----------------------------------------------------------------------

function PartyCard({ title, party }) {
  return (
    <Stack spacing={1}>
      <Typography variant="overline" color="text.secondary">
        {title}
      </Typography>
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar src={party.avatarUrl} alt={party.name}>
          {party.name?.charAt(0).toUpperCase()}
        </Avatar>
        <Stack spacing={0.25} sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap>
            {party.name}
            {party.typeLabel && (
              <Typography component="span" variant="caption" color="text.secondary">
                {' '}
                · {party.typeLabel}
              </Typography>
            )}
          </Typography>
          {party.email && (
            <Typography variant="body2" color="text.secondary" noWrap>
              {party.email}
            </Typography>
          )}
          {party.phone && (
            <Typography variant="body2" color="text.secondary">
              {party.phone}
            </Typography>
          )}
        </Stack>
      </Stack>
    </Stack>
  );
}

function DetailRow({ label, children }) {
  return (
    <Stack direction="row" justifyContent="space-between" spacing={2}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" component="div" sx={{ textAlign: 'right' }}>
        {children}
      </Typography>
    </Stack>
  );
}

function DetailsDialog({ title, onClose, children }) {
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>{children}</Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

const dateOrDash = (value) => (value ? fDate(value) : '—');

// ----------------------------------------------------------------------

export function AgreedRateDetailsDialog({ row, onClose }) {
  const status = RATE_STATUS[row.status] || RATE_STATUS.pending;

  return (
    <DetailsDialog title="Agreed rate details" onClose={onClose}>
      <PartyCard title="Supplier" party={row.supplier} />
      <PartyCard title="Customer" party={row.customer} />

      <Divider />

      <Stack spacing={1.25}>
        <DetailRow label="Role">
          {row.jobType}
          {row.jobTypeDepartment ? ` (${row.jobTypeDepartment})` : ''}
        </DetailRow>
        {RATE_SLOTS.map((slot) => (
          <DetailRow key={slot.key} label={`${slot.label} rate`}>
            {fCurrency(row.rates[slot.key])}/h
          </DetailRow>
        ))}
        {row.rates.specialDays.map((day) => (
          <DetailRow key={`${day.name}-${day.date}`} label={`${day.name} (${formatSpecialDayDate(day)})`}>
            {fCurrency(day.rate)}/h
          </DetailRow>
        ))}
        <DetailRow label="Starts on">
          {row.effectiveFrom ? fDate(row.effectiveFrom) : 'When the customer accepts'}
        </DetailRow>
        <DetailRow label="Status">
          <Chip size="small" label={status.label} color={status.color} />
        </DetailRow>
        <DetailRow label="Offered on">{dateOrDash(row.createdAt)}</DetailRow>
        <DetailRow label="Responded on">{dateOrDash(row.respondedAt)}</DetailRow>
      </Stack>

      {(row.reviewNote || row.reviewRates) && (
        <>
          <Divider />
          <Stack spacing={1.25}>
            <Typography variant="subtitle2">Review requested</Typography>
            {row.reviewNote && <DetailRow label="Note">{row.reviewNote}</DetailRow>}
            {row.reviewRates &&
              RATE_SLOTS.map((slot) => (
                <DetailRow key={slot.key} label={`Asked ${slot.label.toLowerCase()} rate`}>
                  {fCurrency(row.reviewRates[slot.key])}/h
                </DetailRow>
              ))}
            {row.reviewRates?.specialDays.map((day) => (
              <DetailRow key={`asked-${day.name}-${day.date}`} label={`Asked ${day.name} rate`}>
                {fCurrency(day.rate)}/h
              </DetailRow>
            ))}
            <DetailRow label="Requested on">{dateOrDash(row.reviewRequestedAt)}</DetailRow>
          </Stack>
        </>
      )}
    </DetailsDialog>
  );
}

// ----------------------------------------------------------------------

export function PermanentHireDetailsDialog({ row, onClose }) {
  const status = HIRE_STATUS[row.status] || HIRE_STATUS.pending;
  const isAgencyWorker = row.supplierType !== 'nurse';

  return (
    <DetailsDialog title="Permanent hire details" onClose={onClose}>
      <PartyCard title="Worker" party={row.worker} />

      <Divider />

      <Stack spacing={1.25}>
        <DetailRow label="Care home">{row.customer.name}</DetailRow>
        <DetailRow label="Supplier">{isAgencyWorker ? row.supplier.name : 'Solo nurse'}</DetailRow>
        <DetailRow label="Shifts worked">{row.shiftsWorked}</DetailRow>
        <DetailRow label="Status">
          <Chip size="small" label={status.label} color={status.color} />
        </DetailRow>
        <DetailRow label="Requested on">{dateOrDash(row.createdAt)}</DetailRow>
        <DetailRow label="Responded on">{dateOrDash(row.respondedAt)}</DetailRow>
      </Stack>

      <Typography variant="caption" color="text.secondary">
        Permanent status is a tag with this customer. The worker can hold it with only one
        customer at a time.
      </Typography>
    </DetailsDialog>
  );
}
