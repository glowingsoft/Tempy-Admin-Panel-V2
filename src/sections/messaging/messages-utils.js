export function createMessageId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createConversationId() {
  return `conv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function formatMessageTime() {
  return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function loadConversations(storageKey, defaultConversations) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return defaultConversations;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : defaultConversations;
  } catch {
    return defaultConversations;
  }
}

export function saveConversations(storageKey, conversations) {
  localStorage.setItem(storageKey, JSON.stringify(conversations));
}

export function filterConversations(conversations, { tab, search }) {
  let rows = conversations;

  if (tab === 'unread') {
    rows = rows.filter((item) => item.unread > 0);
  } else if (tab === 'agency') {
    rows = rows.filter((item) => item.category === 'agency');
  } else if (tab === 'staff') {
    rows = rows.filter((item) => item.category === 'staff');
  } else if (tab === 'care_home') {
    rows = rows.filter((item) => item.category === 'care_home');
  } else if (tab === 'client') {
    rows = rows.filter((item) => item.category === 'client');
  } else if (tab === 'next_of_kin') {
    rows = rows.filter((item) => item.category === 'next_of_kin');
  } else if (tab === 'awaiting') {
    rows = rows.filter((item) => item.awaitingReply);
  }

  if (search.trim()) {
    const query = search.trim().toLowerCase();
    rows = rows.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.subject?.toLowerCase().includes(query) ||
        item.lastMessage.toLowerCase().includes(query) ||
        item.email?.toLowerCase().includes(query) ||
        item.lovedOne?.toLowerCase().includes(query) ||
        item.locationLabel?.toLowerCase().includes(query) ||
        item.relationship?.toLowerCase().includes(query)
    );
  }

  return rows;
}

function looksLikeImageMessage(message = {}) {
  const attachment = message.attachment || {};
  const mimeType = String(attachment.mimeType || message.mimeType || '').toLowerCase();
  if (mimeType.startsWith('image/')) return true;

  const candidates = [
    attachment.url,
    attachment.name,
    message.text,
    message.mediaUrl,
    message.raw?.mediaUrl,
    message.raw?.fileUrl,
    message.raw?.url,
  ];

  return candidates.some((value) =>
    /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i.test(String(value || ''))
  );
}

export function getMessagePreview(message) {
  if (message?.isDeleted || message?.deleted || message?.raw?.isDeleted) {
    return 'This message is deleted';
  }

  const type = message.type || message.messageType || 'text';
  if (type === 'image' || (type === 'file' && looksLikeImageMessage(message))) {
    return 'Image';
  }
  if (type === 'file') return 'File';
  if (type === 'audio' || type === 'voice') return 'Voice message';
  if (type === 'location') {
    if (message.location?.latitude != null && message.location?.longitude != null) {
      return `${message.location.latitude},${message.location.longitude}`;
    }
    return 'Location';
  }
  return message.text || '';
}

export function buildMapsUrl(location = {}) {
  if (location.latitude != null && location.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
  }
  if (location.address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`;
  }
  return '';
}

export function filterThreadMessages(messages, query) {
  if (!query.trim()) return messages;
  const q = query.trim().toLowerCase();
  return messages.filter((message) => {
    const text = message.text?.toLowerCase() || '';
    const name = message.attachment?.name?.toLowerCase() || '';
    const location =
      message.location?.latitude != null && message.location?.longitude != null
        ? `${message.location.latitude},${message.location.longitude}`.toLowerCase()
        : '';
    return text.includes(q) || name.includes(q) || location.includes(q);
  });
}

export function getConversationAttachments(messages = []) {
  return messages
    .filter((message) => !message?.isDeleted && !message?.deleted)
    .filter((message) => message.type && message.type !== 'text')
    .map((message) => ({
      id: message.id,
      type: message.type,
      name:
        message.attachment?.name ||
        (message.type === 'image'
          ? 'Photo'
          : message.type === 'audio' || message.type === 'voice'
            ? 'Voice message'
          : message.type === 'location'
            ? message.location?.latitude != null && message.location?.longitude != null
              ? `${message.location.latitude},${message.location.longitude}`
              : 'Location'
            : 'Attachment'),
      url:
        message.attachment?.url ||
        (message.type === 'location' ? buildMapsUrl(message.location) : undefined),
      size: message.attachment?.size,
      mimeType: message.attachment?.mimeType,
      duration: message.attachment?.duration,
      at: message.at,
    }));
}

export function createConversation({ name, email, subject, category }) {
  const trimmedName = name.trim();
  return {
    id: createConversationId(),
    category,
    name: trimmedName,
    email: email?.trim() || `${trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '')}@email.com`,
    subject: subject?.trim() || 'General enquiry',
    avatar: trimmedName.charAt(0).toUpperCase(),
    online: true,
    unread: 0,
    awaitingReply: false,
    lastMessage: 'Start a conversation',
    lastAt: 'Just now',
    messages: [],
  };
}

export function createGroupConversation({ name, avatarUrl }) {
  const trimmedName = name.trim();
  return {
    id: createConversationId(),
    category: 'group',
    isGroup: true,
    name: trimmedName,
    avatar: trimmedName.charAt(0).toUpperCase(),
    avatarUrl: avatarUrl || '',
    online: false,
    unread: 0,
    awaitingReply: false,
    lastMessage: 'Group created',
    lastAt: 'Just now',
    messages: [],
  };
}

function patchConversation(conversation, message, { incrementUnread = false } = {}) {
  const preview = getMessagePreview(message);
  const isIncoming = message.sender === 'them';

  return {
    ...conversation,
    unread: incrementUnread && isIncoming ? (conversation.unread || 0) + 1 : isIncoming ? conversation.unread : 0,
    awaitingReply: false,
    lastMessage: preview,
    lastAt: message.at,
    messages: [...conversation.messages, message],
  };
}

export function appendMessage(conversations, conversationId, text) {
  const trimmed = text.trim();
  if (!trimmed) return conversations;

  const now = formatMessageTime();
  const message = {
    id: createMessageId(),
    sender: 'me',
    type: 'text',
    text: trimmed,
    at: now,
    status: 'sent',
  };

  return conversations.map((conversation) =>
    conversation.id === conversationId ? patchConversation(conversation, message) : conversation
  );
}

export function appendChatMessage(conversations, conversationId, messageData) {
  const now = formatMessageTime();
  const message = {
    id: createMessageId(),
    sender: 'me',
    at: now,
    status: 'sent',
    ...messageData,
  };

  return conversations.map((conversation) =>
    conversation.id === conversationId ? patchConversation(conversation, message) : conversation
  );
}

export function appendIncomingMessage(conversations, conversationId, messageData, { incrementUnread = false } = {}) {
  const now = formatMessageTime();
  const message = {
    id: createMessageId(),
    sender: 'them',
    type: 'text',
    at: now,
    ...messageData,
  };

  return conversations.map((conversation) =>
    conversation.id === conversationId
      ? patchConversation(conversation, message, { incrementUnread })
      : conversation
  );
}

export function markConversationRead(conversations, conversationId) {
  return conversations.map((conversation) =>
    conversation.id === conversationId ? { ...conversation, unread: 0 } : conversation
  );
}

export function updateLastOutgoingStatus(conversations, conversationId, status) {
  return conversations.map((conversation) => {
    if (conversation.id !== conversationId) return conversation;

    const messages = [...conversation.messages];
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (messages[index].sender === 'me') {
        messages[index] = { ...messages[index], status };
        break;
      }
    }

    return { ...conversation, messages };
  });
}

export function markOutgoingMessagesRead(conversations, conversationId) {
  return conversations.map((conversation) =>
    conversation.id === conversationId
      ? {
          ...conversation,
          messages: conversation.messages.map((message) =>
            message.sender === 'me' ? { ...message, status: 'read' } : message
          ),
        }
      : conversation
  );
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function openAttachmentInNewTab(url) {
  const targetUrl = String(url || '').trim();
  if (!targetUrl) return false;

  window.open(targetUrl, '_blank', 'noopener,noreferrer');
  return true;
}

export async function downloadAttachmentFile(url, filename = 'attachment') {
  const targetUrl = String(url || '').trim();
  const safeName = String(filename || 'attachment').trim() || 'attachment';

  if (!targetUrl) return false;

  const triggerDownload = (href, name) => {
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = name;
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  try {
    const response = await fetch(targetUrl);
    if (!response.ok) throw new Error('Download failed');

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    triggerDownload(blobUrl, safeName);
    URL.revokeObjectURL(blobUrl);
    return true;
  } catch {
    triggerDownload(targetUrl, safeName);
    return true;
  }
}
