import { _mock } from './_mock';

// Platform-registered staff members (Individual Staff Member login) — not yet added to an agency.

const DEFAULT_DOCUMENTS = {
  governmentId: [{ name: 'id-front.pdf', preview: _mock.image.cover(1) }],
  nursingDegree: [{ name: 'nursing-degree.pdf', preview: _mock.image.cover(3) }],
  certifications: [{ name: 'bls-cert.pdf', preview: _mock.image.cover(4) }],
};

export const REGISTERED_STAFF_MEMBERS = [
  {
    id: 'platform-staff-1',
    email: 'nurse@gmail.com',
    name: 'Sarah Mitchell',
    phone: '+447955123456',
    gender: 'Female',
    location: 'Bristol, United Kingdom',
    taxNumber: 'JK123456L',
    avatarUrl: _mock.image.avatar(14),
    documents: DEFAULT_DOCUMENTS,
  },
  {
    id: 'platform-staff-2',
    email: 'emily.ana@email.com',
    name: 'Emily Ana',
    phone: '+447966234567',
    gender: 'Female',
    location: 'London, United Kingdom',
    taxNumber: 'LM789012N',
    avatarUrl: _mock.image.avatar(15),
    documents: DEFAULT_DOCUMENTS,
  },
  {
    id: 'platform-staff-3',
    email: 'mark.john@email.com',
    name: 'Mark John',
    phone: '+447977345678',
    gender: 'Male',
    location: 'Manchester, United Kingdom',
    taxNumber: 'OP345678Q',
    avatarUrl: _mock.image.avatar(16),
    documents: DEFAULT_DOCUMENTS,
  },
  {
    id: 'platform-staff-4',
    email: 'raksy.jesy@email.com',
    name: 'Raksy Jesy',
    phone: '+447988456789',
    gender: 'Female',
    location: 'Leeds, United Kingdom',
    taxNumber: 'RS901234T',
    avatarUrl: _mock.image.avatar(17),
    documents: DEFAULT_DOCUMENTS,
  },
  {
    id: 'platform-staff-5',
    email: 'simy.faup@email.com',
    name: 'Simy Faup',
    phone: '+447999567890',
    gender: 'Female',
    location: 'Birmingham, United Kingdom',
    taxNumber: 'UV567890W',
    avatarUrl: _mock.image.avatar(18),
    documents: DEFAULT_DOCUMENTS,
  },
];

export function getRegisteredStaffByEmail(email) {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return null;

  return REGISTERED_STAFF_MEMBERS.find((member) => member.email.toLowerCase() === normalized) || null;
}
