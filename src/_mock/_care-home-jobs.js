// Care Home — posted / created jobs mock data

import { addDays, addHours, format } from 'date-fns';

import { _mock } from './_mock';

export const CARE_HOME_JOB_TABS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

function relSchedule(hoursFromNow, durationHours = 8) {
  const start = addHours(new Date(), hoursFromNow);
  const end = addHours(start, durationHours);

  return {
    date: format(start, 'yyyy-MM-dd'),
    startTime: format(start, 'HH:mm'),
    endTime: format(end, 'HH:mm'),
  };
}

function relDate(daysFromNow, startTime = '09:00', endTime = '17:00') {
  const date = format(addDays(new Date(), daysFromNow), 'yyyy-MM-dd');
  return { date, startTime, endTime };
}

/** Built at call-time so Active horizon filters always have upcoming dates. */
export function buildCareHomeJobs() {
  return [
    {
      id: 'ch-job-6h',
      status: 'active',
      receivingBids: true,
      type: 'Senior Care',
      address: '12 Oakwood Lane, Manchester M14 5TP',
      schedules: [{ id: 's1', ...relSchedule(3, 8) }],
      breakIncluded: true,
      breakMins: 30,
      description: 'Urgent senior care cover — starts within the next 6 hours.',
      gender: 'female',
      postedAt: '30 min ago',
      bidCount: 5,
    },
    {
      id: 'ch-job-12h',
      status: 'active',
      receivingBids: true,
      type: 'Nurse',
      address: '45 Riverside Drive, Leeds LS1 4DY',
      schedules: [{ id: 's1', ...relSchedule(8, 8) }],
      breakIncluded: true,
      breakMins: 45,
      description: 'Registered nurse shift starting within 12 hours.',
      gender: 'female',
      postedAt: '2 hours ago',
      bidCount: 3,
    },
    {
      id: 'ch-job-24h',
      status: 'active',
      receivingBids: true,
      type: 'Carer',
      address: '8 Meadow Court, Birmingham B15 2TT',
      schedules: [{ id: 's1', ...relSchedule(18, 8) }],
      breakIncluded: false,
      breakMins: 0,
      description: 'Care assistant needed tomorrow — within 24 hours.',
      gender: 'male',
      postedAt: '4 hours ago',
      bidCount: 1,
    },
    {
      id: 'ch-job-3d',
      status: 'active',
      receivingBids: true,
      type: 'Senior Care',
      address: 'Head Office — London, UK',
      schedules: [
        { id: 's1', ...relDate(2, '08:00', '16:00') },
        { id: 's2', ...relDate(3, '08:00', '16:00') },
      ],
      breakIncluded: true,
      breakMins: 30,
      description: 'Bank senior care — first shift within the next 3 days.',
      gender: 'female',
      postedAt: '1 day ago',
      bidCount: 2,
    },
    {
      id: 'ch-job-7d',
      status: 'active',
      receivingBids: true,
      type: 'Nurse',
      address: 'North Branch — Manchester, UK',
      schedules: [{ id: 's1', ...relDate(5, '14:00', '22:00') }],
      breakIncluded: true,
      breakMins: 30,
      description: 'Night nurse cover later this week — within 7 days.',
      gender: 'female',
      postedAt: '2 days ago',
      bidCount: 4,
    },
    {
      id: 'ch-job-004',
      status: 'active',
      receivingBids: false,
      type: 'Senior Care',
      address: '12 Oakwood Lane, Manchester M14 5TP',
      schedules: [{ id: 's1', ...relDate(10, '09:00', '17:00') }],
      breakIncluded: true,
      breakMins: 30,
      description: 'Weekend senior care cover for a long-term resident.',
      gender: 'female',
      postedAt: '1 week ago',
      bidCount: 8,
      assignedAgency: 'CarePlus Agency',
    },
    {
      id: 'ch-job-005',
      status: 'active',
      receivingBids: false,
      type: 'Nurse',
      address: '22 Hill Street, Liverpool L1 8JQ',
      schedules: [
        { id: 's1', ...relDate(12, '08:00', '16:00') },
        { id: 's2', ...relDate(13, '08:00', '16:00') },
      ],
      breakIncluded: true,
      breakMins: 30,
      description: 'Night nurse support for medication management.',
      gender: 'other',
      postedAt: '2 weeks ago',
      bidCount: 4,
      assignedAgency: 'HealthFirst Staffing',
    },
    {
      id: 'ch-job-006',
      status: 'inactive',
      receivingBids: false,
      type: 'Carer',
      address: '3 Victoria Road, Sheffield S1 2JE',
      schedules: [{ id: 's1', date: '2025-05-30', startTime: '10:00', endTime: '18:00' }],
      breakIncluded: true,
      breakMins: 30,
      description: 'Temporary carer cover — role no longer required.',
      gender: 'female',
      postedAt: '3 weeks ago',
      bidCount: 2,
      assignedAgency: 'SwiftCare Agency',
      review: {
        rating: 4.5,
        comment:
          'Reliable cover throughout the placement. Staff were professional, punctual, and followed the care plan closely.',
        reviewedAt: '1 week ago',
      },
    },
    {
      id: 'ch-job-007',
      status: 'inactive',
      receivingBids: false,
      type: 'Nurse',
      address: '18 Brookfield Avenue, Nottingham NG2 6BT',
      schedules: [{ id: 's1', date: '2025-05-12', startTime: '08:00', endTime: '16:00' }],
      breakIncluded: true,
      breakMins: 30,
      description: 'Short-term nurse cover for medication rounds and wound checks.',
      gender: 'female',
      postedAt: '1 month ago',
      bidCount: 1,
      assignedAgency: 'HealthFirst Staffing',
    },
  ].map((job, index) => ({ ...job, image: job.image || _mock.image.cover(index + 4) }));
}

/** @deprecated Prefer buildCareHomeJobs() for fresh relative dates. */
export const _careHomeJobs = buildCareHomeJobs();
