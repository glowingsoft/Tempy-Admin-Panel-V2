import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { toast } from 'src/components/snackbar';

import { handleApiError } from 'src/store/handleApiError';
import {
  useDeleteConversationMessageMutation,
  useDeleteConversationMutation,
  useGetConversationMessagesQuery,
  useGetConversationsQuery,
  useSendConversationMessageMutation,
  useUpdateConversationActionMutation,
} from 'src/store/Reducer/conversations-api';
import { useUploadAwsFileMutation } from 'src/store/Reducer/upload-api';

import { markConversationRead, getMessagePreview, createMessageId, formatMessageTime } from './messages-utils';
import {
  resolveChatCurrentUserId,
  sortMessagesChronologically,
  normalizeMessageType,
  parseOnlineStatusFromApi,
  resolveMessageDocumentId,
  isMongoObjectId,
  isDeletedMessage,
  buildLocationMapsLink,
  normalizeLocationCoords,
} from './conversations-api-utils';
import { useConversationsSocket } from './use-conversations-socket';


function previewFromMessages(messages = []) {
  const last = messages[messages.length - 1];
  if (!last) return { lastMessage: 'No messages yet', lastAt: '' };
  return {
    lastMessage: getMessagePreview(last) || 'No messages yet',
    lastAt: last.at || '',
  };
}

function isMessageMarkedDeletedInList(messages = [], messageId = '') {
  const id = String(messageId || '').trim();
  if (!id) return false;
  const match = messages.find((message) => resolveMessageDocumentId(message) === id);
  if (!match) return true;
  return isDeletedMessage(match);
}

async function waitForMessageMarkedDeleted(refetchMessages, messageId) {
  const id = String(messageId || '').trim();
  if (!id || typeof refetchMessages !== 'function') return false;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const refreshed = await refetchMessages();
    const messages = sortMessagesChronologically(refreshed?.data?.data || []);
    if (isMessageMarkedDeletedInList(messages, id)) {
      return true;
    }
    if (attempt === 0) {
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }

  return false;
}

function conversationExistsInList(conversations = [], { conversationId = '', objectId = '' } = {}) {
  const id = String(conversationId || '').trim();
  const peerId = String(objectId || '').trim();

  return conversations.some((conversation) => {
    if (
      id &&
      (String(conversation.id) === id || String(conversation.conversationId || '') === id)
    ) {
      return true;
    }

    if (peerId && String(conversation.participantId || conversation.objectId) === peerId) {
      return true;
    }

    return false;
  });
}

export function useConversationsMessaging({ preferredParticipantId = '' } = {}) {
  const { user } = useSelector((state) => state.user);
  const impersonation = useSelector((state) => state.impersonation);
  const currentUserId = resolveChatCurrentUserId(user, impersonation);

  const [localConversations, setLocalConversations] = useState([]);
  const [selectedObjectId, setSelectedObjectId] = useState('');
  const [selectedConversationId, setSelectedConversationId] = useState('');
  const [pendingByObjectId, setPendingByObjectId] = useState({});
  const [sendBusy, setSendBusy] = useState(false);
  const skipSocketRefreshRef = useRef(false);
  const socketRefreshTimerRef = useRef(null);

  const filterVisibleMessages = useCallback((messages = []) => messages || [], []);

  const {
    data: conversationsData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetConversationsQuery(
    { page: 0, limit: 50, currentUserId },
    { skip: !currentUserId, refetchOnMountOrArgChange: 60, refetchOnFocus: false }
  );

  const {
    data: messagesData,
    isFetching: isMessagesFetching,
    refetch: refetchMessages,
  } = useGetConversationMessagesQuery(
    { objectId: selectedObjectId, page: 0, limit: 100, currentUserId },
    { skip: !selectedObjectId || !currentUserId }
  );

  const [sendMessage, { isLoading: isSending }] = useSendConversationMessageMutation();
  const [uploadAwsFile] = useUploadAwsFileMutation();
  const [updateAction] = useUpdateConversationActionMutation();
  const [deleteMessage] = useDeleteConversationMessageMutation();
  const [deleteConversation] = useDeleteConversationMutation();

  useEffect(() => {
    const apiRows = conversationsData?.data || [];

    setLocalConversations((prev) => {
      const prevByParticipant = new Map(
        prev.map((conversation) => [
          String(conversation.participantId || conversation.objectId || '').trim(),
          conversation,
        ])
      );

      const apiParticipantIds = new Set(
        apiRows
          .map((row) => String(row.participantId || row.objectId || '').trim())
          .filter(Boolean)
      );

      const mergedApiRows = apiRows.map((row) => {
        const participantKey = String(row.participantId || row.objectId || '').trim();
        const existing = participantKey ? prevByParticipant.get(participantKey) : null;
        const isActiveThread =
          participantKey && String(participantKey) === String(selectedObjectId);
        const messages = filterVisibleMessages(
          isActiveThread && Array.isArray(existing?.messages) && existing.messages.length
            ? existing.messages
            : row.messages || []
        );
        const preview = previewFromMessages(messages);

        return {
          ...row,
          messages,
          ...(isActiveThread
            ? {
                lastMessage: preview.lastMessage,
                lastAt: preview.lastAt || row.lastAt,
              }
            : {}),
        };
      });

      const orphanDrafts = prev.filter((conversation) => {
        const id = String(conversation.id || '');
        if (!id.startsWith('draft-')) return false;
        const participantKey = String(conversation.participantId || conversation.objectId || '').trim();
        return participantKey && !apiParticipantIds.has(participantKey);
      });

      return [...orphanDrafts, ...mergedApiRows];
    });
  }, [conversationsData?.data, filterVisibleMessages, selectedObjectId]);

  useEffect(() => {
    if (!selectedObjectId) return;
    if (!String(selectedConversationId || '').startsWith('draft-')) return;

    const real = localConversations.find(
      (conversation) =>
        String(conversation.participantId || conversation.objectId) === String(selectedObjectId) &&
        !String(conversation.id || '').startsWith('draft-')
    );
    if (real?.id) {
      setSelectedConversationId(String(real.id));
    }
  }, [localConversations, selectedConversationId, selectedObjectId]);

  useEffect(() => {
    if (preferredParticipantId) return;
    if (selectedObjectId || !localConversations.length) return;
    const first = localConversations[0];
    const objectId = String(first.objectId || first.participantId || '').trim();
    const conversationId = String(first.id || '').trim();
    if (objectId) {
      setSelectedObjectId(objectId);
      if (conversationId) setSelectedConversationId(conversationId);
    }
  }, [localConversations, preferredParticipantId, selectedObjectId]);

  useEffect(() => {
    if (!selectedObjectId || !messagesData?.data) return;

    const nextMessages = sortMessagesChronologically(filterVisibleMessages(messagesData.data));
    const preview = previewFromMessages(nextMessages);

    setLocalConversations((prev) =>
      prev.map((conversation) =>
        String(conversation.participantId || conversation.objectId) === String(selectedObjectId)
          ? {
              ...conversation,
              messages: nextMessages,
              lastMessage: preview.lastMessage,
              lastAt: preview.lastAt || conversation.lastAt,
            }
          : conversation
      )
    );
  }, [filterVisibleMessages, messagesData?.data, selectedObjectId]);

  const updateConversationOnlineStatus = useCallback((matchIds = [], isOnline = false) => {
    const normalizedIds = matchIds.map((value) => String(value || '').trim()).filter(Boolean);
    if (!normalizedIds.length) return;

    setLocalConversations((prev) =>
      prev.map((conversation) => {
        const conversationIds = [
          conversation.id,
          conversation.conversationId,
          conversation.objectId,
          conversation.participantId,
        ]
          .map((value) => String(value || '').trim())
          .filter(Boolean);

        const shouldUpdate = conversationIds.some((id) => normalizedIds.includes(id));
        if (!shouldUpdate) return conversation;

        return { ...conversation, isOnline, online: isOnline };
      })
    );
  }, []);

  const handleOnlineStatus = useCallback(
    (payload = {}, forcedStatus) => {
      const objectId = String(
        payload?.objectId ||
          payload?.participantId ||
          payload?.userId ||
          payload?.senderId ||
          payload?.user?._id ||
          payload?.user?.id ||
          ''
      ).trim();
      const conversationId = String(payload?.conversationId || payload?.conversation?._id || '').trim();

      let isOnline = forcedStatus;
      if (typeof isOnline !== 'boolean') {
        if (payload?.isOnline !== undefined || payload?.online !== undefined) {
          isOnline = parseOnlineStatusFromApi(payload.isOnline ?? payload.online);
        } else if (payload?.status !== undefined) {
          isOnline = parseOnlineStatusFromApi(payload.status);
        }
      }

      if (typeof isOnline !== 'boolean') return;

      updateConversationOnlineStatus([objectId, conversationId], isOnline);
      refetch();
    },
    [refetch, updateConversationOnlineStatus]
  );

  const refreshOpenChat = useCallback(() => {
    if (selectedObjectId) refetchMessages();
    refetch();
  }, [refetch, refetchMessages, selectedObjectId]);

  const handleSocketMessage = useCallback(
    (payload) => {
      if (payload?.isOnline !== undefined || payload?.online !== undefined) {
        handleOnlineStatus(payload);
      }

      refreshOpenChat();
      window.clearTimeout(socketRefreshTimerRef.current);
      socketRefreshTimerRef.current = window.setTimeout(refreshOpenChat, 800);
    },
    [handleOnlineStatus, refreshOpenChat]
  );

  useEffect(() => () => window.clearTimeout(socketRefreshTimerRef.current), []);

  const handleSocketMessageDeleted = useCallback(async () => {
    if (skipSocketRefreshRef.current) return;
    await refetchMessages();
    await refetch();
  }, [refetch, refetchMessages]);

  const handleSocketConversationDeleted = useCallback(async () => {
    if (skipSocketRefreshRef.current) return;
    await refetchMessages();
    await refetch();
  }, [refetch, refetchMessages]);

  const handleSocketConnect = useCallback(() => {
    refreshOpenChat();
  }, [refreshOpenChat]);

  const { emitDeleteMessage, emitDeleteConversation } = useConversationsSocket({
    enabled: Boolean(currentUserId && selectedObjectId),
    subjectId: currentUserId,
    objectId: selectedObjectId,
    onMessage: handleSocketMessage,
    onChatUpdated: handleSocketMessage,
    onMessageDeleted: handleSocketMessageDeleted,
    onConversationDeleted: handleSocketConversationDeleted,
    onOnlineStatus: handleOnlineStatus,
    onConnect: handleSocketConnect,
  });

  const handleConversationsChange = useCallback((next) => {
    setLocalConversations(next);
  }, []);

  const handleSelectConversation = useCallback((conversation) => {
    const objectId = String(conversation?.participantId || conversation?.objectId || '').trim();
    const conversationId = String(conversation?.id || '').trim();
    setSelectedObjectId(objectId);
    if (conversationId) setSelectedConversationId(conversationId);
  }, []);

  const buildSendBody = useCallback(
    (conversation, messageType, contentOrMediaUrl, extras = {}) => {
      const existingConversationId = String(conversation.conversationId || conversation.id || '').trim();
      const participantId = String(conversation.participantId || conversation.objectId || '').trim();
      const type = normalizeMessageType(messageType);

      const body = {
        messageType: type,
        conversationType: conversation.isGroup ? 'group' : 'direct',
        currentUserId,
      };

      if (type === 'text') {
        body.messageContent = String(contentOrMediaUrl || '').trim();
      } else if (type === 'location') {
        const location = extras.location || {};
        const coords = normalizeLocationCoords({
          ...location,
          latitude: location.latitude ?? extras.latitude,
          longitude: location.longitude ?? extras.longitude,
        });

        if (!coords) {
          throw new Error('Valid latitude and longitude are required');
        }

        body.latitude = coords.latitude;
        body.longitude = coords.longitude;
        body.location = {
          latitude: coords.latitude,
          longitude: coords.longitude,
        };
        body.messageContent = `${coords.latitude},${coords.longitude}`;
        const mapsLink =
          String(extras.mediaUrl || '').trim() || buildLocationMapsLink(coords);
        if (mapsLink) body.mediaUrl = mapsLink;
      } else {
        body.mediaUrl = String(contentOrMediaUrl || '').trim();
        if (!body.mediaUrl) {
          throw new Error('Media URL is required for file and audio messages');
        }
      }

      if (existingConversationId && !existingConversationId.startsWith('draft-')) {
        body.conversationId = existingConversationId;
      } else if (participantId) {
        body.participantId = participantId;
      } else {
        throw new Error('Missing participant for new conversation');
      }

      return { body, existingConversationId, participantId };
    },
    [currentUserId]
  );

  const resolveMessageContent = useCallback(
    async (messageData) => {
      if (messageData?.type === 'location') {
        const coords = normalizeLocationCoords(messageData.location || {});
        if (!coords) {
          throw new Error('Valid latitude and longitude are required');
        }

        return {
          messageType: 'location',
          mediaUrl: buildLocationMapsLink(coords),
          location: {
            latitude: coords.latitude,
            longitude: coords.longitude,
          },
        };
      }

      if (messageData?.file instanceof File) {
        const uploaded = await uploadAwsFile(messageData.file).unwrap();
        const fileUrl = String(uploaded?.fileUrl || '').trim();
        if (!fileUrl) {
          throw new Error('Upload failed — no file URL returned');
        }

        const isAudio =
          messageData.type === 'voice' ||
          messageData.type === 'audio' ||
          String(messageData.file.type || '').startsWith('audio/');

        return {
          messageType: isAudio ? 'audio' : 'file',
          mediaUrl: fileUrl,
        };
      }

      const normalizedType = normalizeMessageType(messageData.type || 'file');
      const mediaUrl =
        messageData.attachment?.url ||
        messageData.text ||
        messageData.attachment?.name ||
        '';

      return { messageType: normalizedType, mediaUrl };
    },
    [uploadAwsFile]
  );

  const addPendingMessage = useCallback((objectId, message) => {
    const key = String(objectId || '').trim();
    if (!key || !message) return;
    setPendingByObjectId((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), message],
    }));
    setLocalConversations((prev) =>
      prev.map((conversation) => {
        if (String(conversation.participantId || conversation.objectId) !== key) return conversation;
        const messages = [...(conversation.messages || []), message];
        const preview = previewFromMessages(messages);
        return {
          ...conversation,
          messages,
          lastMessage: preview.lastMessage,
          lastAt: preview.lastAt || conversation.lastAt,
        };
      })
    );
  }, []);

  const removePendingMessage = useCallback((objectId, pendingId) => {
    const key = String(objectId || '').trim();
    const id = String(pendingId || '').trim();
    if (!key || !id) return;
    setPendingByObjectId((prev) => {
      const nextList = (prev[key] || []).filter((item) => String(item.id) !== id);
      if (!nextList.length) {
        const { [key]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: nextList };
    });
  }, []);

  const handleSendText = useCallback(
    async (conversation, text) => {
      const trimmed = String(text || '').trim();
      if (!trimmed || !conversation) return;

      const participantId = String(
        conversation.participantId || conversation.objectId || ''
      ).trim();
      const pendingId = `pending-${createMessageId()}`;
      const optimistic = {
        id: pendingId,
        sender: 'me',
        type: 'text',
        text: trimmed,
        at: formatMessageTime(),
        status: 'sending',
        pending: true,
      };

      if (participantId) {
        addPendingMessage(participantId, optimistic);
      }

      setSendBusy(true);
      try {
        const { body, participantId: resolvedParticipantId } = buildSendBody(
          conversation,
          'text',
          trimmed
        );
        const result = await sendMessage(body).unwrap();
        const peerId = String(resolvedParticipantId || participantId || '').trim();
        const resolvedConversationId = String(
          result?.conversationId || body.conversationId || ''
        ).trim();

        if (resolvedConversationId && peerId) {
          setSelectedObjectId(peerId);
        }

        // Refresh in background — bubble already visible.
        await Promise.all([refetch(), peerId ? refetchMessages() : Promise.resolve()]);
      } catch (apiError) {
        if (participantId) removePendingMessage(participantId, pendingId);
        toast.error(handleApiError(apiError));
        throw apiError;
      } finally {
        if (participantId) removePendingMessage(participantId, pendingId);
        setSendBusy(false);
      }
    },
    [addPendingMessage, buildSendBody, refetch, refetchMessages, removePendingMessage, sendMessage]
  );

  const handleSendAttachment = useCallback(
    async (conversation, messageData) => {
      if (!conversation || !messageData) return;

      const participantId = String(
        conversation.participantId || conversation.objectId || ''
      ).trim();
      const pendingId = `pending-${createMessageId()}`;
      const optimistic = {
        id: pendingId,
        sender: 'me',
        at: formatMessageTime(),
        status: 'sending',
        pending: true,
        type: messageData.type || 'file',
        text: messageData.text || '',
        attachment: messageData.attachment,
        location: messageData.location,
        file: messageData.file,
      };

      if (participantId) {
        addPendingMessage(participantId, optimistic);
      }

      setSendBusy(true);
      try {
        const resolved = await resolveMessageContent(messageData);
        const { messageType, mediaUrl, messageContent, location } = resolved;

        let body;
        let resolvedParticipantId;

        try {
          ({ body, participantId: resolvedParticipantId } = buildSendBody(
            conversation,
            messageType,
            mediaUrl || messageContent,
            {
              messageContent,
              mediaUrl,
              location,
            }
          ));
          await sendMessage(body).unwrap();
        } catch (primaryError) {
          // Until backend accepts messageType=location, fall back to text with a maps link.
          if (messageType === 'location') {
            const fallbackText = buildLocationMapsLink(location || {}) || 'Location';
            ({ body, participantId: resolvedParticipantId } = buildSendBody(
              conversation,
              'text',
              fallbackText
            ));
            await sendMessage(body).unwrap();
          } else {
            throw primaryError;
          }
        }

        const peerId = String(resolvedParticipantId || participantId || '').trim();
        if (peerId) {
          setSelectedObjectId(peerId);
        }

        await Promise.all([refetch(), peerId ? refetchMessages() : Promise.resolve()]);
      } catch (apiError) {
        if (participantId) removePendingMessage(participantId, pendingId);
        toast.error(handleApiError(apiError));
        throw apiError;
      } finally {
        if (participantId) removePendingMessage(participantId, pendingId);
        setSendBusy(false);
      }
    },
    [
      addPendingMessage,
      buildSendBody,
      refetch,
      refetchMessages,
      removePendingMessage,
      resolveMessageContent,
      sendMessage,
    ]
  );

  const handleMarkRead = useCallback(
    (conversationId) => {
      setLocalConversations((prev) => markConversationRead(prev, conversationId));
    },
    []
  );

  const handleConversationAction = useCallback(
    async (conversationId, action) => {
      try {
        await updateAction({ conversationId, action }).unwrap();
        toast.success('Conversation updated');
        refetch();
      } catch (apiError) {
        toast.error(handleApiError(apiError));
      }
    },
    [refetch, updateAction]
  );

  const handleDeleteMessage = useCallback(
    async (messageOrId, objectId, conversationId = '') => {
      const messageId =
        typeof messageOrId === 'object' && messageOrId
          ? resolveMessageDocumentId(messageOrId)
          : String(messageOrId || '').trim();

      const resolvedConversationId = String(
        conversationId ||
          (typeof messageOrId === 'object'
            ? messageOrId?.raw?.conversationId || messageOrId?.conversationId || ''
            : '') ||
          ''
      ).trim();

      const resolvedObjectId = String(objectId || selectedObjectId || '').trim();

      if (!messageId) {
        toast.error('Cannot delete — message id is missing');
        return;
      }

      if (!isMongoObjectId(messageId)) {
        toast.error('Cannot delete — invalid message id');
        return;
      }

      try {
        await deleteMessage({ messageId, objectId: resolvedObjectId }).unwrap();

        const deleted = await waitForMessageMarkedDeleted(refetchMessages, messageId);
        if (!deleted) {
          toast.error('Message could not be deleted. Please try again.');
          return;
        }

        skipSocketRefreshRef.current = true;
        emitDeleteMessage({
          messageId,
          conversationId: resolvedConversationId,
          objectId: resolvedObjectId,
          subjectId: currentUserId,
        });
        window.setTimeout(() => {
          skipSocketRefreshRef.current = false;
        }, 1000);

        await refetch();
        toast.success('Message deleted');
      } catch (apiError) {
        toast.error(handleApiError(apiError));
        throw apiError;
      }
    },
    [
      currentUserId,
      deleteMessage,
      emitDeleteMessage,
      refetch,
      refetchMessages,
      selectedObjectId,
    ]
  );

  const handleDeleteConversation = useCallback(
    async (conversationId) => {
      const id = String(conversationId || '').trim();
      if (!id) return;

      const target = localConversations.find(
        (item) => String(item.id) === id || String(item.conversationId || '') === id
      );
      const objectId = String(
        target?.participantId || target?.objectId || selectedObjectId || ''
      ).trim();
      const isDraft = id.startsWith('draft-');

      try {
        if (isDraft) {
          setLocalConversations((prev) =>
            prev.filter((conversation) => {
              const sameConversation =
                String(conversation.id) === id ||
                String(conversation.conversationId || '') === id;
              const sameObject =
                objectId &&
                String(conversation.participantId || conversation.objectId) === objectId;
              return !sameConversation && !sameObject;
            })
          );
          setSelectedObjectId((current) => (objectId && String(current) === objectId ? '' : current));
          setSelectedConversationId((current) => (String(current) === id ? '' : current));
          toast.success('Conversation deleted');
          return;
        }

        await deleteConversation(id).unwrap();

        const refreshed = await refetch();
        const serverConversations = refreshed?.data?.data || [];
        if (conversationExistsInList(serverConversations, { conversationId: id, objectId })) {
          toast.error('Conversation could not be deleted. Please try again.');
          return;
        }

        emitDeleteConversation({
          conversationId: id,
          objectId,
          subjectId: currentUserId,
        });

        if (objectId && String(selectedObjectId) === objectId) {
          setSelectedObjectId('');
        }
        if (String(selectedConversationId) === id) {
          setSelectedConversationId('');
        }

        toast.success('Conversation deleted');
      } catch (apiError) {
        toast.error(handleApiError(apiError));
        throw apiError;
      }
    },
    [
      currentUserId,
      deleteConversation,
      emitDeleteConversation,
      localConversations,
      refetch,
      selectedConversationId,
      selectedObjectId,
    ]
  );

  const startDirectChat = useCallback((participant) => {
    const participantId = String(participant?.id || participant?._id || '').trim();
    if (!participantId) return null;

    let resolvedConversation = null;

    setLocalConversations((prev) => {
      const existing = prev.find(
        (item) => String(item.participantId || item.objectId) === participantId
      );

      if (existing) {
        resolvedConversation = existing;
        return prev;
      }

      const draft = {
        id: `draft-${participantId}`,
        conversationId: '',
        participantId,
        objectId: participantId,
        category: 'client',
        name: participant?.name || 'Contact',
        email: participant?.email || '',
        avatar: (participant?.name || '?').charAt(0).toUpperCase(),
        avatarUrl: participant?.profileIconUrl || participant?.avatarUrl || '',
        online: false,
        unread: 0,
        awaitingReply: false,
        lastMessage: 'Start a conversation',
        lastAt: '',
        messages: [],
      };

      resolvedConversation = draft;
      return [
        draft,
        ...prev.filter((item) => String(item.participantId || item.objectId) !== participantId),
      ];
    });

    const conversationId = String(
      resolvedConversation?.id || `draft-${participantId}`
    ).trim();

    setSelectedObjectId(participantId);
    setSelectedConversationId(conversationId);

    return (
      resolvedConversation || {
        id: conversationId,
        participantId,
        objectId: participantId,
        name: participant?.name || 'Contact',
      }
    );
  }, []);

  const loading = isLoading || isFetching;
  const initialLoading = isLoading && !localConversations.length;
  const selectedMessages = useMemo(() => {
    if (!selectedObjectId) return [];
    const apiMessages = sortMessagesChronologically(
      filterVisibleMessages(messagesData?.data || [])
    );
    const pending = (pendingByObjectId[String(selectedObjectId)] || []).filter((pendingMsg) => {
      const text = String(pendingMsg.text || '').trim();
      if (!text) {
        // Keep non-text pending (file/location) until cleared after refetch.
        return true;
      }
      // Avoid duplicate while API refetch overlaps optimistic bubble.
      return !apiMessages.some(
        (message) =>
          message.sender === 'me' && String(message.text || '').trim() === text
      );
    });
    if (!pending.length) return apiMessages;
    return sortMessagesChronologically([...apiMessages, ...pending]);
  }, [filterVisibleMessages, messagesData?.data, pendingByObjectId, selectedObjectId]);

  const apiErrorMessage = isError ? handleApiError(error) : '';

  return useMemo(
    () => ({
      conversations: localConversations,
      selectedConversationId,
      selectedMessages,
      loading,
      initialLoading,
      isSending: sendBusy || isSending,
      isMessagesFetching,
      apiErrorMessage,
      currentUserId,
      onConversationsChange: handleConversationsChange,
      onSelectConversation: handleSelectConversation,
      onSendText: handleSendText,
      onSendAttachment: handleSendAttachment,
      onMarkRead: handleMarkRead,
      onConversationAction: handleConversationAction,
      onDeleteMessage: handleDeleteMessage,
      onDeleteConversation: handleDeleteConversation,
      startDirectChat,
      refetch,
    }),
    [
      apiErrorMessage,
      currentUserId,
      handleConversationsChange,
      handleConversationAction,
      handleDeleteConversation,
      handleDeleteMessage,
      handleMarkRead,
      handleSelectConversation,
      handleSendAttachment,
      handleSendText,
      initialLoading,
      isMessagesFetching,
      isSending,
      sendBusy,
      loading,
      localConversations,
      refetch,
      selectedConversationId,
      selectedMessages,
      startDirectChat,
    ]
  );
}

