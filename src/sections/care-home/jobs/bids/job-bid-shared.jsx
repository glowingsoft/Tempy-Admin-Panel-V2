import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { fCurrency } from 'src/utils/format-number';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { formatBidRate, getBidInitials, getBidStatusMeta, getBidSupplierType, getBidAcceptanceLabel } from './job-bid-utils';

// ----------------------------------------------------------------------

export function BidStatusLabel({ bid, sx }) {
  const meta = getBidStatusMeta(bid);
  const label = getBidAcceptanceLabel(bid) || meta.label;

  return (
    <Tooltip title={label.length > 24 ? label : ''}>
      <Label color={meta.color} startIcon={<Iconify icon={meta.icon} />} sx={{ maxWidth: 220, flexShrink: 0, ...sx }}>
        <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.5 }}>
          {label}
        </Box>
      </Label>
    </Tooltip>
  );
}

export function BidSupplierTypeLabel({ bid, sx }) {
  const type = getBidSupplierType(bid);

  return (
    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0, ...sx }}>
      <Iconify icon={type.icon} width={14} sx={{ color: `${type.color}.main` }} />
      <Typography variant="caption" sx={{ fontWeight: 600, color: `${type.color}.dark` }} noWrap>
        {type.label}
      </Typography>
    </Stack>
  );
}

export function BidAvatar({ bid, size = 48, sx }) {
  return (
    <Box sx={{ position: 'relative', flexShrink: 0, ...sx }}>
      <Avatar
        src={bid.avatarUrl || undefined}
        alt={bid.name}
        sx={{
          width: size,
          height: size,
          bgcolor: 'primary.lighter',
          color: 'primary.dark',
          fontSize: size / 3,
          fontWeight: 700,
        }}
      >
        {getBidInitials(bid.name)}
      </Avatar>
      {bid.isFavorite ? (
        <Tooltip title="Favourite">
          <Box
            component="span"
            sx={{
              position: 'absolute',
              right: -2,
              bottom: -2,
              width: 20,
              height: 20,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'background.paper',
              boxShadow: 1,
            }}
          >
            <Iconify icon="eva:heart-fill" width={12} sx={{ color: 'error.main' }} />
          </Box>
        </Tooltip>
      ) : null}
    </Box>
  );
}

export function BidRating({ bid, sx }) {
  const hasReviews = bid.reviews > 0;

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={0.5}
      sx={{ minWidth: 0, ...sx }}
      aria-label={hasReviews ? `Rated ${bid.rating} from ${bid.reviews} reviews` : 'No reviews yet'}
    >
      <Iconify icon="solar:star-bold" width={14} sx={{ color: hasReviews ? 'warning.main' : 'text.disabled' }} />
      <Typography variant="caption" noWrap sx={{ color: 'text.secondary' }}>
        {hasReviews ? (
          <>
            <Box component="span" sx={{ color: 'text.primary', fontWeight: 600 }}>
              {Number(bid.rating).toFixed(1)}
            </Box>{' '}
            ({bid.reviews} review{bid.reviews === 1 ? '' : 's'})
          </>
        ) : (
          'No reviews yet'
        )}
      </Typography>
    </Stack>
  );
}

/** Agreed rate / lowered quote tags. Renders nothing when neither applies. */
export function BidTags({ bid, sx }) {
  if (!bid.hasAgreedRate && !bid.loweredQuote) return null;

  return (
    <Stack direction="row" flexWrap="wrap" gap={0.75} sx={sx}>
      {bid.hasAgreedRate ? (
        <Label color="success" variant="soft" startIcon={<Iconify icon="solar:hand-money-bold" />}>
          {bid.agreedHourlyRate ? `Agreed rate ${fCurrency(bid.agreedHourlyRate)}/h` : 'Agreed rate'}
        </Label>
      ) : null}
      {bid.loweredQuote ? (
        <Label color="warning" variant="soft" startIcon={<Iconify icon="solar:sale-bold" />}>
          Lower quote
        </Label>
      ) : null}
    </Stack>
  );
}

export function BidPrice({ bid, align = 'right', size = 'medium' }) {
  return (
    <Box sx={{ textAlign: align, flexShrink: 0 }}>
      <Typography variant={size === 'large' ? 'h5' : 'h6'} component="p" sx={{ color: 'primary.main', lineHeight: 1.2 }}>
        {fCurrency(bid.totalPrice)}
      </Typography>
      <Typography variant="caption" color="text.secondary" noWrap component="p">
        {formatBidRate(bid)}
        {bid.totalHours ? ` · ${bid.totalHours}h` : ''}
      </Typography>
    </Box>
  );
}

/** Compact identity + price block used at the top of bid dialogs. */
export function BidProfileSummary({ bid, sx }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0, ...sx }}>
      <BidAvatar bid={bid} size={52} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle1" noWrap>
          {bid.name}
        </Typography>
        <Stack direction="row" alignItems="center" flexWrap="wrap" columnGap={1} rowGap={0.5} sx={{ mt: 0.5 }}>
          <BidSupplierTypeLabel bid={bid} />
          <BidRating bid={bid} />
        </Stack>
      </Box>
      <BidPrice bid={bid} />
    </Stack>
  );
}
