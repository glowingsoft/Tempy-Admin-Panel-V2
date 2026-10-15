import dayjs from 'dayjs';

import { _mock } from 'src/_mock';
import { getInvoiceNumberPrefix } from 'src/_mock/_invoice';

import { fDate } from 'src/utils/format-time';

const STORAGE_KEY_PREFIX = 'tempy-dashboard-invoices';

const CSV_HEADERS = ['Invoice Number', 'Billed To', 'Issued', 'Due', 'Amount', 'Status', 'Copies'];

function storageKeyForRole(roleKey = 'default') {
  return `${STORAGE_KEY_PREFIX}:${roleKey || 'default'}`;
}

function reviveInvoice(invoice) {
  return {
    ...invoice,
    createDate: invoice.createDate ? new Date(invoice.createDate) : null,
    dueDate: invoice.dueDate ? new Date(invoice.dueDate) : null,
  };
}

function csvCell(value) {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadTextFile(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function parseCsvLine(line) {
  const cells = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  cells.push(current.trim());
  return cells;
}

export function loadStoredInvoices(roleKey = 'default', _defaultInvoices) {
  const key = storageKeyForRole(roleKey);

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) return [];

    // Old agency-style cache stuck on home-care dashboards — reset when prefix mismatches
    const expectedPrefix = getInvoiceNumberPrefix(roleKey);
    const looksWrongRole =
      (roleKey === 'homeCareCompany' || roleKey === 'individualHomeCare') &&
      parsed.some((invoice) => String(invoice?.invoiceNumber || '').startsWith('INV-CH-'));

    if (looksWrongRole) {
      localStorage.removeItem(key);
      return [];
    }

    if (
      expectedPrefix &&
      parsed.length &&
      parsed.every((invoice) => !String(invoice?.invoiceNumber || '').startsWith(expectedPrefix))
    ) {
      localStorage.removeItem(key);
      return [];
    }

    return parsed.map(reviveInvoice);
  } catch {
    return [];
  }
}

export function saveStoredInvoices(invoices, roleKey = 'default') {
  localStorage.setItem(storageKeyForRole(roleKey), JSON.stringify(invoices));
}

export function findStoredInvoice(id, roleKey = 'default', defaultInvoices) {
  return loadStoredInvoices(roleKey, defaultInvoices).find((invoice) => invoice.id === id);
}

export function upsertStoredInvoice(invoice, roleKey = 'default', defaultInvoices) {
  const invoices = loadStoredInvoices(roleKey, defaultInvoices);
  const index = invoices.findIndex((item) => item.id === invoice.id);
  const next =
    index >= 0 ? invoices.map((item, i) => (i === index ? invoice : item)) : [invoice, ...invoices];

  saveStoredInvoices(next, roleKey);
  return next;
}

export function generateInvoiceNumber(invoices = [], roleKey = 'default') {
  const prefix = getInvoiceNumberPrefix(roleKey);
  const existing = new Set(invoices.map((invoice) => invoice.invoiceNumber));
  let counter = invoices.length + 1;

  let invoiceNumber = `${prefix}-${String(counter).padStart(2, '0')}`;
  while (existing.has(invoiceNumber)) {
    counter += 1;
    invoiceNumber = `${prefix}-${String(counter).padStart(2, '0')}`;
  }

  return invoiceNumber;
}

export function buildInvoiceFromForm(data, { currentInvoice, send = false } = {}) {
  const subtotal = data.items.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 0), 0);
  const totalAmount = subtotal - (data.discount || 0) - (data.shipping || 0) + (data.taxes || 0);

  return {
    id: currentInvoice?.id || _mock.id(Date.now()),
    invoiceNumber: data.invoiceNumber,
    createDate: data.createDate,
    dueDate: data.dueDate,
    taxes: data.taxes || 0,
    shipping: data.shipping || 0,
    discount: data.discount || 0,
    status: send ? 'pending' : data.status || 'draft',
    invoiceFrom: data.invoiceFrom,
    invoiceTo: data.invoiceTo,
    items: data.items.map((item, index) => ({
      ...item,
      id: item.id || _mock.id(index + Date.now()),
      total: (item.price || 0) * (item.quantity || 0),
    })),
    subtotal,
    totalAmount,
    sent: send ? 1 : currentInvoice?.sent || 0,
  };
}

export function exportInvoicesCsv(invoices, filename = 'invoices.csv') {
  const rows = invoices.map((invoice) => [
    invoice.invoiceNumber,
    invoice.invoiceTo?.name || '',
    fDate(invoice.createDate) || '',
    fDate(invoice.dueDate) || '',
    invoice.totalAmount ?? 0,
    invoice.status || '',
    invoice.sent ?? 0,
  ]);

  const csv = [CSV_HEADERS, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
  downloadTextFile(csv, filename);
}

export function parseInvoicesCsv(text, existingInvoices = []) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const existingNumbers = new Set(existingInvoices.map((invoice) => invoice.invoiceNumber));

  return lines.slice(1).map((line, index) => {
    const [invoiceNumber, billedTo, issued, due, amount, status, copies] = parseCsvLine(line);
    const safeNumber =
      invoiceNumber && !existingNumbers.has(invoiceNumber)
        ? invoiceNumber
        : generateInvoiceNumber([...existingInvoices]);

    existingNumbers.add(safeNumber);

    const parsedAmount = Number.parseFloat(String(amount).replace(/[^0-9.-]/g, '')) || 0;

    return reviveInvoice({
      id: _mock.id(Date.now() + index),
      invoiceNumber: safeNumber,
      createDate: issued ? dayjs(issued).toDate() : new Date(),
      dueDate: due ? dayjs(due).toDate() : dayjs().add(14, 'day').toDate(),
      taxes: 0,
      discount: 0,
      shipping: 0,
      subtotal: parsedAmount,
      totalAmount: parsedAmount,
      status: status || 'draft',
      sent: Number.parseInt(copies, 10) || 0,
      items: [],
      invoiceFrom: _invoices[0]?.invoiceFrom,
      invoiceTo: {
        name: billedTo || 'Imported recipient',
        company: billedTo || 'Imported recipient',
        email: 'accounts@example.co.uk',
        phone: '+44 20 7946 0958',
        address: 'Imported address',
      },
    });
  });
}

export function printInvoices() {
  window.print();
}
