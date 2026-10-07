import { ALLEGATION_STATUS, SHIFT_ACTION_STATUS } from './admin-allegations-constants';

export const REPLACEMENT_WORKERS = [
  { id: 'repl-01', name: 'Sophie Turner', role: 'Healthcare Assistant' },
  { id: 'repl-02', name: 'Marcus Webb', role: 'Support Worker' },
  { id: 'repl-03', name: 'Elena Popov', role: 'Registered Nurse' },
  { id: 'repl-04', name: 'Tom Bradley', role: 'Senior Carer' },
];

function futureDate(daysAhead, hour = 9) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

export const SEED_ALLEGATIONS = [
  {
    id: 'alg-001',
    workerId: 'staff-seed-01',
    workerName: 'Amelia Hart',
    workerEmail: 'amelia.hart@example.com',
    employerName: 'Oakwood Care Home',
    allegationType: 'safeguarding',
    description: 'Concern raised by service user family regarding evening care standards.',
    status: ALLEGATION_STATUS.OPEN,
    suspendedAt: '2026-08-28T10:30:00.000Z',
    createdAt: '2026-08-28T10:30:00.000Z',
    updatedAt: '2026-08-28T10:30:00.000Z',
    affectedShifts: [
      {
        id: 'shift-001',
        ref: 'SH-1042',
        date: futureDate(2, 8),
        startTime: '08:00',
        endTime: '16:00',
        role: 'Healthcare Assistant',
        location: 'Oakwood Care Home',
        employerName: 'Oakwood Care Home',
        status: SHIFT_ACTION_STATUS.NEEDS_REALLOCATION,
        replacementWorkerId: null,
        replacementWorkerName: null,
      },
      {
        id: 'shift-002',
        ref: 'SH-1048',
        date: futureDate(5, 14),
        startTime: '14:00',
        endTime: '22:00',
        role: 'Healthcare Assistant',
        location: 'Oakwood Care Home',
        employerName: 'Oakwood Care Home',
        status: SHIFT_ACTION_STATUS.NEEDS_REALLOCATION,
        replacementWorkerId: null,
        replacementWorkerName: null,
      },
    ],
  },
];
