import { _mock } from './_mock';
import {
  buildRelativeShift,
  buildRelativeShiftOnDay,
} from 'src/components/jobs/job-date-filters';

// ----------------------------------------------------------------------

export const AGENCY_JOB_TABS = [
  { value: 'new', label: 'New', color: 'info' },
  { value: 'active', label: 'Active', color: 'success' },
  { value: 'previous', label: 'Previous', color: 'default' },
];

const ACTIVE_DESCRIPTION =
  'Looking for a registered nurse for post-operative home care. Patient requires medication management and vital monitoring.';

const NEW_JOB_POSTERS = [
  { name: 'John Doe', avatarUrl: _mock.image.avatar(2), rating: 4.5, reviewCount: 182 },
  { name: 'Savills Care Home', type: 'care_home', rating: 4.8, reviewCount: 96 },
  { name: 'Emma Wilson', avatarUrl: _mock.image.avatar(6), rating: 4.2, reviewCount: 41 },
  { name: 'David Clark', avatarUrl: _mock.image.avatar(7), rating: 4.6, reviewCount: 73 },
  { name: 'Riverside NHS', type: 'care_home', rating: 4.9, reviewCount: 210 },
  { name: 'Sarah Mitchell', avatarUrl: _mock.image.avatar(8), rating: 4.3, reviewCount: 28 },
  { name: 'Oakwood Care', type: 'care_home', rating: 4.7, reviewCount: 115 },
  { name: 'Michael Brown', avatarUrl: _mock.image.avatar(9), rating: 4.1, reviewCount: 19 },
  { name: 'Green Valley LA', type: 'care_home', rating: 4.4, reviewCount: 64 },
  { name: 'Lisa Anderson', avatarUrl: _mock.image.avatar(10), rating: 4.6, reviewCount: 52 },
];

/** Timing offsets so Urgent / This week / Next week filters all have jobs. */
const NEW_JOB_TIMINGS = [
  { hoursFromNow: 4 }, // urgent
  { hoursFromNow: 10 }, // urgent / this week
  { hoursFromNow: 20 }, // urgent / this week
  { daysFromNow: 1, startTime: '09:00', endTime: '17:00' }, // this week
  { daysFromNow: 2, startTime: '14:00', endTime: '22:00' }, // this week
  { daysFromNow: 3, startTime: '08:00', endTime: '16:00' }, // this week
  { daysFromNow: 7, startTime: '09:00', endTime: '17:00' }, // next week
  { daysFromNow: 8, startTime: '20:00', endTime: '06:00' }, // next week
  { daysFromNow: 9, startTime: '07:00', endTime: '15:00' }, // next week
  { daysFromNow: 10, startTime: '10:00', endTime: '18:00' }, // next week
];

function resolveTiming(timing) {
  if (typeof timing.hoursFromNow === 'number') {
    return buildRelativeShift({
      hoursFromNow: timing.hoursFromNow,
      durationHours: timing.durationHours || 8,
    });
  }
  return buildRelativeShiftOnDay(timing);
}

const NEW_JOB_TEMPLATES = [
  {
    title: 'Senior Care',
    role: 'Registered Nurse',
    shiftType: 'Single Shift',
    distance: '5.1 km away',
    latitude: 39.7817,
    longitude: -89.6501,
    hourlyRate: 15,
    breakType: 'Paid',
    gender: 'Female',
    description: ACTIVE_DESCRIPTION,
    address: '742 Evergreen Terrace, Springfield, IL 62704',
  },
  {
    title: 'Nurse',
    role: 'Healthcare Assistant',
    shiftType: 'Single Shift',
    distance: '3.4 km away',
    latitude: 51.5237,
    longitude: -0.1585,
    hourlyRate: 18,
    breakType: 'Paid',
    gender: 'Female',
    description: ACTIVE_DESCRIPTION,
    address: '221B Baker Street, London, UK',
  },
  {
    title: 'Night Care',
    role: 'Senior Care Assistant',
    shiftType: 'Night Shift',
    distance: '7.2 km away',
    latitude: 38.8977,
    longitude: -77.0365,
    hourlyRate: 22,
    breakType: 'Unpaid',
    gender: 'Male',
    description:
      'Night shift support for elderly patient with dementia. Experience in night care and medication rounds required.',
    address: '1600 Pennsylvania Ave NW, Washington, DC 20500',
  },
  {
    title: 'Home Care',
    role: 'Care Assistant',
    shiftType: 'Single Shift',
    distance: '2.9 km away',
    latitude: 53.4808,
    longitude: -2.2426,
    hourlyRate: 14,
    breakType: 'Paid',
    gender: 'Female',
    description:
      'Personal care and companionship for home-based client. Light housekeeping and meal preparation included.',
    address: '88 Queen Street, Manchester, M1 4BT',
  },
  {
    title: 'Lead Care',
    role: 'Lead Care Assistant',
    shiftType: 'Single Shift',
    distance: '8 km away',
    latitude: 52.4862,
    longitude: -1.8904,
    hourlyRate: 20,
    breakType: 'Paid',
    gender: 'Female',
    description:
      'Lead care assistant needed to supervise a small team during day shifts at a residential facility.',
    address: '14 Park Lane, Birmingham, B1 2HQ',
  },
  {
    title: 'Wound Care',
    role: 'Registered Nurse',
    shiftType: 'Single Shift',
    distance: '10.1 km away',
    latitude: 53.8008,
    longitude: -1.5491,
    hourlyRate: 25,
    breakType: 'Paid',
    gender: 'Male',
    description:
      'Registered nurse for wound dressing changes and post-operative monitoring in a home care setting.',
    address: '55 High Street, Leeds, LS1 4DY',
  },
  {
    title: 'Bank Staff',
    role: 'Care Assistant Days',
    shiftType: 'Bank Shift',
    distance: '4.3 km away',
    latitude: 51.4545,
    longitude: -2.5879,
    hourlyRate: 16,
    breakType: 'Paid',
    gender: 'Female',
    description:
      'Flexible bank staff for day shifts covering sickness and annual leave at a busy care home.',
    address: '3 Church Road, Bristol, BS1 5TR',
  },
  {
    title: 'Palliative',
    role: 'Registered Nurse',
    shiftType: 'Single Shift',
    distance: '6.3 km away',
    latitude: 53.4084,
    longitude: -2.9916,
    hourlyRate: 28,
    breakType: 'Paid',
    gender: 'Female',
    description:
      'Compassionate registered nurse for palliative and end-of-life care support in the community.',
    address: '27 Victoria Road, Liverpool, L1 8JQ',
  },
  {
    title: 'Live-in Care',
    role: 'Live-in Carer',
    shiftType: 'Live-in',
    distance: '13 km away',
    latitude: 50.8225,
    longitude: -0.1372,
    hourlyRate: 19,
    breakType: 'Paid',
    gender: 'Male',
    description:
      'Live-in carer for 2-week placement. Full personal care, mobility support, and overnight assistance.',
    address: '101 Elm Grove, Brighton, BN2 3FA',
  },
  {
    title: 'Deputy Manager',
    role: 'Deputy Manager',
    shiftType: 'Single Shift',
    distance: '6.8 km away',
    latitude: 53.3811,
    longitude: -1.4701,
    hourlyRate: 24,
    breakType: 'Paid',
    gender: 'Female',
    description:
      'Deputy manager cover for weekend shift. Leadership experience in residential care essential.',
    address: '9 Mill Lane, Sheffield, S1 2GU',
  },
];

function buildNewAgencyJobs() {
  const directTiming = buildRelativeShift({ hoursFromNow: 5, durationHours: 8 });

  const fromTemplates = NEW_JOB_TEMPLATES.map((template, index) => {
    const timing = resolveTiming(NEW_JOB_TIMINGS[index % NEW_JOB_TIMINGS.length]);
    return {
      id: `new-${index + 1}`,
      status: 'new',
      postedAt: `${index + 1}h ago`,
      postedBy: NEW_JOB_POSTERS[index % NEW_JOB_POSTERS.length],
      ...template,
      ...timing,
    };
  });

  const extras = Array.from({ length: 8 }, (_, index) => {
    const template = NEW_JOB_TEMPLATES[index % NEW_JOB_TEMPLATES.length];
    const poster = NEW_JOB_POSTERS[(index + 3) % NEW_JOB_POSTERS.length];
    const timing = resolveTiming(NEW_JOB_TIMINGS[(index + 4) % NEW_JOB_TIMINGS.length]);

    return {
      id: `new-extra-${index + 1}`,
      status: 'new',
      postedAt: `${index + 11}h ago`,
      postedBy: poster,
      ...template,
      ...timing,
      title: `${template.title} ${index + 2}`,
    };
  });

  return [
    {
      id: 'direct-request-care-home-001',
      status: 'new',
      title: 'Care Assistant',
      role: 'Care Assistant Days',
      shiftType: 'Single Shift',
      distance: '3.2 km away',
      hourlyRate: 22,
      breakType: 'Paid',
      gender: 'Female',
      description:
        'Agnes and Arthur Care Home needs an experienced care assistant for personal care, mobility support, and medication reminders.',
      address: 'Head Office — London, UK',
      ...directTiming,
      postedAt: 'Just now',
      postedBy: {
        name: 'Agnes and Arthur Care Home',
        type: 'care_home',
        rating: 4.8,
        reviewCount: 96,
      },
      requestFromCareHome: true,
      targetAgencyId: 'ag-001',
      targetAgencyName: 'CarePlus Agency',
    },
    ...fromTemplates,
    ...extras,
  ];
}

export function getAgencyJobs() {
  return [...buildNewAgencyJobs(), ..._agencyJobsStatic].map((job, index) => ({
    ...job,
    image: job.image || _mock.image.cover(index + 8),
  }));
}

const _agencyJobsStatic = [
  {
    id: '4x93f',
    status: 'active',
    title: 'Senior Care',
    role: 'Registered Nurse',
    shiftType: 'Single Shift',
    distance: '5.1 km away',
    latitude: 39.7817,
    longitude: -89.6501,
    hourlyRate: 20,
    breakType: 'Paid',
    schedule: 'Wed May 6, 09:00 AM - 05:00 PM',
    shiftRows: [
      { id: 's1', label: 'May 6 2026 - 09 AM To 05 PM' },
      { id: 's2', label: 'May 8 2026 - 09 AM To 05 PM' },
    ],
    postedAt: '3h ago',
    description: ACTIVE_DESCRIPTION,

    address: '742 Evergreen Terrace, Springfield, IL 62704',
    gender: 'Female',
    postedBy: {
      name: 'John Doe',
      avatarUrl: _mock.image.avatar(2),
      rating: 4.5,
      reviewCount: 55,
    },
    rating: 4.5,
    reviewCount: 55,
    totalPay: 160,
    actionType: 'assignStaff',
    agencyId: 'careplus',
    assignViewMode: 'agency',
    assignShift: {
      categoryId: 'senior-care-days',
      shiftId: '09a-05p',
      date: '2025-06-05',
    },
  },
  {
    id: '4xi82f',
    status: 'active',
    title: 'Nurse',
    role: 'Healthcare Assistant',
    shiftType: 'Multi Shift',
    distance: '3.4 km away',
    latitude: 51.5237,
    longitude: -0.1585,
    hourlyRate: 20,
    breakType: 'Paid',
    schedules: ['Wed May 6, 09:00 AM - 05:00 PM', 'Fri May 8, 09:00 AM - 05:00 PM'],
    shiftRows: [
      { id: 's1', label: 'May 6 2026 - 09 AM To 05 PM' },
      { id: 's2', label: 'May 8 2026 - 09 AM To 05 PM' },
      { id: 's3', label: 'May 10 2026 - 09 AM To 05 PM' },
    ],
    postedAt: '1h ago',
    description: ACTIVE_DESCRIPTION,
    address: '742 Evergreen Terrace, Springfield, IL 62704',
    gender: 'Female',
    postedBy: {
      name: 'Savills Care Home',
      type: 'care_home',
      rating: 4.5,
      reviewCount: 55,
    },
    rating: 4.5,
    reviewCount: 55,
    totalPay: 160,
    actionType: 'viewStaff',
    agencyId: 'careplus',
    assignViewMode: 'calendar',
    assignShifts: {
      categoryId: 'nurse',
      shiftIds: ['09a-05p'],
    },
    assignShift: {
      categoryId: 'nurse',
      shiftId: '09a-05p',
      date: '2025-06-06',
    },
    assignedStaff: [
      { id: 1, name: 'Emily Ana', avatarUrl: _mock.image.avatar(12) },
      { id: 2, name: 'John Mark', avatarUrl: _mock.image.avatar(13) },
      { id: 3, name: 'Simy Faup', avatarUrl: _mock.image.avatar(14) },
    ],
  },
  {
    id: 'active-3',
    status: 'active',
    title: 'Night Care',
    role: 'Senior Care Assistant',
    shiftType: 'Night Shift',
    distance: '7.2 km away',
    latitude: 38.8977,
    longitude: -77.0365,
    hourlyRate: 22,
    breakType: 'Unpaid',
    shiftRows: [
      { id: 's1', label: 'May 13 2026 - 08 PM To 08 AM' },
      { id: 's2', label: 'May 15 2026 - 08 PM To 08 AM' },
    ],
    postedAt: '5h ago',
    description:
      'Night shift support for elderly patient with dementia. Experience in night care required.',
    address: '1600 Pennsylvania Ave NW, Washington, DC 20500',
    gender: 'Male',
    postedBy: {
      name: 'Riverside NHS',
      type: 'care_home',
      rating: 4.9,
      reviewCount: 210,
    },
    rating: 4.9,
    reviewCount: 210,
    totalPay: 176,
    actionType: 'assignStaff',
    agencyId: 'careplus',
    assignViewMode: 'agency',
    assignShift: {
      categoryId: 'night-care',
      shiftId: '08p-08a',
      date: '2025-06-07',
    },
  },
  {
    id: '2p88c',
    status: 'previous',
    title: 'Nurse',
    role: 'Registered Nurse',
    shiftType: 'Single Shift',
    distance: '2.4 km away',
    latitude: 51.5237,
    longitude: -0.1585,
    hourlyRate: 18,
    breakType: 'Paid',
    schedule: 'Mon Apr 28, 09:00 AM - 05:00 PM',
    shiftRows: [{ id: 's1', label: 'Apr 28 2026 - 09 AM To 05 PM' }],
    postedAt: '1w ago',
    description:
      'Registered nurse required for wound care and post-surgery recovery support in a home setting.',
    address: '221B Baker Street, London, UK',
    gender: 'Female',
    postedBy: {
      name: 'Emma Wilson',
      avatarUrl: _mock.image.avatar(6),
      rating: 4.2,
      reviewCount: 41,
    },
  },
  {
    id: '5n33d',
    status: 'previous',
    title: 'Senior Care',
    role: 'Care Assistant',
    shiftType: 'Single Shift',
    distance: '4.8 km away',
    latitude: 38.8977,
    longitude: -77.0365,
    hourlyRate: 16,
    breakType: 'Paid',
    schedule: 'Wed Apr 23, 07:00 AM - 03:00 PM',
    shiftRows: [
      { id: 's1', label: 'Apr 23 2026 - 07 AM To 03 PM' },
      { id: 's2', label: 'Apr 24 2026 - 07 AM To 03 PM' },
    ],
    postedAt: '2w ago',
    description:
      'Day shift senior care role with mobility assistance and personal care support for a care recipient at home.',
    address: '1600 Pennsylvania Ave NW, Washington, DC 20500',
    gender: 'Female',
    postedBy: {
      name: 'David Clark',
      avatarUrl: _mock.image.avatar(7),
      rating: 4.6,
      reviewCount: 73,
    },
  },
  {
    id: 'prev-3',
    status: 'previous',
    title: 'Home Care',
    role: 'Healthcare Assistant',
    shiftType: 'Single Shift',
    distance: '3.9 km away',
    latitude: 53.4808,
    longitude: -2.2426,
    hourlyRate: 15,
    breakType: 'Paid',
    shiftRows: [{ id: 's1', label: 'Apr 15 2026 - 08 AM To 04 PM' }],
    postedAt: '3w ago',
    description:
      'Personal care and companionship for home-based client. Light housekeeping included.',
    address: '88 Queen Street, Manchester, M1 4BT',
    gender: 'Female',
    postedBy: {
      name: 'Oakwood Care',
      type: 'care_home',
      rating: 4.7,
      reviewCount: 115,
    },
  },
  {
    id: 'prev-4',
    status: 'previous',
    title: 'Wound Care',
    role: 'Registered Nurse',
    shiftType: 'Single Shift',
    distance: '8.2 km away',
    latitude: 53.8008,
    longitude: -1.5491,
    hourlyRate: 25,
    breakType: 'Paid',
    shiftRows: [
      { id: 's1', label: 'Apr 10 2026 - 10 AM To 06 PM' },
      { id: 's2', label: 'Apr 12 2026 - 10 AM To 06 PM' },
    ],
    postedAt: '1mo ago',
    description:
      'Registered nurse for wound dressing changes and post-operative monitoring in home care.',
    address: '55 High Street, Leeds, LS1 4DY',
    gender: 'Male',
    postedBy: {
      name: 'Sarah Mitchell',
      avatarUrl: _mock.image.avatar(8),
      rating: 4.3,
      reviewCount: 28,
    },
  },
];

/** Snapshot at module load — prefer getAgencyJobs() for fresh relative New-tab dates. */
export const _agencyJobs = getAgencyJobs();
