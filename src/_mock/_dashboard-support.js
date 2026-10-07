import { AUTH_PUBLIC_LOGIN_ROLE_OPTIONS } from 'src/sections/auth/jwt/auth-role-options';

// ----------------------------------------------------------------------

const SUPPORT_TYPES = AUTH_PUBLIC_LOGIN_ROLE_OPTIONS.map((option) => option.value);

export const DASHBOARD_SUPPORT_ITEMS = [
  {
    id: 'sup-ch-1',
    type: 'care_home',
    subject: 'How do I post a multi-day job?',
    message:
      'Go to Jobs → Add Job, then add each date and time under Date & Time. Each schedule appears separately on agency job cards.',
    status: 'open',
    updatedAt: '2026-07-10T10:00:00.000Z',
  },
  {
    id: 'sup-ch-2',
    type: 'care_home',
    subject: 'Agreed rates vs bidding',
    message:
      'Use Jobs → Agreed rates to save partner rates. On Job Bids you can Smart Assign eligible partners without picking staff manually.',
    status: 'open',
    updatedAt: '2026-07-08T09:30:00.000Z',
  },
  {
    id: 'sup-ag-1',
    type: 'agency',
    subject: 'Can I lower my quote on a bid?',
    message:
      'Yes. Open Bids, edit a pending bid before the deadline, and submit a lower amount to improve your chances of winning the shift.',
    status: 'open',
    updatedAt: '2026-07-11T14:20:00.000Z',
  },
  {
    id: 'sup-ag-2',
    type: 'agency',
    subject: 'Marking staff busy on the rota',
    message:
      'On Shifts, select a staff member and use Mark Busy. Busy days block auto-accept until you clear the availability block.',
    status: 'open',
    updatedAt: '2026-07-09T11:00:00.000Z',
  },
  {
    id: 'sup-hosp-1',
    type: 'hospital_nhs',
    subject: 'Where do I manage shift cover?',
    message:
      'Use Shifts for rotas and Jobs for posting requirements. Compliance holds documents and TrustID status for your trust.',
    status: 'open',
    updatedAt: '2026-07-07T16:45:00.000Z',
  },
  {
    id: 'sup-la-1',
    type: 'local_authority',
    subject: 'Payments and invoices overview',
    message:
      'Payments shows recent funding movements. Invoices lists care package and placement invoices linked to your authority.',
    status: 'open',
    updatedAt: '2026-07-06T08:15:00.000Z',
  },
  {
    id: 'sup-ind-1',
    type: 'individual_home_care',
    subject: 'Finding home care support',
    message:
      'Post a job from Jobs, review bids, and use Chat to message shortlisted carers or agencies before confirming cover.',
    status: 'open',
    updatedAt: '2026-07-05T12:00:00.000Z',
  },
  {
    id: 'sup-hcc-1',
    type: 'home_care_company',
    subject: 'Assigning carers to won jobs',
    message:
      'After a bid is accepted, open Active jobs and use Assign Staff for that shift date. Each date shows as its own job card.',
    status: 'open',
    updatedAt: '2026-07-04T13:40:00.000Z',
  },
  {
    id: 'sup-sm-1',
    type: 'staff_member',
    subject: 'Updating availability and bids',
    message:
      'Keep Shifts availability up to date, then place or lower quotes from Bids when you want more work on specific days.',
    status: 'open',
    updatedAt: '2026-07-03T17:10:00.000Z',
  },
  {
    id: 'sup-ch-3',
    type: 'care_home',
    subject: 'Account login help',
    message:
      'If you cannot sign in, reset your password from the login screen. Contact info@tempy.com if your account is marked inactive.',
    status: 'closed',
    updatedAt: '2026-06-28T09:00:00.000Z',
  },
  {
    id: 'sup-ag-3',
    type: 'agency',
    subject: 'Copy and paste shifts',
    message:
      'Right-click a shift to Copy, then right-click an empty day or press Ctrl+V to paste onto the selected cell.',
    status: 'closed',
    updatedAt: '2026-06-26T15:25:00.000Z',
  },
];

export function getSupportTypeLabel(type) {
  return SUPPORT_TYPES.includes(type)
    ? AUTH_PUBLIC_LOGIN_ROLE_OPTIONS.find((option) => option.value === type)?.label || type
    : type || '—';
}

export function getSupportsByType(type) {
  if (!type) return [];
  return DASHBOARD_SUPPORT_ITEMS.filter((item) => item.type === type);
}
