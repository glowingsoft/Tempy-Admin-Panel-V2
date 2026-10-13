import { fDateTime } from 'src/utils/format-time';

import { getProfileUserId } from 'src/sections/account/account-profile-utils';
import { resolveProfileAssetUrl } from 'src/store/Reducer/upload-api';


function pickId(...values) {
  for (const value of values) {
    if (value == null || value === '') continue;
    if (typeof value === 'object') {
      if (value.$oid) return String(value.$oid).trim();
      const nested = pickId(value._id, value.id, value.messageId);
      if (nested) return nested;
      continue;
    }
    const text = String(value).trim();
    if (text && text !== '[object Object]') return text;
  }
  return '';
}

/** Prefer API messageId fields over join-table `_id` when both exist. */
export function resolveMessageDocumentId(message = {}) {
  const raw = message?.raw && typeof message.raw === 'object' ? message.raw : {};
  const nestedMessage =
    (raw.message && typeof raw.message === 'object' ? raw.message : null) ||
    (message.message && typeof message.message === 'object' ? message.message : null) ||
    {};

  return pickId(
    raw._id,
    message._id,
    nestedMessage._id,
    nestedMessage.id,
    message.messageId,
    raw.messageId,
    raw.message_id,
    nestedMessage.messageId,
    raw.id,
    message.id
  );
}

export function isMongoObjectId(value = '') {
  return /^[a-f\d]{24}$/i.test(String(value || '').trim());
}

function isTruthyFlag(value) {
  if (value === true || value === 1) return true;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
  }
  return false;
}

export function isDeletedMessage(item = {}) {
  const raw = item?.raw && typeof item.raw === 'object' ? item.raw : item;
  if (
    isTruthyFlag(item?.isDeleted) ||
    isTruthyFlag(item?.is_deleted) ||
    isTruthyFlag(raw?.isDeleted) ||
    isTruthyFlag(raw?.is_deleted)
  ) {
    return true;
  }
  if (item?.deleted === true || raw?.deleted === true) return true;
  if (item?.deletedAt || raw?.deletedAt) return true;

  const status = String(
    item?.status || item?.messageStatus || raw?.status || raw?.messageStatus || ''
  )
    .trim()
    .toLowerCase();

  return status === 'deleted' || status === 'removed' || status === 'inactive';
}

export const DELETED_MESSAGE_LABEL = 'This message is deleted';

function pickText(...values) {
  for (const value of values) {
    const text = String(value ?? '').trim();
    if (text) return text;
  }
  return '';
}

export function extractConversationsList(response) {
  const raw = response?.data ?? response;
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.docs)) return raw.docs;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.conversations)) return raw.conversations;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(response)) return response;
  return [];
}

export function extractMessagesList(response) {
  const raw = response?.data ?? response;
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.docs)) return raw.docs;
  if (Array.isArray(raw?.messages)) return raw.messages;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(response)) return response;
  return [];
}

function resolveParticipantUser(participant = {}) {
  const user = participant?.user && typeof participant.user === 'object' ? participant.user : participant;
  const basic = user?.basicInfo && typeof user.basicInfo === 'object' ? user.basicInfo : {};

  const id = pickId(
    participant?._id,
    participant?.id,
    participant?.userId,
    user?._id,
    user?.id,
    basic?._id,
    basic?.id
  );

  const name = pickText(
    participant?.name,
    participant?.chatName,
    user?.name,
    basic?.name,
    user?.displayName,
    basic?.email,
    user?.email
  );

  const profileIcon = pickText(participant?.profileIcon, user?.profileIcon, basic?.profileIcon);
  const email = pickText(participant?.email, user?.email, basic?.email);
  const userType = pickText(
    participant?.userType,
    user?.userType,
    user?.accountState?.userType,
    basic?.userType
  );

  return { id, name, email, profileIcon, profileIconUrl: resolveProfileAssetUrl(profileIcon), userType };
}

export function resolveConversationPeer(conversation = {}, currentUserId = '') {
  const chatName = pickText(
    conversation?.chatName,
    conversation?.chat_name,
    conversation?.participantName,
    conversation?.objectName,
    conversation?.receiverName
  );

  const participants = Array.isArray(conversation?.participants)
    ? conversation.participants
    : Array.isArray(conversation?.users)
      ? conversation.users
      : [];

  const mapped = participants.map(resolveParticipantUser).filter((item) => item.id);

  if (!mapped.length) {
    const fallbackId = pickId(
      conversation?.objectId,
      conversation?.participantId,
      conversation?.receiverId,
      conversation?.otherUserId
    );
    const fallbackName = pickText(
      chatName,
      conversation?.name,
      conversation?.title
    );
    if (fallbackId) {
      return {
        id: fallbackId,
        name: fallbackName,
        email: pickText(conversation?.email, conversation?.participantEmail),
        profileIcon: pickText(conversation?.profileIcon, conversation?.avatar),
        profileIconUrl: resolveChatIconUrl(
          pickText(conversation?.chatIcon, conversation?.chat_icon, conversation?.profileIcon, conversation?.avatar, conversation?.avatarUrl)
        ),
        userType: pickText(conversation?.userType, conversation?.participantType),
      };
    }
    return {
      id: '',
      name: fallbackName,
      email: '',
      profileIcon: '',
      profileIconUrl: resolveProfileAssetUrl(pickText(conversation?.avatarUrl)),
      userType: pickText(conversation?.userType),
    };
  }

  const selfId = String(currentUserId || '').trim();
  const peer =
    mapped.find((item) => item.id && item.id !== selfId) ||
    mapped[0];

  if (!peer) {
    return { id: '', name: chatName, email: '', profileIcon: '', profileIconUrl: '', userType: '' };
  }

  return {
    ...peer,
    name: pickText(chatName, peer.name),
    profileIconUrl:
      peer.profileIconUrl ||
      resolveChatIconUrl(
        pickText(conversation?.chatIcon, conversation?.chat_icon, conversation?.profileIcon, conversation?.avatar, conversation?.avatarUrl)
      ),
  };
}

function mapMessageTypeFromApi(messageType = 'text') {
  return normalizeMessageType(messageType);
}

export function normalizeMessageType(messageType = 'text') {
  const raw = String(messageType || 'text').trim().toLowerCase();
  if (raw === 'audio' || raw === 'voice') return 'audio';
  if (raw === 'location' || raw === 'map' || raw === 'geo' || raw === 'geolocation') {
    return 'location';
  }
  if (raw === 'file' || raw === 'image') return 'file';
  return 'text';
}

/** Normalize + validate lat/lng for send/receive. Returns null if invalid. */
export function normalizeLocationCoords(input = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const latitude = Number(
    source.latitude ?? source.lat ?? (Array.isArray(source) ? source[1] : undefined)
  );
  const longitude = Number(
    source.long ?? source.longitude ?? source.lng ?? source.lon ?? (Array.isArray(source) ? source[0] : undefined)
  );

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;

  // Keep useful precision without float noise.
  return {
    latitude: Number(latitude.toFixed(7)),
    longitude: Number(longitude.toFixed(7)),
  };
}

function parseCoordinatePair(value = '') {
  const text = String(value || '').trim();
  if (!text) return null;

  const exact = text.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  const trailing = exact || text.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (!trailing) return null;

  return normalizeLocationCoords({
    latitude: trailing[1],
    longitude: trailing[2],
  });
}

function parseLocationFromMapsUrl(value = '') {
  const text = String(value || '').trim();
  if (!text) return null;

  const queryMatch = text.match(/[?&](?:q|query)=([^&]+)/i);
  if (queryMatch?.[1]) {
    const decoded = decodeURIComponent(queryMatch[1].replace(/\+/g, ' '));
    const coords = parseCoordinatePair(decoded);
    if (coords) return { ...coords, address: decoded };
  }

  const atMatch = text.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (atMatch) {
    return {
      latitude: Number(atMatch[1]),
      longitude: Number(atMatch[2]),
      address: text,
    };
  }

  return null;
}

export function resolveLocationFromApi(item = {}) {
  const nested =
    (item?.location && typeof item.location === 'object' ? item.location : null) ||
    (item?.geo && typeof item.geo === 'object' ? item.geo : null) ||
    (item?.coordinates && typeof item.coordinates === 'object' && !Array.isArray(item.coordinates)
      ? item.coordinates
      : null) ||
    {};

  const coordsArray = Array.isArray(item?.coordinates)
    ? item.coordinates
    : Array.isArray(nested?.coordinates)
      ? nested.coordinates
      : [];

  const latitude = Number(
    nested.latitude ?? nested.lat ?? item.latitude ?? item.lat ?? coordsArray[1]
  );
  const longitude = Number(
    nested.long ??
      nested.longitude ??
      nested.lng ??
      nested.lon ??
      item.long ??
      item.longitude ??
      item.lng ??
      item.lon ??
      coordsArray[0]
  );

  const title = pickText(
    nested.title,
    nested.name,
    item.locationTitle,
    item.title,
    'Shared location'
  );
  const address = pickText(
    nested.address,
    nested.fullAddress,
    item.address,
    item.locationAddress,
    item.messageContent,
    item.content,
    item.text
  );

  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    return { title, address, latitude, longitude };
  }

  const fromMedia = parseLocationFromMapsUrl(
    pickText(item.mediaUrl, item.mediaURL, item.fileUrl, item.url)
  );
  if (fromMedia) {
    return {
      title,
      address: pickText(address, fromMedia.address),
      latitude: fromMedia.latitude,
      longitude: fromMedia.longitude,
    };
  }

  const fromText = parseCoordinatePair(
    pickText(item.messageContent, item.content, item.text, item.body, item.mediaUrl)
  );
  if (fromText) {
    return { title, address, ...fromText };
  }

  if (String(item?.messageType || item?.type || '').toLowerCase() === 'location' && address) {
    return { title, address, latitude: null, longitude: null };
  }

  return null;
}

export function formatLocationMessageContent(location = {}) {
  if (location.latitude != null && location.longitude != null) {
    return `${location.latitude},${location.longitude}`;
  }
  return '';
}

export function buildLocationMapsLink(location = {}) {
  if (location.latitude != null && location.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
  }
  if (location.address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`;
  }
  return '';
}

function inferAttachmentName(messageType, attachmentName, contentUrl) {
  if (attachmentName) return attachmentName;
  if (messageType === 'audio') return 'Voice message';
  if (messageType === 'file') {
    const fileName = String(contentUrl || '').split('/').pop()?.split('?')[0];
    return fileName || 'attachment';
  }
  return 'attachment';
}

function isImageAttachment(attachment = {}) {
  const mimeType = String(attachment.mimeType || '').toLowerCase();
  if (mimeType.startsWith('image/')) return true;
  const url = String(attachment.url || '').toLowerCase();
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i.test(url);
}

function resolveMessageTimeLabel(item = {}) {
  return pickText(
    item?.timesince,
    item?.timeSince,
    item?.createdAt ? fDateTime(item.createdAt) : '',
    item?.updatedAt ? fDateTime(item.updatedAt) : ''
  );
}

function formatLastMessagePreview(messageType, text) {
  const type = normalizeMessageType(messageType);
  if (type === 'text') return text || 'No messages yet';
  if (type === 'audio') return 'Voice message';
  if (type === 'location') return 'Location';
  if (type === 'image') return 'Image';
  if (type === 'file') {
    const value = String(text || '');
    if (/\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i.test(value) || value.startsWith('image/')) {
      return 'Image';
    }
    return 'File';
  }
  return text || 'Message';
}

function parseOnlineStatus(value) {
  if (value === true || value === 1 || value === '1') return true;
  if (value === false || value === 0 || value === '0') return false;
  const text = String(value ?? '').trim().toLowerCase();
  if (text === 'true' || text === 'online' || text === 'active' || text === 'available') return true;
  if (text === 'false' || text === 'offline' || text === 'inactive' || text === 'away') return false;
  return false;
}

export function parseOnlineStatusFromApi(value) {
  return parseOnlineStatus(value);
}

function resolveConversationOnlineStatus(item = {}, peer = {}) {
  const participant = item?.participant && typeof item.participant === 'object' ? item.participant : {};
  const user = item?.user && typeof item.user === 'object' ? item.user : {};

  const candidates = [
    item?.isOnline,
    item?.online,
    item?.is_online,
    item?.onlineStatus,
    item?.userOnline,
    participant?.isOnline,
    participant?.online,
    user?.isOnline,
    user?.online,
    peer?.isOnline,
    peer?.online,
  ];

  for (const value of candidates) {
    if (value === undefined || value === null || value === '') continue;
    return parseOnlineStatus(value);
  }

  const chatState = String(item?.chatState || item?.chat_state || '').trim().toLowerCase();
  if (chatState === 'online') return true;
  if (chatState === 'offline') return false;

  return false;
}

function resolveChatIconUrl(chatIcon = '') {
  const raw = pickText(chatIcon);
  if (!raw) return '';
  return resolveProfileAssetUrl(raw);
}

export function mapMessageFromApi(item = {}, currentUserId = '') {
  const senderRaw = item?.sender && typeof item.sender === 'object' ? item.sender : item?.user;
  const sender = resolveParticipantUser(senderRaw || {});
  const senderId = pickId(
    item?.senderId,
    item?.userId,
    item?.subjectId,
    sender?.id,
    senderRaw?._id,
    senderRaw?.id
  );
  const selfId = String(currentUserId || '').trim();
  const isMine =
    Boolean(selfId && senderId && String(senderId) === selfId) ||
    item?.isMine === true ||
    item?.isSender === true ||
    String(item?.senderType || item?.from || '').toLowerCase() === 'self' ||
    (selfId && String(item?.subjectId || '') === selfId);

  const rawType = String(item?.messageType || item?.type || '').trim().toLowerCase();
  let messageType = mapMessageTypeFromApi(rawType);
  const text = pickText(item?.messageContent, item?.content, item?.text, item?.body);
  const mediaUrl = pickText(item?.mediaUrl, item?.mediaURL);
  const location = resolveLocationFromApi(item);

  // Backend may send location as text until native location type ships.
  if (
    messageType === 'text' &&
    location &&
    (location.latitude != null || rawType === 'location' || /shared location|current location/i.test(text))
  ) {
    messageType = 'location';
  }

  const attachmentUrl = resolveProfileAssetUrl(
    pickText(
      mediaUrl,
      item?.fileUrl,
      item?.attachmentUrl,
      item?.url,
      messageType !== 'text' && messageType !== 'location' ? text : ''
    )
  );
  const attachmentName = inferAttachmentName(
    messageType,
    pickText(item?.fileName, item?.attachmentName),
    attachmentUrl
  );

  return {
    id: resolveMessageDocumentId(item) || `msg-${Date.now()}`,
    messageId: resolveMessageDocumentId(item),
    sender: isMine ? 'me' : 'them',
    senderId,
    senderName: pickText(item?.senderName, sender?.name),
    type: messageType,
    messageType,
    text: messageType === 'text' ? text : messageType === 'location' ? formatLocationMessageContent(location || {}) : '',
    at: resolveMessageTimeLabel(item),
    isDeleted: isTruthyFlag(item?.isDeleted) || isTruthyFlag(item?.is_deleted),
    deleted: item?.deleted === true,
    raw: item,
    ...(messageType === 'location' && location
      ? {
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
        }
      : {}),
    ...(messageType === 'file' || messageType === 'audio'
      ? {
          attachment: {
            name: attachmentName,
            url: attachmentUrl,
            size: Number(item?.fileSize) || 0,
            mimeType: pickText(item?.mimeType, item?.contentType),
          },
        }
      : {}),
  };
}

export function mapConversationFromApi(item = {}, currentUserId = '') {
  const conversationId = pickId(item.conversationId, item._id, item.id);
  const objectId = pickId(item.objectId, item.participantId);
  const chatName = pickText(item.chatName, item.chat_name);
  const chatIcon = pickText(item.chatIcon, item.chat_icon);
  const chatState = pickText(item.chatState, item.chat_state, item.action, 'default');
  const conversationType = pickText(item.type, item.conversationType, 'direct');

  const lastRaw =
    item?.lastMessage && typeof item.lastMessage === 'object' && !Array.isArray(item.lastMessage)
      ? item.lastMessage
      : {};

  const lastType = mapMessageTypeFromApi(lastRaw?.messageType || lastRaw?.type);
  const lastText = pickText(
    lastRaw?.mediaUrl,
    lastRaw?.fileUrl,
    lastRaw?.url,
    lastRaw?.mimeType,
    lastRaw?.fileName,
    lastRaw?.messageContent,
    lastRaw?.content,
    lastRaw?.text,
    typeof item?.lastMessage === 'string' ? item.lastMessage : '',
    item?.lastMessageText
  );
  const lastAt = resolveMessageTimeLabel(lastRaw);

  const peer = resolveConversationPeer(item, currentUserId);
  const messagesRaw = extractMessagesList(item?.messages ? { data: item.messages } : item);
  const displayName = pickText(chatName, peer?.name, 'Contact');
  const avatarUrl = chatIcon ? resolveChatIconUrl(chatIcon) : pickText(peer?.profileIconUrl, resolveChatIconUrl(item?.profileIcon));

  const isOnline = resolveConversationOnlineStatus(item, peer);

  return {
    id: conversationId,
    conversationId,
    participantId: objectId || peer?.id,
    objectId: objectId || peer?.id,
    type: conversationType,
    conversationType,
    name: displayName,
    chatName: chatName || displayName,
    chatIcon,
    chatState,
    email: pickText(peer?.email, item?.email),
    avatar: displayName.charAt(0).toUpperCase() || '?',
    avatarUrl,
    isOnline,
    online: isOnline,
    unread: Number(item.unreadCount ?? item.unread ?? 0) || 0,
    canMessage: item.canMessage !== false,
    awaitingReply: false,
    action: String(chatState).toLowerCase(),
    isGroup: conversationType.toLowerCase() === 'group',
    category: inferConversationCategory(peer.userType),
    lastMessage: formatLastMessagePreview(lastType, lastText),
    lastAt,
    lastMessageSenderName: pickText(lastRaw?.senderName),
    messages: sortMessagesChronologically(
      messagesRaw
        .map((message) => mapMessageFromApi(message, currentUserId))
        .filter((message) => message.id)
    ),
    raw: item,
  };
}

function inferConversationCategory(userType = '') {
  const raw = String(userType || '').trim().toLowerCase();
  if (raw === 'user' || raw === 'individual_home_care') return 'client';
  if (raw === 'nurse' || raw === 'staff_member') return 'staff';
  if (raw === 'agency') return 'agency';
  if (raw === 'carehome' || raw === 'care_home') return 'care_home';
  if (raw === 'homecarecompany' || raw === 'home_care_company') return 'agency';
  return 'client';
}

export function buildSendMessagePayload({
  messageType = 'text',
  messageContent,
  mediaUrl,
  conversationType = 'direct',
  conversationId = '',
  participantId = '',
  location,
  latitude,
  longitude,
}) {
  const type = normalizeMessageType(messageType);
  const payload = {
    messageType: type,
    conversationType,
  };

  const resolvedConversationId = String(conversationId || '').trim();
  const resolvedParticipantId = String(participantId || '').trim();

  if (resolvedConversationId) {
    payload.conversationId = resolvedConversationId;
  } else if (resolvedParticipantId) {
    payload.participantId = resolvedParticipantId;
  }

  if (type === 'location') {
    const coords = normalizeLocationCoords({
      ...(location && typeof location === 'object' ? location : {}),
      latitude:
        latitude ??
        (location && typeof location === 'object' ? location.latitude : null),
      longitude:
        longitude ??
        (location && typeof location === 'object' ? location.longitude : null),
    });

    if (!coords) {
      throw new Error('Valid latitude and longitude are required for location messages');
    }

    payload.messageType = 'location';
    payload.latitude = coords.latitude;
    payload.longitude = coords.longitude;
    payload.location = {
      latitude: coords.latitude,
      longitude: coords.longitude,
    };
    payload.messageContent = `${coords.latitude},${coords.longitude}`;
    const mapsLink = String(mediaUrl || '').trim() || buildLocationMapsLink(coords);
    if (mapsLink) {
      payload.mediaUrl = mapsLink;
    }

    return payload;
  }

  const resolvedMediaUrl = String(mediaUrl || messageContent || '').trim();

  if (type === 'text') {
    payload.messageContent = resolvedMediaUrl;
  } else {
    payload.mediaUrl = resolvedMediaUrl;
  }

  return payload;
}

export function resolveSendMessageResponse(response) {
  const data = response?.data ?? response ?? {};
  const conversationId = pickId(
    data?.conversationId,
    data?.conversation?._id,
    data?.conversation?.id,
    data?._id,
    data?.id
  );
  const messageRaw = data?.message || data?.data?.message || data;
  return { conversationId, messageRaw, raw: data };
}

export function buildConversationActionPayload(action = 'default') {
  return { action: String(action || 'default').trim() };
}

function getMessageSortTime(message = {}) {
  const raw = message?.raw || message;
  const value = raw?.createdAt || raw?.updatedAt || message?.at || '';
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export function sortMessagesChronologically(messages = []) {
  return [...messages].sort((a, b) => getMessageSortTime(a) - getMessageSortTime(b));
}

export function isImageFileAttachment(attachment = {}) {
  return isImageAttachment(attachment);
}

export function getCurrentUserIdFromStore(user) {
  return getProfileUserId(user);
}

export function resolveChatCurrentUserId(user, impersonation) {
  if (impersonation?.isActive && impersonation?.targetId) {
    return String(impersonation.targetId).trim();
  }
  return getCurrentUserIdFromStore(user);
}
