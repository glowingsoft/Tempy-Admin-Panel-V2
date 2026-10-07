
function pickId(...values) {
  for (const value of values) {
    if (value == null || value === '') continue;
    if (typeof value === 'object') {
      const nested = value._id || value.id;
      if (nested) return String(nested);
      continue;
    }
    return String(value);
  }
  return '';
}

function pickText(...values) {
  for (const value of values) {
    const text = String(value ?? '').trim();
    if (text) return text;
  }
  return '';
}

function extractNotificationMeta(item = {}) {
  const nested = item.metadata || item.meta || item.data || item.payload || item.reference || {};
  return typeof nested === 'object' && nested !== null ? nested : {};
}

function pickObjectRef(item, type) {
  return String(item.objectType || '').toLowerCase() === type ? pickId(item.objectId) : '';
}

function extractNotificationRefs(item = {}) {
  const meta = extractNotificationMeta(item);

  return {
    bidId: pickId(item.bid, item.bidId, item.bid_id, meta.bid, meta.bidId, meta.bid_id, pickObjectRef(item, 'bid')),
    bookingId: pickId(item.booking, item.bookingId, item.booking_id, meta.booking, meta.bookingId, meta.booking_id, pickObjectRef(item, 'booking')),
    jobId: pickId(item.job, item.jobId, item.job_id, meta.job, meta.jobId, meta.job_id, pickObjectRef(item, 'job')),
    shiftId: pickId(item.shift, item.shiftId, item.shift_id, meta.shift, meta.shiftId, meta.shift_id),
  };
}


export function resolveNotificationPresentation(item = {}) {
  const title = pickText(item.title, item.subject, item.heading, item.name, 'Notification');
  const message = pickText(item.message, item.body, item.description, item.content, item.text, item.details);
  const category = pickText(item.category, item.type, item.notificationType, '');
  const categoryKey = category.toLowerCase();
  const meta = extractNotificationMeta(item);
  const { bidId, bookingId, jobId, shiftId } = extractNotificationRefs(item);

  const eventType = pickText(item.eventType, item.event, item.actionType, meta.eventType, meta.event, meta.actionType, '').toLowerCase();

  const bidStatus = pickText(item.bidStatus, meta.bidStatus, item.bid?.status, meta.bid?.status, '').toLowerCase();

  const isBookingLabel = categoryKey.includes('booking') || eventType.includes('booking') || /new booking/i.test(title);

  const isBidLabel = categoryKey.includes('bid') || eventType.includes('bid') || /new bid|bid received|bid submitted/i.test(title) || /bid.*(received|submitted)/i.test(message);

  const isMessageLabel =
    categoryKey.includes('message') || categoryKey.includes('chat') || eventType.includes('message') || eventType.includes('chat') || /new message/i.test(title);

  if (isMessageLabel) {
    return {
      title,
      message,
      category: category || 'new_message',
      type: 'message',
      kind: 'message',
      requiresAction: false,
    };
  }


  if (categoryKey === 'shift_alert') {
    return {
      title,
      message,
      category,
      type: 'job',
      kind: 'shiftAlert',
      jobId,
      shiftId,
      requiresAction: false,
    };
  }

  const isTermsUpdate = categoryKey.includes('terms') || eventType.includes('terms') || /terms\s*(and|&)\s*conditions|terms of (service|use)/i.test(title);

  if (isTermsUpdate) {
    return {
      title,
      message,
      category: category || 'terms_updated',
      type: 'terms',
      kind: 'termsUpdated',
      requiresAction: false,
    };
  }

  const isJobOffer = categoryKey === 'job_assigned' || /offer/.test(categoryKey) || /offer/.test(eventType) || /(job|shift|booking) offer/i.test(title);

  if (isJobOffer) {
    const offerStatus = String(item.objectStatus || '').trim();
    const stillPending = !offerStatus || offerStatus.toLowerCase() === 'pending';
    return {
      title,
      message,
      category: category || 'job_offer',
      type: 'booking',
      kind: 'jobOffer',
      bookingId,
      offerStatus,
      requiresAction: Boolean(bookingId) && item.canRespond !== false && stillPending,
    };
  }

  const genericBookingCopy = /booking has been created/i.test(message);
  const pendingBidStatus = ['pending', 'submitted', 'open', 'new'].includes(bidStatus);

  const looksLikeMislabeledBid =
    isBookingLabel &&
    !bookingId &&
    (bidId ||
      isBidLabel ||
      eventType.includes('bid') ||
      pendingBidStatus ||
      (genericBookingCopy && (jobId || shiftId || (categoryKey === 'new_booking' && !['accepted', 'approved', 'confirmed'].includes(bidStatus)))));

  if (looksLikeMislabeledBid) {
    return {
      title: 'New Bid Received',
      message: message && !genericBookingCopy ? message : 'An agency has submitted a bid on your job. Review bids and accept one to create a booking.',
      category: 'new_bid',
      type: 'bid',
      kind: 'bid',
      requiresAction: false,
    };
  }

  if (isBookingLabel && bookingId) {
    return {
      title,
      message,
      category: category || 'new_booking',
      type: 'booking',
      kind: 'booking',
      requiresAction: false,
    };
  }

  if (isBidLabel || bidId) {
    return {
      title: title || 'New Bid Received',
      message: message || 'An agency has submitted a bid on your job.',
      category: category || 'new_bid',
      type: 'bid',
      kind: 'bid',
      requiresAction: false,
    };
  }

  return {
    title,
    message,
    category,
    type: pickText(item.type, item.notificationType, item.category, 'general') || 'general',
    kind: categoryKey || 'general',
    requiresAction: true,
  };
}

export function formatNotificationCategoryLabel(category = '') {
  const key = String(category || '').trim();
  if (!key) return '';
  return key
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function isExplicitTrue(value) {
  return value === true || value === 1 || value === '1' || value === 'true';
}

function isExplicitFalse(value) {
  return value === false || value === 0 || value === '0' || value === 'false';
}

export function resolveNotificationReadState(item = {}) {
  if (isExplicitTrue(item.isRead) || isExplicitTrue(item.read) || isExplicitTrue(item.is_read)) {
    return true;
  }
  if (isExplicitFalse(item.isRead) || isExplicitFalse(item.read) || isExplicitFalse(item.is_read)) {
    return false;
  }

  if (isExplicitTrue(item.isUnRead) || isExplicitTrue(item.is_unread)) return false;
  if (isExplicitFalse(item.isUnRead) || isExplicitFalse(item.is_unread)) return true;

  const status = String(item.status || item.actionStatus || item.state || '')
    .trim()
    .toLowerCase();

  if (['read', 'seen', 'viewed'].includes(status)) return true;
  if (['unread', 'new', 'pending'].includes(status)) return false;

  if (item.readAt || item.read_at || item.viewedAt) return true;
  return false;
}

export function readServerUnreadCount(response) {
  const sources = [response?.meta, response?.data, response];
  const keys = ['unreadCount', 'unReadCount', 'unread', 'unRead', 'UnreadCount', 'notificationCount'];

  for (const source of sources) {
    if (!source || typeof source !== 'object' || Array.isArray(source)) continue;
    for (const key of keys) {
      const value = Number(source[key]);
      if (Number.isFinite(value) && value >= 0) return value;
    }
  }

  return null;
}

export function extractNotificationsList(response) {
  const raw = response?.data ?? response;
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.docs)) return raw.docs;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.results)) return raw.results;
  if (Array.isArray(raw?.notifications)) return raw.notifications;
  if (Array.isArray(response)) return response;
  return [];
}

export function normalizeNotificationStatus(value) {
  const raw = String(value || '')
    .trim()
    .toLowerCase();
  if (['accepted', 'accept', 'approved'].includes(raw)) return 'accepted';
  if (['rejected', 'reject', 'declined'].includes(raw)) return 'rejected';
  if (['inactive', 'disabled'].includes(raw)) return 'inactive';
  if (['active', 'enabled'].includes(raw)) return 'active';
  if (['pending', 'unread', 'new'].includes(raw)) return 'pending';
  return raw || 'pending';
}

function offerStatusToNotificationStatus(bookingStatus) {
  const raw = String(bookingStatus || '').toLowerCase();
  if (raw === 'pending') return 'pending';
  if (raw.startsWith('cancelled')) return 'rejected';
  return 'accepted';
}

/**
 * @param {object} item
 * @returns {object}
 */
export function mapNotificationFromApi(item = {}) {
  const id = pickId(item._id, item.id);
  const presentation = resolveNotificationPresentation(item);
  const isRead = resolveNotificationReadState(item);
  const status =
    presentation.kind === 'jobOffer' && presentation.offerStatus
      ? offerStatusToNotificationStatus(presentation.offerStatus)
      : normalizeNotificationStatus(item.status || item.actionStatus || item.state || (isRead ? 'active' : 'pending'));
  const answered = status === 'accepted' || status === 'rejected';

  return {
    id,
    title: presentation.title,
    message: presentation.message,
    type: presentation.type,
    category: presentation.category,
    kind: presentation.kind,
    bookingId: presentation.bookingId || '',
    jobId: presentation.jobId || '',
    shiftId: presentation.shiftId || '',
    requiresAction: presentation.kind === 'jobOffer' ? presentation.requiresAction && !answered : presentation.requiresAction,
    status,
    isUnRead: !isRead,
    isRead,
    createdAt: item.createdAt || item.created_at || item.date || '',
    avatarUrl: pickText(item.avatarUrl, item.image, item.icon, item.sender?.profileIcon, ''),
    senderName: pickText(item.sender?.name, item.user?.name, item.from?.name, ''),
    raw: item,
  };
}

export function buildNotificationReadPayload({ status, markRead = true } = {}) {
  const body = {};

  if (markRead) {
    body.isRead = true;
    body.read = true;
  }

  if (status) body.status = normalizeNotificationStatus(status);

  return body;
}
