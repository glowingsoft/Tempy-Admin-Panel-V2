import { addDays } from 'date-fns';

// ----------------------------------------------------------------------

export const AUTO_CHARGE_DAYS = 7;

export const SHIFT_PAYMENT_STATUS = {
  scheduled: { label: 'Auto-charge pending', color: 'warning' },
  paid: { label: 'Paid', color: 'success' },
};

export function getShiftChargeDate(completedAt) {
  return addDays(new Date(completedAt), AUTO_CHARGE_DAYS);
}

export function resolveShiftPaymentStatus(payment, from = new Date()) {
  const chargeDate = payment.chargeDate || getShiftChargeDate(payment.completedAt);
  if (from.getTime() >= new Date(chargeDate).getTime()) return 'paid';
  return 'scheduled';
}

export const PAYMENT_FLOW_STEPS = [
  {
    key: 'shift',
    label: 'Shift completed',
    description: 'Occasional staff finished the booked shift',
    icon: 'solar:check-circle-bold',
  },
  {
    key: 'wait',
    label: '7-day wait',
    description: 'Payment is collected automatically after 7 days',
    icon: 'solar:clock-circle-bold',
  },
  {
    key: 'card',
    label: 'Card charged',
    description: 'The saved employer card is charged in £',
    icon: 'solar:card-bold',
  },
];
