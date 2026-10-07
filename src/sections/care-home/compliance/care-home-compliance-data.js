// Mock data for third-party compliance integrations (TrustID + CareTutor)

export const WORKER_COMPLIANCE_STATUS = {
  completed: { label: 'Completed', color: 'success' },
  pending: { label: 'Pending', color: 'warning' },
};

export const EMPLOYER_COMPLIANCE_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
];

function pickQualificationTitle(item) {
  if (typeof item === 'string') return item.trim();
  return String(item?.title || item?.name || item?.qualification || '').trim();
}

function qualificationHasCertificate(item) {
  if (typeof item === 'string') return Boolean(item.trim());
  const files = item?.files || item?.documents || item?.certificates || [];
  return Boolean(
    item?.hasCertificate ||
      item?.verified ||
      item?.certificateUploaded ||
      item?.file ||
      item?.url ||
      item?.certificateUrl ||
      (Array.isArray(files) && files.length > 0)
  );
}

/** Qualifications employers can see — title only, once a certificate is uploaded. */
export function extractVisibleQualifications(source = {}) {
  const worker = source.worker && typeof source.worker === 'object' ? source.worker : source;
  const raw = worker.qualifications || source.qualifications || [];
  const list = Array.isArray(raw) ? raw : [];

  return list
    .map((item) => ({
      title: pickQualificationTitle(item),
      hasCertificate: qualificationHasCertificate(item),
    }))
    .filter((item) => item.title && item.hasCertificate)
    .map((item) => item.title)
    .filter((title, index, all) => all.indexOf(title) === index);
}

export function resolveWorkerComplianceStatus(source = {}, qualifications = []) {
  const raw = String(source.complianceStatus || '').toLowerCase();
  if (raw === 'completed' || raw === 'complete') return 'completed';
  if (raw === 'pending') return 'pending';
  return qualifications.length ? 'completed' : 'pending';
}

export function mapToEmployerComplianceWorker(item = {}) {
  const qualifications = extractVisibleQualifications(item);
  return {
    id: String(item.id || item._id || ''),
    name: item.name || 'Worker',
    role: item.role || item.specialty || '',
    email: item.email || '',
    avatarUrl: item.avatarUrl || '',
    status: resolveWorkerComplianceStatus(item, qualifications),
    qualifications,
  };
}

export const EMPLOYER_COMPLIANCE_WORKERS = [
  {
    id: 'staff-001',
    name: 'Sarah Mitchell',
    role: 'Senior Carer',
    email: 'sarah.mitchell@carehome.co.uk',
    avatarUrl: '',
    status: 'completed',
    qualifications: ['NVQ Level 3', 'Safeguarding Adults', 'Medication Management'],
  },
  {
    id: 'staff-002',
    name: 'James Okonkwo',
    role: 'Care Assistant',
    email: 'james.okonkwo@carehome.co.uk',
    avatarUrl: '',
    status: 'pending',
    qualifications: ['Care Certificate', 'Manual Handling'],
  },
  {
    id: 'staff-003',
    name: 'Emma Richardson',
    role: 'Night Nurse',
    email: 'emma.richardson@carehome.co.uk',
    avatarUrl: '',
    status: 'pending',
    qualifications: [],
  },
  {
    id: 'staff-004',
    name: 'David Hughes',
    role: 'Care Assistant',
    email: 'david.hughes@carehome.co.uk',
    avatarUrl: '',
    status: 'pending',
    qualifications: ['NVQ Level 2'],
  },
  {
    id: 'staff-005',
    name: 'Priya Sharma',
    role: 'Team Leader',
    email: 'priya.sharma@carehome.co.uk',
    avatarUrl: '',
    status: 'completed',
    qualifications: ['NVQ Level 5', 'Safeguarding Adults', 'Infection Control', 'Fire Safety'],
  },
  {
    id: 'staff-006',
    name: 'Michael Byrne',
    role: 'New Starter',
    email: 'michael.byrne@carehome.co.uk',
    avatarUrl: '',
    status: 'pending',
    qualifications: [],
  },
];

export const COMPLIANCE_PROVIDERS = [
  {
    id: 'trustid',
    name: 'TrustID',
    tagline: 'Identity, Right to Work & DBS verification',
    description: 'Government-certified IDSP for digital identity checks, Right to Work and DBS eligibility.',
    status: 'connected',
    lastSync: '12 min ago',
    icon: 'solar:shield-check-bold',
    accent: 'primary',
    gradient: ['#2065D1', '#103996'],
    stats: [
      { label: 'Checks this month', value: '18' },
      { label: 'Pending review', value: '3' },
      { label: 'Avg. turnaround', value: '~8 min' },
    ],
    features: ['Digital DBS', 'Right to Work', 'ID document validation', 'GuestLink invites'],
    portalUrl: 'https://www.trustid.co.uk/',
  },
  {
    id: 'caretutor',
    name: 'CareTutor',
    tagline: 'CQC mandatory training & Pathway LMS',
    description: 'Skills for Care endorsed eLearning with traffic-light training matrix for inspections.',
    status: 'connected',
    lastSync: '28 min ago',
    icon: 'solar:diploma-verified-bold',
    accent: 'success',
    gradient: ['#118D57', '#065E36'],
    stats: [
      { label: 'Staff enrolled', value: '36' },
      { label: 'Courses active', value: '12' },
      { label: 'Training compliance', value: '91%' },
    ],
    features: ['Traffic light matrix', 'Certification reports', 'Course progress', 'CQC evidence export'],
    portalUrl: 'https://learning.caretutor.org/',
  },
];

export const COMPLIANCE_OVERVIEW_STATS = [
  { label: 'Fully compliant staff', value: '31/36', icon: 'solar:users-group-rounded-bold', color: 'success' },
  { label: 'TrustID checks pending', value: '3', icon: 'solar:user-id-bold', color: 'warning' },
  { label: 'Training overdue', value: '2', icon: 'solar:clock-circle-bold', color: 'error' },
  { label: 'Inspection readiness', value: '88%', icon: 'solar:clipboard-check-bold', color: 'info' },
];

export const MANDATORY_TRAINING_COURSES = [
  'Safeguarding Adults',
  'Medication Management',
  'Fire Safety',
  'Infection Control',
  'Manual Handling',
  'GDPR & Data Protection',
];

export const STAFF_COMPLIANCE = [
  {
    id: 'staff-001',
    name: 'Sarah Mitchell',
    role: 'Senior Carer',
    email: 'sarah.mitchell@carehome.co.uk',
    avatarUrl: null,
    trustId: {
      identity: 'verified',
      identityDate: '12 Jun 2026',
      rightToWork: 'continuous',
      rightToWorkExpiry: null,
      dbs: 'clear',
      dbsLevel: 'Enhanced',
      dbsExpiry: 'Mar 2027',
      checkStatus: 'complete',
    },
    careTutor: {
      overall: 'green',
      completed: 12,
      total: 12,
      overdue: 0,
      courses: {
        'Safeguarding Adults': 'green',
        'Medication Management': 'green',
        'Fire Safety': 'green',
        'Infection Control': 'green',
        'Manual Handling': 'green',
        'GDPR & Data Protection': 'green',
      },
    },
  },
  {
    id: 'staff-002',
    name: 'James Okonkwo',
    role: 'Care Assistant',
    email: 'james.okonkwo@carehome.co.uk',
    avatarUrl: null,
    trustId: {
      identity: 'verified',
      identityDate: '3 Jul 2026',
      rightToWork: 'continuous',
      rightToWorkExpiry: null,
      dbs: 'clear',
      dbsLevel: 'Enhanced',
      dbsExpiry: 'Aug 2026',
      checkStatus: 'complete',
    },
    careTutor: {
      overall: 'amber',
      completed: 10,
      total: 12,
      overdue: 0,
      courses: {
        'Safeguarding Adults': 'green',
        'Medication Management': 'amber',
        'Fire Safety': 'green',
        'Infection Control': 'green',
        'Manual Handling': 'green',
        'GDPR & Data Protection': 'green',
      },
    },
  },
  {
    id: 'staff-003',
    name: 'Emma Richardson',
    role: 'Night Nurse',
    email: 'emma.richardson@carehome.co.uk',
    avatarUrl: null,
    trustId: {
      identity: 'pending',
      identityDate: null,
      rightToWork: 'pending',
      rightToWorkExpiry: null,
      dbs: 'pending',
      dbsLevel: 'Enhanced',
      dbsExpiry: null,
      checkStatus: 'identity_review',
    },
    careTutor: {
      overall: 'green',
      completed: 11,
      total: 12,
      overdue: 0,
      courses: {
        'Safeguarding Adults': 'green',
        'Medication Management': 'green',
        'Fire Safety': 'green',
        'Infection Control': 'green',
        'Manual Handling': 'green',
        'GDPR & Data Protection': 'amber',
      },
    },
  },
  {
    id: 'staff-004',
    name: 'David Hughes',
    role: 'Care Assistant',
    email: 'david.hughes@carehome.co.uk',
    avatarUrl: null,
    trustId: {
      identity: 'verified',
      identityDate: '20 May 2026',
      rightToWork: 'time_limited',
      rightToWorkExpiry: '14 Sep 2026',
      dbs: 'clear',
      dbsLevel: 'Standard',
      dbsExpiry: 'Jan 2027',
      checkStatus: 'complete',
    },
    careTutor: {
      overall: 'red',
      completed: 8,
      total: 12,
      overdue: 2,
      courses: {
        'Safeguarding Adults': 'green',
        'Medication Management': 'red',
        'Fire Safety': 'amber',
        'Infection Control': 'green',
        'Manual Handling': 'red',
        'GDPR & Data Protection': 'green',
      },
    },
  },
  {
    id: 'staff-005',
    name: 'Priya Sharma',
    role: 'Team Leader',
    email: 'priya.sharma@carehome.co.uk',
    avatarUrl: null,
    trustId: {
      identity: 'verified',
      identityDate: '1 Jul 2026',
      rightToWork: 'continuous',
      rightToWorkExpiry: null,
      dbs: 'clear',
      dbsLevel: 'Enhanced',
      dbsExpiry: 'Nov 2026',
      checkStatus: 'complete',
    },
    careTutor: {
      overall: 'green',
      completed: 12,
      total: 12,
      overdue: 0,
      courses: {
        'Safeguarding Adults': 'green',
        'Medication Management': 'green',
        'Fire Safety': 'green',
        'Infection Control': 'green',
        'Manual Handling': 'green',
        'GDPR & Data Protection': 'green',
      },
    },
  },
  {
    id: 'staff-006',
    name: 'Michael Byrne',
    role: 'New Starter',
    email: 'michael.byrne@carehome.co.uk',
    avatarUrl: null,
    trustId: {
      identity: 'invited',
      identityDate: null,
      rightToWork: 'pending',
      rightToWorkExpiry: null,
      dbs: 'pending',
      dbsLevel: 'Enhanced',
      dbsExpiry: null,
      checkStatus: 'awaiting_candidate',
    },
    careTutor: {
      overall: 'amber',
      completed: 3,
      total: 12,
      overdue: 0,
      courses: {
        'Safeguarding Adults': 'amber',
        'Medication Management': 'grey',
        'Fire Safety': 'grey',
        'Infection Control': 'grey',
        'Manual Handling': 'grey',
        'GDPR & Data Protection': 'grey',
      },
    },
  },
];

export const COMPLIANCE_ACTIVITY = [
  {
    id: 1,
    provider: 'trustid',
    label: 'DBS check cleared for Sarah Mitchell',
    time: '2 hours ago',
    icon: 'solar:shield-check-bold',
    color: 'success',
  },
  {
    id: 2,
    provider: 'caretutor',
    label: 'Medication Management refresher due for James Okonkwo',
    time: '5 hours ago',
    icon: 'solar:clock-circle-bold',
    color: 'warning',
  },
  {
    id: 3,
    provider: 'trustid',
    label: 'GuestLink sent to Michael Byrne — awaiting identity upload',
    time: 'Yesterday',
    icon: 'solar:letter-bold',
    color: 'info',
  },
  {
    id: 4,
    provider: 'caretutor',
    label: 'David Hughes failed Manual Handling assessment (2nd attempt)',
    time: 'Yesterday',
    icon: 'solar:danger-triangle-bold',
    color: 'error',
  },
  {
    id: 5,
    provider: 'trustid',
    label: 'Right to Work report synced for David Hughes (time-limited)',
    time: '2 days ago',
    icon: 'solar:document-text-bold',
    color: 'warning',
  },
];

export const COMPLIANCE_PRIORITY_ACTIONS = [
  {
    id: 'action-1',
    staffId: 'staff-006',
    label: 'Send TrustID GuestLink to Michael Byrne',
    detail: 'New starter — identity check not started',
    provider: 'TrustID',
    color: 'info',
    action: 'trustid_invite',
  },
  {
    id: 'action-2',
    staffId: 'staff-004',
    label: 'Manual Handling overdue — David Hughes',
    detail: 'CareTutor course failed twice, needs support',
    provider: 'CareTutor',
    color: 'error',
    action: 'caretutor_open',
  },
  {
    id: 'action-3',
    staffId: 'staff-002',
    label: 'Medication Management refresher due',
    detail: 'James Okonkwo — expires in 14 days',
    provider: 'CareTutor',
    color: 'warning',
    action: 'staff_details',
  },
  {
    id: 'action-4',
    staffId: 'staff-003',
    label: 'Emma Richardson — identity in review',
    detail: 'TrustID manual verification pending',
    provider: 'TrustID',
    color: 'warning',
    action: 'staff_details',
  },
];

export const TRAFFIC_LIGHT_META = {
  green: { label: 'Valid', color: 'success' },
  amber: { label: 'Due soon', color: 'warning' },
  red: { label: 'Overdue', color: 'error' },
  grey: { label: 'Not started', color: 'default' },
};

export const TRUSTID_STATUS_META = {
  verified: { label: 'Verified', color: 'success' },
  pending: { label: 'In review', color: 'warning' },
  invited: { label: 'Invited', color: 'info' },
  failed: { label: 'Failed', color: 'error' },
};

export const RTW_STATUS_META = {
  continuous: { label: 'Continuous', color: 'success' },
  time_limited: { label: 'Time-limited', color: 'warning' },
  pending: { label: 'Pending', color: 'info' },
  rejected: { label: 'Rejected', color: 'error' },
};

export const DBS_STATUS_META = {
  clear: { label: 'Clear', color: 'success' },
  pending: { label: 'Pending', color: 'warning' },
  expired: { label: 'Expired', color: 'error' },
};
