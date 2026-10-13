import { useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';

import { getProfileUserId } from 'src/sections/account/account-profile-utils';
import { readPersistedAuthToken } from 'src/auth/utils/auth-token-storage';

function resolveSocketUrl() {
  const fromEnv = String(import.meta.env.VITE_SOCKET_URL || '').trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  const apiBase = String(import.meta.env.VITE_BASE_URL || '').trim().replace(/\/$/, '');
  if (!apiBase) return '';

  const host = apiBase.replace(/\/api\/v\d+$/i, '');
  return `${host}/chat`;
}

function resolveChatSubjectId(user, impersonation) {
  if (impersonation?.isActive && impersonation?.targetId) {
    return String(impersonation.targetId).trim();
  }

  return String(getProfileUserId(user) || '').trim();
}

function pickPayloadMessageId(payload = {}) {
  return String(
    payload?.messageId ||
      payload?.message?._id ||
      payload?.message?.id ||
      payload?._id ||
      payload?.id ||
      ''
  ).trim();
}

function isDeleteAction(payload = {}) {
  const action = String(
    payload?.action || payload?.type || payload?.event || payload?.status || payload?.chatState || ''
  )
    .trim()
    .toLowerCase();

  return (
    action === 'delete' ||
    action === 'deleted' ||
    action === 'message_deleted' ||
    action === 'messagedeleted' ||
    action === 'delete_message' ||
    action === 'deletemessage' ||
    action === 'conversation_deleted' ||
    action === 'conversationdeleted' ||
    action === 'chat_deleted' ||
    action === 'chatdeleted' ||
    action === 'delete_conversation' ||
    action === 'deleteconversation' ||
    payload?.isDeleted === true ||
    payload?.deleted === true ||
    Boolean(payload?.deletedAt) ||
    Boolean(payload?.messageDeleted) ||
    Boolean(payload?.conversationDeleted)
  );
}

function isConversationDeletePayload(payload = {}) {
  const action = String(payload?.action || payload?.type || payload?.event || '')
    .trim()
    .toLowerCase();

  if (action.includes('conversation') || action.includes('chat_deleted') || action.includes('chatdeleted')) {
    return true;
  }

  if (payload?.conversationDeleted || payload?.chatDeleted) return true;

  const messageId = pickPayloadMessageId(payload);
  return !messageId && Boolean(payload?.conversationId || payload?.conversation?._id || payload?.conversation?.id);
}

export function useConversationsSocket({
  enabled = true,
  subjectId = '',
  objectId = '',
  onMessage,
  onChatUpdated,
  onMessageDeleted,
  onConversationDeleted,
  onOnlineStatus,
  onConnect,
} = {}) {
  const socketRef = useRef(null);
  const objectIdRef = useRef(objectId);
  const subjectIdRef = useRef(subjectId);

  const onMessageRef = useRef(onMessage);
  const onChatUpdatedRef = useRef(onChatUpdated);
  const onMessageDeletedRef = useRef(onMessageDeleted);
  const onConversationDeletedRef = useRef(onConversationDeleted);
  const onOnlineStatusRef = useRef(onOnlineStatus);
  const onConnectRef = useRef(onConnect);

  onMessageRef.current = onMessage;
  onChatUpdatedRef.current = onChatUpdated;
  onMessageDeletedRef.current = onMessageDeleted;
  onConversationDeletedRef.current = onConversationDeleted;
  onOnlineStatusRef.current = onOnlineStatus;
  onConnectRef.current = onConnect;
  objectIdRef.current = objectId;

  const { user } = useSelector((state) => state.user);
  const impersonation = useSelector((state) => state.impersonation);

  const resolvedSubjectId = subjectId || resolveChatSubjectId(user, impersonation);
  subjectIdRef.current = resolvedSubjectId;

  useEffect(() => {
    const normalizedSubjectId = String(resolvedSubjectId || '').trim();
    const normalizedObjectId = String(objectId || '').trim();

    if (!enabled || !normalizedSubjectId || !normalizedObjectId) return undefined;

    const socketUrl = resolveSocketUrl();
    if (!socketUrl) return undefined;

    const token =
      user?.token ||
      readPersistedAuthToken() ||
      (impersonation?.isActive ? impersonation?.adminToken : '');

    if (!token) return undefined;

    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      auth: { token },
      query: {
        subjectId: normalizedSubjectId,
        objectId: normalizedObjectId,
        token,
      },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    const routeDeletePayload = (payload, source) => {
      if (!isDeleteAction(payload)) return false;

      if (isConversationDeletePayload(payload)) {
        onConversationDeletedRef.current?.(payload, source);
        return true;
      }

      onMessageDeletedRef.current?.(payload, source);
      return true;
    };

    const handleReceiveMessage = (payload) => {
      if (routeDeletePayload(payload, 'receiveMessage')) return;
      onMessageRef.current?.(payload, 'receiveMessage');
    };

    const handleChatUpdated = (payload) => {
      if (routeDeletePayload(payload, 'chatUpdated')) return;
      onChatUpdatedRef.current?.(payload, 'chatUpdated');
    };

    const handleMessageDeleted = (payload) => {
      onMessageDeletedRef.current?.(payload, 'messageDeleted');
    };

    const handleConversationDeleted = (payload) => {
      onConversationDeletedRef.current?.(payload, 'conversationDeleted');
    };

    const handleOnlineStatus = (payload) => {
      onOnlineStatusRef.current?.(payload);
    };

    const handleUserOnline = (payload) => {
      onOnlineStatusRef.current?.(payload, true);
    };

    const handleUserOffline = (payload) => {
      onOnlineStatusRef.current?.(payload, false);
    };

    const handleConnect = () => {
      onConnectRef.current?.({
        subjectId: normalizedSubjectId,
        objectId: normalizedObjectId,
      });
    };

    const handleVisible = () => {
      if (document.visibilityState !== 'visible') return;
      if (!socket.connected) socket.connect();
    };

    socket.on('connect', handleConnect);
    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('newMessage', handleReceiveMessage);
    socket.on('message', handleReceiveMessage);
    socket.on('messageReceived', handleReceiveMessage);
    socket.on('chatUpdated', handleChatUpdated);
    socket.on('messageDeleted', handleMessageDeleted);
    socket.on('deleteMessage', handleMessageDeleted);
    socket.on('messagesDeleted', handleMessageDeleted);
    socket.on('conversationDeleted', handleConversationDeleted);
    socket.on('chatDeleted', handleConversationDeleted);
    socket.on('deleteConversation', handleConversationDeleted);
    socket.on('userOnline', handleUserOnline);
    socket.on('userOffline', handleUserOffline);
    socket.on('onlineStatus', handleOnlineStatus);
    socket.on('presenceUpdate', handleOnlineStatus);
    document.addEventListener('visibilitychange', handleVisible);
    window.addEventListener('online', handleVisible);

    return () => {
      document.removeEventListener('visibilitychange', handleVisible);
      window.removeEventListener('online', handleVisible);
      socket.off('connect', handleConnect);
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('newMessage', handleReceiveMessage);
      socket.off('message', handleReceiveMessage);
      socket.off('messageReceived', handleReceiveMessage);
      socket.off('chatUpdated', handleChatUpdated);
      socket.off('messageDeleted', handleMessageDeleted);
      socket.off('deleteMessage', handleMessageDeleted);
      socket.off('messagesDeleted', handleMessageDeleted);
      socket.off('conversationDeleted', handleConversationDeleted);
      socket.off('chatDeleted', handleConversationDeleted);
      socket.off('deleteConversation', handleConversationDeleted);
      socket.off('userOnline', handleUserOnline);
      socket.off('userOffline', handleUserOffline);
      socket.off('onlineStatus', handleOnlineStatus);
      socket.off('presenceUpdate', handleOnlineStatus);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [
    enabled,
    impersonation?.adminToken,
    impersonation?.isActive,
    impersonation?.targetId,
    objectId,
    resolvedSubjectId,
    user?.token,
  ]);

  const emitDeleteMessage = useCallback((payload = {}) => {
    const socket = socketRef.current;
    const messageId = String(payload.messageId || payload._id || '').trim();
    if (!socket || !messageId) return false;

    const body = {
      messageId,
      _id: messageId,
      id: messageId,
      conversationId: String(payload.conversationId || '').trim(),
      objectId: String(payload.objectId || objectIdRef.current || '').trim(),
      subjectId: String(payload.subjectId || subjectIdRef.current || '').trim(),
      action: 'delete',
      type: 'messageDeleted',
      event: 'messageDeleted',
      deleted: true,
      isDeleted: true,
    };

    // Tempy mobile/web primarily listen on these room events.
    socket.emit('chatUpdated', body);
    socket.emit('receiveMessage', body);
    socket.emit('deleteMessage', body);
    socket.emit('messageDeleted', body);
    return Boolean(socket.connected);
  }, []);

  const emitDeleteConversation = useCallback((payload = {}) => {
    const socket = socketRef.current;
    const conversationId = String(payload.conversationId || payload._id || payload.id || '').trim();
    if (!socket || !conversationId) return false;

    const body = {
      conversationId,
      _id: conversationId,
      id: conversationId,
      objectId: String(payload.objectId || objectIdRef.current || '').trim(),
      subjectId: String(payload.subjectId || subjectIdRef.current || '').trim(),
      action: 'delete',
      type: 'conversationDeleted',
      event: 'conversationDeleted',
      deleted: true,
      isDeleted: true,
      conversationDeleted: true,
    };

    socket.emit('chatUpdated', body);
    socket.emit('deleteConversation', body);
    socket.emit('conversationDeleted', body);
    socket.emit('chatDeleted', body);
    return Boolean(socket.connected);
  }, []);

  return {
    socketRef,
    emitDeleteMessage,
    emitDeleteConversation,
  };
}
