import { paths } from 'src/routes/paths';

import { resolveProfileAssetUrl } from 'src/store/Reducer/upload-api';

// ----------------------------------------------------------------------

export function buildDirectChatUrl(messagesPath, participant = {}) {
  const params = new URLSearchParams();
  const id = String(participant.id || participant._id || '').trim();

  if (id) params.set('participantId', id);

  const name = String(participant.name || '').trim();
  if (name) params.set('name', name);

  const email = String(participant.email || '').trim();
  if (email) params.set('email', email);

  const query = params.toString();
  return query ? `${messagesPath}?${query}` : messagesPath;
}

export function getEmployerMessagesPath(mode = 'careHome') {
  if (mode === 'hospital') return paths.dashboard.hospital.messages;
  if (mode === 'user') return paths.dashboard.individualHomeCare.messages;
  if (mode === 'localAuthority') return paths.dashboard.localAuthority.messages;
  return paths.dashboard.messages;
}

export function getBidderMessagesPath(mode = 'agency') {
  if (mode === 'homeCareCompany') return paths.dashboard.homeCareCompany.messages;
  if (mode === 'staffMember') return paths.dashboard.staffMember.messages;
  return paths.dashboard.agency.messages;
}

export function getBidderParticipantFromEmployerBid(bid = {}) {
  const user = bid.user && typeof bid.user === 'object' ? bid.user : {};

  return {
    id: String(bid.userId || user._id || user.id || '').trim(),
    name: bid.name || bid.partnerName || user.name || 'Bidder',
    email: bid.email || user.email || '',
    profileIconUrl: resolveProfileAssetUrl(bid.avatarUrl || user.profileIcon || user.profileIconUrl || ''),
  };
}

export function getPosterParticipantFromAgencyBid(bid = {}) {
  const raw = bid.raw && typeof bid.raw === 'object' ? bid.raw : {};
  const job = raw.job && typeof raw.job === 'object' ? raw.job : {};
  const jobCreator = raw.jobCreator && typeof raw.jobCreator === 'object' ? raw.jobCreator : {};
  const user = job.user && typeof job.user === 'object' ? job.user : {};

  const id = String(
    bid.posterUserId ||
      jobCreator._id ||
      jobCreator.id ||
      user._id ||
      user.id ||
      raw.posterUserId ||
      ''
  ).trim();

  const name =
    bid.posterName ||
    jobCreator.name ||
    user.name ||
    bid.careHome ||
    'Job poster';

  const email = bid.posterEmail || jobCreator.email || user.email || '';
  const profileIcon = bid.posterAvatarUrl || jobCreator.profileIcon || user.profileIcon || '';

  return {
    id,
    name,
    email,
    profileIconUrl: resolveProfileAssetUrl(profileIcon),
  };
}

export function getPosterParticipantFromJob(job = {}) {
  const postedBy = job.postedBy && typeof job.postedBy === 'object' ? job.postedBy : {};
  const raw = job.raw && typeof job.raw === 'object' ? job.raw : {};
  const user = raw.user && typeof raw.user === 'object' ? raw.user : {};
  const jobCreator = raw.jobCreator && typeof raw.jobCreator === 'object' ? raw.jobCreator : {};
  const createdBy = raw.createdBy && typeof raw.createdBy === 'object' ? raw.createdBy : {};

  const id = String(
    postedBy.id ||
      postedBy._id ||
      user._id ||
      user.id ||
      jobCreator._id ||
      jobCreator.id ||
      createdBy._id ||
      createdBy.id ||
      raw.userId ||
      raw.posterUserId ||
      raw.createdById ||
      job.userId ||
      ''
  ).trim();

  const name =
    postedBy.name || user.name || jobCreator.name || createdBy.name || raw.careHomeName || 'Job poster';
  const email = postedBy.email || user.email || jobCreator.email || createdBy.email || '';

  return {
    id,
    name,
    email,
    profileIconUrl: resolveProfileAssetUrl(
      postedBy.avatarUrl || user.profileIcon || jobCreator.profileIcon || createdBy.profileIcon || ''
    ),
  };
}
