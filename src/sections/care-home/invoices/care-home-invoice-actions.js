import { CARE_HOME_INVOICES, resolveShiftPaymentStatus } from './care-home-invoice-data';

const STORAGE_KEY = 'tempy-employer-shift-payments-v2';

function reviveInvoice(invoice) {
  const completedAt = invoice.completedAt || invoice.shiftDate || invoice.createDate;
  const chargeDate = invoice.chargeDate;
  const amount = Number(invoice.totalAmount);
  const invoiceNumber = invoice.invoiceNumber || invoice.shiftRef || '';
  const revived = {
    ...invoice,
    id: invoice.id || invoiceNumber,
    invoiceNumber,
    completedAt: completedAt ? new Date(completedAt) : null,
    shiftDate: invoice.shiftDate ? new Date(invoice.shiftDate) : completedAt ? new Date(completedAt) : null,
    chargeDate: chargeDate ? new Date(chargeDate) : null,
    paidAt: invoice.paidAt ? new Date(invoice.paidAt) : null,
    createDate: invoice.createDate ? new Date(invoice.createDate) : null,
    dueDate: invoice.dueDate ? new Date(invoice.dueDate) : null,
    worker: invoice.worker || { id: invoice.invoiceTo?.id || '', name: invoice.invoiceTo?.name || '' },
    agency: invoice.agency || { id: invoice.invoiceFrom?.id || '', name: invoice.invoiceFrom?.name || '' },
    staffType: invoice.staffType || 'occasional',
    totalAmount: Number.isFinite(amount) ? amount : Number(invoice.totalPrice) || 0,
  };

  revived.paymentStatus = resolveShiftPaymentStatus(revived);
  if (revived.paymentStatus === 'paid' && !revived.paidAt) {
    revived.paidAt = revived.chargeDate;
  }

  return revived;
}

export function loadCareHomeInvoices() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return CARE_HOME_INVOICES.map(reviveInvoice);
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) {
      return CARE_HOME_INVOICES.map(reviveInvoice);
    }

    const looksLikeShiftPayments = parsed.some(
      (row) =>
        row?.staffType === 'occasional' ||
        row?.shiftRef ||
        row?.paymentStatus === 'scheduled' ||
        row?.paymentStatus === 'paid'
    );
    if (!looksLikeShiftPayments) {
      return CARE_HOME_INVOICES.map(reviveInvoice);
    }

    return parsed.map(reviveInvoice);
  } catch {
    return CARE_HOME_INVOICES.map(reviveInvoice);
  }
}

export function saveCareHomeInvoices(invoices) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
}

export function findCareHomeInvoice(id) {
  const key = String(id || '').trim();
  if (!key || key === 'undefined' || key === 'null') return undefined;

  return loadCareHomeInvoices().find(
    (invoice) => invoice.id === key || invoice.invoiceNumber === key || invoice.shiftRef === key
  );
}

export function getCareHomeInvoiceStats(invoices) {
  const occasional = invoices.filter((invoice) => invoice.staffType !== 'rotating');
  const scheduled = occasional.filter((invoice) => invoice.paymentStatus === 'scheduled');
  const paid = occasional.filter((invoice) => invoice.paymentStatus === 'paid');

  return {
    occasional,
    scheduled,
    paid,
  };
}
