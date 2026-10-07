import { format } from 'date-fns';

import { MANDATORY_TRAINING_COURSES, TRAFFIC_LIGHT_META } from './care-home-compliance-data';

// ----------------------------------------------------------------------

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

export const PROVIDER_PORTAL_URLS = {
  trustid: 'https://www.trustid.co.uk/',
  caretutor: 'https://learning.caretutor.org/',
};

export function openProviderPortal(providerId) {
  const url = PROVIDER_PORTAL_URLS[providerId];
  if (!url) return false;
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}

export function exportCqcComplianceReport(staffList) {
  const dateStamp = format(new Date(), 'yyyy-MM-dd');
  const headers = [
    'Staff Name',
    'Role',
    'Email',
    'Identity Status',
    'Right to Work',
    'DBS Status',
    'DBS Level',
    'TrustID Progress',
    'Training Completed',
    'Training Total',
    'Training Overdue',
    'Overall Training',
  ];

  const rows = staffList.map((row) => [
    row.name,
    row.role,
    row.email || '',
    row.trustId.identity,
    row.trustId.rightToWork,
    row.trustId.dbs,
    row.trustId.dbsLevel || '',
    row.trustId.checkStatus,
    row.careTutor.completed,
    row.careTutor.total,
    row.careTutor.overdue,
    row.careTutor.overall,
  ]);

  const csv = [headers, ...rows].map((line) => line.map(csvCell).join(',')).join('\n');
  downloadTextFile(csv, `cqc-compliance-report-${dateStamp}.csv`);
}

export function exportTrainingMatrix(staffList) {
  const dateStamp = format(new Date(), 'yyyy-MM-dd');
  const headers = ['Staff Name', 'Role', ...MANDATORY_TRAINING_COURSES, 'Overall'];

  const rows = staffList.map((row) => [
    row.name,
    row.role,
    ...MANDATORY_TRAINING_COURSES.map((course) => {
      const status = row.careTutor.courses[course] || 'grey';
      return TRAFFIC_LIGHT_META[status]?.label || status;
    }),
    TRAFFIC_LIGHT_META[row.careTutor.overall]?.label || row.careTutor.overall,
  ]);

  const csv = [headers, ...rows].map((line) => line.map(csvCell).join(',')).join('\n');
  downloadTextFile(csv, `caretutor-training-matrix-${dateStamp}.csv`);
}

export function buildTrustIdInviteUpdate(staff) {
  return {
    ...staff,
    trustId: {
      ...staff.trustId,
      identity: 'invited',
      rightToWork: 'pending',
      dbs: 'pending',
      checkStatus: 'awaiting_candidate',
    },
  };
}
