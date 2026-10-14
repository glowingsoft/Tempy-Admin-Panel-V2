import { useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import { getProfileUserId } from 'src/sections/account/account-profile-utils';
import { readPersistedAuthToken } from 'src/auth/utils/auth-token-storage';
import {
  getAppSocket,
  onAppSocket,
  onAppSocketReplaced,
  setAppSocketObjectId,
} from 'src/realtime/app-socket';

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

    const token =
      user?.token ||
      readPersistedAuthToken() ||
      (impersonation?.isActive ? impersonation?.adminToken : '');

    if (!token) return undefined;

    setAppSocketObjectId(normalizedObjectId);
    socketRef.current = getAppSocket();

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
      const current = getAppSocket();
      if (current && !current.connected) current.connect();
    };

    const offs = [
      onAppSocket('connect', handleConnect),
      onAppSocket('receiveMessage', handleReceiveMessage),
      onAppSocket('newMessage', handleReceiveMessage),
      onAppSocket('message', handleReceiveMessage),
      onAppSocket('messageReceived', handleReceiveMessage),
      onAppSocket('chatUpdated', handleChatUpdated),
      onAppSocket('messageDeleted', handleMessageDeleted),
      onAppSocket('deleteMessage', handleMessageDeleted),
      onAppSocket('messagesDeleted', handleMessageDeleted),
      onAppSocket('conversationDeleted', handleConversationDeleted),
      onAppSocket('chatDeleted', handleConversationDeleted),
      onAppSocket('deleteConversation', handleConversationDeleted),
      onAppSocket('userOnline', handleUserOnline),
      onAppSocket('userOffline', handleUserOffline),
      onAppSocket('onlineStatus', handleOnlineStatus),
      onAppSocket('presenceUpdate', handleOnlineStatus),
      onAppSocketReplaced((nextSocket) => {
        socketRef.current = nextSocket;
      }),
    ];
    document.addEventListener('visibilitychange', handleVisible);
    window.addEventListener('online', handleVisible);

    if (getAppSocket()?.connected) handleConnect();

    return () => {
      document.removeEventListener('visibilitychange', handleVisible);
      window.removeEventListener('online', handleVisible);
      offs.forEach((off) => off());
      setAppSocketObjectId('');
      socketRef.current = getAppSocket();
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
