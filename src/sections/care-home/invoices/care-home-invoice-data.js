import { addDays, subDays } from 'date-fns';

// ----------------------------------------------------------------------

export const AUTO_CHARGE_DAYS = 7;

export const SHIFT_PAYMENT_STATUS = {
  scheduled: { label: 'Auto-charge pending', color: 'warning' },
  paid: { label: 'Paid', color: 'success' },
};

const AGENCIES = [
  'CarePlus Agency',
  'Prime Health Services',
  'Jaosh Care Agency',
  'NorthStar Care Staffing',
];

const WORKERS = [
  { id: 'w-01', name: 'Amira Khan' },
  { id: 'w-02', name: 'James Okonkwo' },
  { id: 'w-03', name: 'Priya Sharma' },
  { id: 'w-04', name: 'Daniel Walsh' },
  { id: 'w-05', name: 'Sophie Ellis' },
];

const SHIFT_TITLES = [
  'Night shift cover',
  'Weekend RN cover',
  'Morning HCA shift',
  'Emergency cover',
  'Bank holiday staffing',
];

export function getShiftChargeDate(completedAt) {
  return addDays(new Date(completedAt), AUTO_CHARGE_DAYS);
}

export function resolveShiftPaymentStatus(payment, from = new Date()) {
  const chargeDate = payment.chargeDate || getShiftChargeDate(payment.completedAt);
  if (from.getTime() >= new Date(chargeDate).getTime()) return 'paid';
  return 'scheduled';
}

export const CARE_HOME_INVOICES = [...Array(8)].map((_, index) => {
  const worker = WORKERS[index % WORKERS.length];
  const agency = AGENCIES[index % AGENCIES.length];
  const hours = [8, 12, 6, 10][index % 4];
  const hourlyRate = [18.5, 21, 16.75, 19][index % 4];
  const amount = Number((hours * hourlyRate).toFixed(2));
  const completedAt = subDays(new Date(), index * 4 + 1);
  const chargeDate = getShiftChargeDate(completedAt);
  const status = resolveShiftPaymentStatus({ completedAt, chargeDate });

  const invoiceNumber = `PAY-${String(index + 1).padStart(3, '0')}`;

  return {
    id: invoiceNumber,
    invoiceNumber,
    shiftRef: `SH-${2400 + index}`,
    shiftTitle: SHIFT_TITLES[index % SHIFT_TITLES.length],
    hours,
    hourlyRate,
    totalAmount: amount,
    staffType: 'occasional',
    worker: { id: worker.id, name: worker.name },
    agency: { id: `ag-00${(index % 4) + 1}`, name: agency },
    completedAt,
    shiftDate: completedAt,
    chargeDate,
    paidAt: status === 'paid' ? chargeDate : null,
    paymentStatus: status,
    cardLast4: '4242',
    nonAttendance: false,
  };
});

export const PAYMENT_FLOW_STEPS = [
  {
    key: 'shift',
    label: 'Shift completed',
    description: 'Occasional staff finished the booked shift',
    icon: 'solar:calendar-check-bold',
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
