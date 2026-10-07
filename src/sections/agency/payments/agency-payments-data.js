/** Tempy platform fee on money collected for home care (no subscription at this stage). */
export const TEMPY_PLATFORM_FEE_RATE = 0.06;

export const INITIAL_CARE_BILLS = [
  {
    id: '1',
    billRef: 'TMPY-HC-260821-0142',
    client: 'Margaret Ellis',
    provider: 'Oakwood Home Care',
    service: 'Home care — 3 day shifts',
    issuedAt: '18 Aug 2026',
    dueAt: '25 Aug 2026',
    paidAt: null,
    gross: 840,
    status: 'awaiting_payment',
    payMethod: null,
  },
  {
    id: '2',
    billRef: 'TMPY-HC-260815-0098',
    client: 'David Chen',
    provider: 'Oakwood Home Care',
    service: 'Home care — overnight support',
    issuedAt: '15 Aug 2026',
    dueAt: '22 Aug 2026',
    paidAt: '20 Aug 2026',
    gross: 620,
    status: 'paid_online',
    payMethod: 'Online (lowest rate)',
  },
  {
    id: '3',
    billRef: 'TMPY-HC-260810-0071',
    client: 'Susan Walsh',
    provider: 'Harbour View Care',
    service: 'Home care — weekdays package',
    issuedAt: '10 Aug 2026',
    dueAt: '17 Aug 2026',
    paidAt: '16 Aug 2026',
    gross: 1120,
    status: 'paid_bank',
    payMethod: 'Bank transfer',
  },
  {
    id: '4',
    billRef: 'TMPY-HC-260801-0033',
    client: 'Peter Grant',
    provider: 'Maple Grove Care',
    service: 'Home care — weekend cover',
    issuedAt: '01 Aug 2026',
    dueAt: '08 Aug 2026',
    paidAt: '07 Aug 2026',
    gross: 390,
    status: 'paid_out',
    payMethod: 'Bank transfer',
    paidOutAt: '09 Aug 2026',
  },
];

export const BILL_STATUS_CONFIG = {
  awaiting_payment: { label: 'Awaiting payment', color: 'warning' },
  paid_online: { label: 'Paid online', color: 'info' },
  paid_bank: { label: 'Paid (bank)', color: 'info' },
  paid_out: { label: 'Paid to provider', color: 'success' },
};

export function feeAmount(gross) {
  return Number((Number(gross) * TEMPY_PLATFORM_FEE_RATE).toFixed(2));
}

export function netToProvider(gross) {
  return Number((Number(gross) - feeAmount(gross)).toFixed(2));
}

export function billStatusMeta(status) {
  return BILL_STATUS_CONFIG[status] || { label: status, color: 'default' };
}

export function isReadyForProviderPayout(bill) {
  return bill?.status === 'paid_online' || bill?.status === 'paid_bank';
}

export function getReadyPayoutBills(bills = []) {
  return bills.filter(isReadyForProviderPayout);
}

export function sumReadyPayout(bills = []) {
  return getReadyPayoutBills(bills).reduce((sum, bill) => sum + netToProvider(bill.gross), 0);
}
