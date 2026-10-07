import { MANDATORY_TRAINING_COURSES } from 'src/sections/care-home/compliance/care-home-compliance-data';

// ----------------------------------------------------------------------

/** Sellable courses (Care Tutor catalog placeholder). */
export const CARE_TUTOR_COURSE_CATALOG = MANDATORY_TRAINING_COURSES.map((title, index) => ({
  id: `ct-course-${index + 1}`,
  title,
  durationHours: 1 + (index % 3),
  price: 18 + index * 2.5,
  currency: 'GBP',
  mandatory: true,
  provider: 'CareTutor',
}));

export const CARE_TUTOR_PROVIDER_META = {
  id: 'caretutor',
  name: 'CareTutor',
  tagline: 'CQC mandatory training & Pathway LMS',
  description:
    'Skills for Care endorsed eLearning. Certificates sync to Tempy staff profiles once verified by Care Tutor.',
  portalUrl: 'https://learning.caretutor.org/',
  icon: 'solar:diploma-verified-bold',
  accent: 'success',
};
