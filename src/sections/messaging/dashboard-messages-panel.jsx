import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import { useTheme } from '@mui/material/styles';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Collapse from '@mui/material/Collapse';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import useMediaQuery from '@mui/material/useMediaQuery';

import { useBoolean } from 'src/hooks/use-boolean';
import { useViewOnly } from 'src/hooks/use-view-only';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { usePopover, CustomPopover } from 'src/components/custom-popover';
import { ModuleLoading } from 'src/components/loading-screen';

import { NewGroupChatDialog } from './new-group-chat-dialog';
import { ChatLocationPickerDialog } from './chat-location-picker-dialog';
import { buildAutoReply, getReplyDelay } from './chat-auto-reply';
import {
  appendChatMessage,
  appendIncomingMessage,
  appendMessage,
  buildMapsUrl,
  createGroupConversation,
  downloadAttachmentFile,
  filterConversations,
  formatFileSize,
  getConversationAttachments,
  markConversationRead,
  markOutgoingMessagesRead,
  openAttachmentInNewTab,
  readFileAsDataUrl,
  updateLastOutgoingStatus,
} from './messages-utils';
import { sortMessagesChronologically, isImageFileAttachment, isDeletedMessage, DELETED_MESSAGE_LABEL } from './conversations-api-utils';
import {
  isVoiceMediaUrl,
  loadPlayableVoiceObjectUrl,
  preferredVoiceRecorderMime,
  toMobilePlayableVoiceFile,
  voicePlaybackType,
} from './voice-message-audio';
import { mapUserProfileFromApi } from 'src/sections/account/account-profile-utils';
import { resolveProfileAssetUrl } from 'src/store/Reducer/upload-api';

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

function isContactOnline(contact) {
  return Boolean(contact?.isOnline ?? contact?.online);
}

function VoiceMessagePlayer({ url, mimeType, duration }) {
  const playbackType = voicePlaybackType(url, mimeType);
  // Phone m4a is not requested on refresh. Chrome cannot play Apple Lossless, and a direct
  // fetch of the bucket fails with an empty response because S3 sends no CORS header.
  const decodeOnPlay = playbackType === 'audio/mp4' && !String(url).startsWith('blob:');
  const [src, setSrc] = useState(decodeOnPlay ? '' : url);
  const [preparing, setPreparing] = useState(false);
  const blobUrlRef = useRef('');

  useEffect(
    () => () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    },
    []
  );

  const preparePhoneVoice = useCallback(async () => {
    if (!decodeOnPlay || src || preparing) return;
    setPreparing(true);
    try {
      const objectUrl = await loadPlayableVoiceObjectUrl(url);
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = objectUrl;
      setSrc(objectUrl);
    } catch {
      toast.error('Could not play this voice message');
    } finally {
      setPreparing(false);
    }
  }, [decodeOnPlay, preparing, src, url]);

  return (
    <Box sx={{ px: 1.5, py: 1, minWidth: { xs: 0, sm: 200 }, maxWidth: 1 }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Iconify icon="solar:microphone-bold" width={18} />
        {decodeOnPlay && !src ? (
          <IconButton size="small" onClick={preparePhoneVoice} disabled={preparing} sx={{ color: 'inherit' }}>
            {preparing ? <CircularProgress size={16} /> : <Iconify icon="solar:play-bold" width={18} />}
          </IconButton>
        ) : (
          <Box
            component="audio"
            controls
            autoPlay={decodeOnPlay}
            preload="none"
            src={src}
            sx={{ width: 1, maxWidth: 180, height: 32 }}
          />
        )}
        {duration ? <Typography variant="caption">{duration}s</Typography> : null}
      </Stack>
    </Box>
  );
}

function OnlineAvatar({ label, online = false, size = 44, avatarUrl, sx }) {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', ...sx }}>
      <Avatar
        src={avatarUrl || undefined}
        sx={{
          width: size,
          height: size,
          bgcolor: 'primary.lighter',
          color: 'primary.dark',
          fontWeight: 700,
          fontSize: size > 60 ? 28 : 16,
          border: '1px solid',
          borderColor: 'primary.light',
        }}
      >
        {!avatarUrl && label}
      </Avatar>
      {online && (
        <Box
          sx={{
            position: 'absolute',
            right: 2,
            bottom: 2,
            width: size > 60 ? 14 : 11,
            height: size > 60 ? 14 : 11,
            borderRadius: '50%',
            bgcolor: 'success.main',
            border: '2px solid',
            borderColor: 'background.paper',
          }}
        />
      )}
    </Box>
  );
}

function TypingIndicator() {
  return (
    <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 2, px: 0.5 }}>
      <Box
        sx={{
          px: 1.75,
          py: 1.25,
          borderRadius: 2.5,
          borderTopLeftRadius: 6,
          bgcolor: 'background.neutral',
          display: 'flex',
          gap: 0.5,
        }}
      >
        {[0, 1, 2].map((dot) => (
          <Box
            key={dot}
            sx={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              bgcolor: 'primary.light',
              animation: 'chatTyping 1.2s infinite',
              animationDelay: `${dot * 0.2}s`,
              '@keyframes chatTyping': {
                '0%, 100%': { opacity: 0.35, transform: 'translateY(0)' },
                '50%': { opacity: 1, transform: 'translateY(-3px)' },
              },
            }}
          />
        ))}
      </Box>
    </Stack>
  );
}

function MessageStatus({ status = 'delivered' }) {
  if (status === 'sending') {
    return <Iconify icon="svg-spinners:3-dots-fade" width={14} sx={{ color: 'text.disabled' }} />;
  }

  if (status === 'sent') {
    return <Iconify icon="eva:checkmark-fill" width={15} sx={{ color: 'text.disabled' }} />;
  }

  const isRead = status === 'read';

  return (
    <Iconify
      icon="eva:done-all-fill"
      width={16}
      sx={{ color: isRead ? 'primary.main' : 'text.disabled' }}
    />
  );
}

const LONG_MESSAGE_CHARS = 420;

function MessageText({ text, isMe }) {
  const [expanded, setExpanded] = useState(false);
  const value = String(text || '');
  const isLong = value.length > LONG_MESSAGE_CHARS || value.split('\n').length > 10;

  return (
    <Box sx={{ px: 2, py: 1.25, minWidth: 0, maxWidth: 1 }}>
      <Typography
        variant="body2"
        sx={{
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          overflowWrap: 'anywhere',
          wordBreak: 'break-word',
          ...(!expanded &&
            isLong && {
              display: '-webkit-box',
              WebkitLineClamp: 8,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }),
        }}
      >
        {value}
      </Typography>
      {isLong ? (
        <Button
          size="small"
          onClick={() => setExpanded((open) => !open)}
          sx={{
            mt: 0.25,
            p: 0,
            minWidth: 0,
            fontWeight: 700,
            color: isMe ? 'common.white' : 'primary.main',
            '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
          }}
        >
          {expanded ? 'Show less' : 'Show more'}
        </Button>
      ) : null}
    </Box>
  );
}

function MessageBubble({ message, onDelete }) {
  const isMe = message.sender === 'me';
  const isDeleted = isDeletedMessage(message);
  const type = message.type || message.messageType || 'text';
  const attachmentUrl = message.attachment?.url || '';
  const canDelete = typeof onDelete === 'function' && !isDeleted;
  const menu = usePopover();

  if (isDeleted) {
    return (
      <Stack alignItems={isMe ? 'flex-end' : 'flex-start'} sx={{ mb: 1.5, width: 1 }}>
        <Box
          sx={{
            maxWidth: { xs: '92%', md: '78%' },
            px: 2,
            py: 1.25,
            borderRadius: 2.5,
            borderTopRightRadius: isMe ? 6 : 20,
            borderTopLeftRadius: isMe ? 20 : 6,
            bgcolor: 'action.hover',
            border: '1px dashed',
            borderColor: 'divider',
          }}
        >
          <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
            {DELETED_MESSAGE_LABEL}
          </Typography>
        </Box>
        <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, px: 0.25 }}>
          {message.at}
        </Typography>
      </Stack>
    );
  }

  const bubbleSx = {
    maxWidth: { xs: '92%', md: '78%' },
    minWidth: 0,
    borderRadius: 2.5,
    borderTopRightRadius: isMe ? 6 : 20,
    borderTopLeftRadius: isMe ? 20 : 6,
    overflow: 'hidden',
    overflowWrap: 'anywhere',
    boxShadow: isMe ? 'none' : (theme) => `0 1px 1px ${theme.vars.palette.divider}`,
  };

  const renderContent = () => {
    if (type === 'file' && attachmentUrl && isImageFileAttachment(message.attachment)) {
      return (
        <Box
          component="img"
          src={attachmentUrl}
          alt={message.attachment?.name || 'Shared image'}
          onClick={() => openAttachmentInNewTab(attachmentUrl)}
          sx={{
            display: 'block',
            maxWidth: 260,
            maxHeight: 220,
            objectFit: 'cover',
            cursor: 'pointer',
          }}
        />
      );
    }

    if (type === 'image' && message.attachment?.url) {
      return (
        <Box
          component="img"
          src={message.attachment.url}
          alt={message.attachment.name || 'Shared image'}
          onClick={() => openAttachmentInNewTab(message.attachment.url)}
          sx={{
            display: 'block',
            maxWidth: 260,
            maxHeight: 220,
            objectFit: 'cover',
            cursor: 'pointer',
          }}
        />
      );
    }

    if (
      attachmentUrl &&
      (type === 'audio' || type === 'voice' || isVoiceMediaUrl(attachmentUrl, message.attachment?.mimeType))
    ) {
      return (
        <VoiceMessagePlayer
          url={attachmentUrl}
          mimeType={message.attachment?.mimeType}
          duration={message.attachment?.duration}
        />
      );
    }

    if (type === 'file' && message.attachment) {
      return (
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          onClick={() => message.attachment.url && openAttachmentInNewTab(message.attachment.url)}
          sx={{
            px: 1.5,
            py: 1.25,
            bgcolor: isMe ? 'primary.lighter' : 'background.neutral',
            cursor: message.attachment.url ? 'pointer' : 'default',
          }}
        >
          <Iconify icon="eva:file-fill" width={22} />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {message.attachment.name}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              {formatFileSize(message.attachment.size)}
            </Typography>
          </Box>
          {message.attachment.url && (
            <IconButton
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                downloadAttachmentFile(message.attachment.url, message.attachment.name);
              }}
              sx={{ color: 'inherit' }}
              title="Download file"
            >
              <Iconify icon="eva:download-fill" width={18} />
            </IconButton>
          )}
        </Stack>
      );
    }

    if (type === 'location' && message.location) {
      const mapsUrl = buildMapsUrl(message.location);
      return (
        <Stack
          spacing={0.75}
          sx={{
            px: 1.5,
            py: 1.25,
            minWidth: { xs: 0, sm: 220 },
            maxWidth: 280,
            bgcolor: isMe ? 'primary.lighter' : 'background.neutral',
            color: 'text.primary',
          }}
        >
          <Stack direction="row" spacing={1} alignItems="flex-start">
            <Iconify icon="solar:map-point-bold" width={20} sx={{ color: 'primary.main', mt: 0.25 }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ color: 'text.primary', overflowWrap: 'anywhere' }}>
                {message.location.latitude != null && message.location.longitude != null
                  ? `${message.location.latitude},${message.location.longitude}`
                  : 'Location'}
              </Typography>
            </Box>
          </Stack>
          {mapsUrl && (
            <Button
              size="small"
              component="a"
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<Iconify icon="solar:map-arrow-right-bold" width={16} />}
              sx={{ alignSelf: 'flex-start', mt: 0.25, color: 'primary.main' }}
            >
              Open in Maps
            </Button>
          )}
        </Stack>
      );
    }

    return <MessageText text={message.text} isMe={isMe} />;
  };

  return (
    <>
      <Stack
        alignItems={isMe ? 'flex-end' : 'flex-start'}
        sx={{ mb: 1.5, width: 1 }}
      >
        <Box
          sx={{
            ...bubbleSx,
            bgcolor: isMe ? 'primary.main' : 'background.paper',
            color: isMe ? 'common.white' : 'text.primary',
            border: isMe ? 'none' : '1px solid',
            borderColor: isMe ? 'transparent' : 'divider',
          }}
        >
          {renderContent()}
        </Box>

        <Stack
          direction="row"
          alignItems="center"
          spacing={0.25}
          sx={{ mt: 0.5, px: 0.25, justifyContent: isMe ? 'flex-end' : 'flex-start' }}
        >
          <Typography variant="caption" color="text.disabled">
            {message.at}
          </Typography>
          {isMe && <MessageStatus status={message.status || 'delivered'} />}
          {canDelete ? (
            <IconButton
              size="small"
              onClick={menu.onOpen}
              aria-label="Message options"
              sx={{
                width: 22,
                height: 22,
                ml: 0.25,
                color: 'text.secondary',
                '&:hover': { color: 'text.primary', bgcolor: 'action.hover' },
              }}
            >
              <Iconify icon="eva:more-vertical-fill" width={14} />
            </IconButton>
          ) : null}
        </Stack>
      </Stack>

      <CustomPopover
        open={menu.open}
        anchorEl={menu.anchorEl}
        onClose={menu.onClose}
        slotProps={{ arrow: { placement: isMe ? 'top-right' : 'top-left' } }}
      >
        <MenuList sx={{ minWidth: 140 }}>
          <MenuItem
            onClick={() => {
              menu.onClose();
              onDelete?.(message);
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            Delete
          </MenuItem>
        </MenuList>
      </CustomPopover>
    </>
  );
}

function compactChatTime(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  const lower = text.toLowerCase();
  if (lower.includes('second')) return 'now';
  if (/^an?\s+minute/.test(lower)) return '1m';
  const minutes = lower.match(/(\d+)\s*minute/);
  if (minutes) return `${minutes[1]}m`;
  if (lower.includes('minute')) return '1m';
  if (/^an?\s+hour/.test(lower)) return '1h';
  const hours = lower.match(/(\d+)\s*hour/);
  if (hours) return `${hours[1]}h`;
  if (lower.includes('hour')) return '1h';
  if (/^a\s+day/.test(lower)) return '1d';
  const days = lower.match(/(\d+)\s*day/);
  if (days) return `${days[1]}d`;
  if (lower.includes('day')) return '1d';
  return text.length > 12 ? text.slice(0, 12) : text;
}

function ChatListItem({ item, selected, onClick, onDelete }) {
  const menu = usePopover();
  const canDelete = typeof onDelete === 'function';

  return (
    <Box
      onClick={onClick}
      sx={{
        position: 'relative',
        px: 2,
        py: 1.5,
        mx: 1,
        mb: 0.5,
        borderRadius: 2,
        cursor: 'pointer',
        bgcolor: selected ? 'primary.lighter' : 'transparent',
        '&:hover': { bgcolor: selected ? 'primary.lighter' : 'action.hover' },
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="center">
        <OnlineAvatar
          label={item.avatar}
          avatarUrl={item.avatarUrl || resolveProfileAssetUrl(item.chatIcon || item.profileIcon)}
          online={!item.isGroup && isContactOnline(item)}
          size={44}
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <Typography
              variant="subtitle2"
              noWrap
              fontWeight={item.unread ? 800 : 700}
              sx={{ flex: 1, minWidth: 0 }}
            >
              {item.name}
            </Typography>
            {item.lastAt ? (
              <Typography variant="caption" noWrap sx={{ flexShrink: 0, color: 'text.disabled', fontWeight: 600 }}>
                {compactChatTime(item.lastAt)}
              </Typography>
            ) : null}
            {canDelete ? (
              <IconButton
                size="small"
                onClick={(event) => {
                  event.stopPropagation();
                  menu.onOpen(event);
                }}
                aria-label="Conversation options"
                sx={{
                  width: 24,
                  height: 24,
                  flexShrink: 0,
                  color: 'text.disabled',
                  '&:hover': { color: 'text.primary', bgcolor: 'action.hover' },
                }}
              >
                <Iconify icon="eva:more-vertical-fill" width={16} />
              </IconButton>
            ) : null}
          </Stack>
          {(item.lovedOne || item.relationship) && (
            <Typography variant="caption" color="text.disabled" noWrap display="block">
              {item.relationship && item.lovedOne
                ? `${item.relationship} · ${item.lovedOne}`
                : item.lovedOne || item.relationship}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary" noWrap sx={{ display: 'block' }}>
            {item.lastMessage}
          </Typography>
        </Box>
      </Stack>

      <CustomPopover
        open={menu.open}
        anchorEl={menu.anchorEl}
        onClose={menu.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList sx={{ minWidth: 160 }}>
          <MenuItem
            onClick={(event) => {
              event.stopPropagation();
              menu.onClose();
              onDelete?.(item);
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            Delete conversation
          </MenuItem>
        </MenuList>
      </CustomPopover>
    </Box>
  );
}

// ----------------------------------------------------------------------

export function DashboardMessagesPanel({
  conversations,
  onConversationsChange,
  groupByCategory = false,
  onSendText,
  onSendAttachmentMessage,
  onSelectConversation,
  onDeleteMessage,
  onDeleteConversation,
  selectedConversationId = '',
  threadMessages = null,
  disableAutoReply = false,
  loading = false,
  messagesLoading = false,
  sending = false,
  apiErrorMessage = '',
  apiMode = false,
}) {
  const viewOnly = useViewOnly();
  const isApiMode = apiMode || Boolean(onSendText);
  const theme = useTheme();
  const lgUp = useMediaQuery((t) => t.breakpoints.up('lg'));
  const mdUp = useMediaQuery((t) => t.breakpoints.up('md'));

  const newGroupDialog = useBoolean();
  const confirmDeleteMessage = useBoolean();
  const confirmDeleteConversation = useBoolean();

  const { user } = useSelector((state) => state.user);
  const userProfile = useMemo(() => mapUserProfileFromApi(user), [user]);
  const displayName = userProfile.name || 'User';
  const userEmail = userProfile.email || (isApiMode ? '—' : '');
  const userInitial = displayName.charAt(0).toUpperCase();
  const userAvatarUrl = userProfile.profileIconUrl || resolveProfileAssetUrl(userProfile.profileIcon) || '';

  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState('');
  const [chatsOpen, setChatsOpen] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [attachmentsOpen, setAttachmentsOpen] = useState(true);
  const [mobileView, setMobileView] = useState('inbox');
  const wasLgUpRef = useRef(lgUp);
  // Shrinking the window used to hide the open conversation, because the narrow
  // layout starts on the inbox. Keep the thread that was already on screen.
  useEffect(() => {
    if (wasLgUpRef.current && !lgUp && selectedId) {
      setMobileView('thread');
    }
    wasLgUpRef.current = lgUp;
  }, [lgUp, selectedId]);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [typingId, setTypingId] = useState(null);
  const [pendingDeleteMessage, setPendingDeleteMessage] = useState(null);
  const [pendingDeleteConversation, setPendingDeleteConversation] = useState(null);
  const [deletingMessage, setDeletingMessage] = useState(false);
  const [deletingConversation, setDeletingConversation] = useState(false);
  const [sharingLocation, setSharingLocation] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [locationInitial, setLocationInitial] = useState(null);

  const threadEndRef = useRef(null);
  const isNearBottomRef = useRef(true);
  const prevSelectedIdRef = useRef(null);
  const prevMessageCountRef = useRef(0);
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const recordingSecondsRef = useRef(0);
  const replyTimeoutRef = useRef(null);
  const deliveredTimeoutRef = useRef(null);
  const conversationsRef = useRef(conversations);
  const selectedIdRef = useRef(selectedId);
  const syncedSelectionRef = useRef('');

  conversationsRef.current = conversations;
  selectedIdRef.current = selectedId;

  const filtered = useMemo(
    () => filterConversations(conversations, { tab: 'all', search }),
    [conversations, search]
  );

  const selected = useMemo(
    () => conversations.find((item) => item.id === selectedId) || null,
    [conversations, selectedId]
  );

  const visibleMessages = useMemo(() => {
    const source = Array.isArray(threadMessages) ? threadMessages : selected?.messages || [];
    return sortMessagesChronologically(source);
  }, [selected?.messages, threadMessages]);

  const attachments = useMemo(
    () => getConversationAttachments(visibleMessages),
    [visibleMessages]
  );

  const grouped = useMemo(() => {
    if (!groupByCategory) return null;
    return {
      nextOfKin: filtered.filter((item) => item.category === 'next_of_kin'),
      client: filtered.filter((item) => item.category === 'client'),
      agency: filtered.filter((item) => item.category === 'agency'),
      staff: filtered.filter((item) => item.category === 'staff'),
      group: filtered.filter((item) => item.isGroup || item.category === 'group'),
      other: filtered.filter(
        (item) =>
          item.category !== 'next_of_kin' &&
          item.category !== 'client' &&
          item.category !== 'agency' &&
          item.category !== 'staff' &&
          !item.isGroup &&
          item.category !== 'group'
      ),
    };
  }, [filtered, groupByCategory]);

  const handleSelect = useCallback(
    (conversationId) => {
      const conversation = conversations.find((item) => String(item.id) === String(conversationId));
      if (!conversation) return;

      const objectId = String(conversation.objectId || conversation.participantId || '').trim();
      syncedSelectionRef.current = `${conversation.id}:${objectId}`;

      if (onSelectConversation) {
        onSelectConversation(conversation);
      }
      setSelectedId(conversation.id);
      onConversationsChange(markConversationRead(conversations, conversation.id));
      if (!lgUp) setMobileView('thread');
    },
    [conversations, lgUp, onConversationsChange, onSelectConversation]
  );

  useEffect(() => {
    if (!filtered.length) return;
    if (loading) return;

    const preferredId = selectedConversationId || selectedId;

    let conversation = preferredId
      ? conversations.find((item) => String(item.id) === String(preferredId))
      : null;

    // Deep-link / draft: match by participant/object id when conversation id differs.
    if (!conversation && preferredId) {
      const draftPeerId = String(preferredId).startsWith('draft-')
        ? String(preferredId).replace(/^draft-/, '')
        : '';

      conversation = conversations.find((item) => {
        const peerId = String(item.participantId || item.objectId || '').trim();
        return (
          peerId === String(preferredId) ||
          (draftPeerId && peerId === draftPeerId) ||
          String(item.id) === `draft-${preferredId}`
        );
      });
    }

    if (!conversation) {
      conversation = filtered[0];
    }

    if (!conversation) return;

    const objectId = String(conversation.objectId || conversation.participantId || '').trim();
    if (!objectId) return;

    const syncKey = `${conversation.id}:${objectId}`;
    const needsSelectionSync = String(selectedId) !== String(conversation.id);

    if (syncedSelectionRef.current === syncKey && !needsSelectionSync) return;

    syncedSelectionRef.current = syncKey;

    if (onSelectConversation) {
      onSelectConversation(conversation);
    }

    if (needsSelectionSync) {
      setSelectedId(conversation.id);
      onConversationsChange(markConversationRead(conversations, conversation.id));
      if (!lgUp) setMobileView('thread');
    }
  }, [
    conversations,
    filtered,
    loading,
    lgUp,
    onConversationsChange,
    onSelectConversation,
    selectedConversationId,
    selectedId,
  ]);

  const scrollThreadToBottom = useCallback((behavior = 'auto') => {
    const el = threadEndRef.current;
    if (!el) return;

    if (behavior === 'smooth') {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    } else {
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  const handleThreadScroll = useCallback(() => {
    const el = threadEndRef.current;
    if (!el) return;

    const threshold = 96;
    isNearBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
  }, []);

  useEffect(() => {
    if (selectedId !== prevSelectedIdRef.current) {
      prevSelectedIdRef.current = selectedId;
      isNearBottomRef.current = true;
      prevMessageCountRef.current = 0;
      requestAnimationFrame(() => scrollThreadToBottom());
    }
  }, [scrollThreadToBottom, selectedId]);

  useEffect(() => {
    const count = visibleMessages.length;
    const isInitialLoad = prevMessageCountRef.current === 0 && count > 0;
    prevMessageCountRef.current = count;

    if (isInitialLoad || isNearBottomRef.current) {
      requestAnimationFrame(() => scrollThreadToBottom());
    }
  }, [scrollThreadToBottom, visibleMessages.length]);

  useEffect(
    () => () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (replyTimeoutRef.current) clearTimeout(replyTimeoutRef.current);
      if (deliveredTimeoutRef.current) clearTimeout(deliveredTimeoutRef.current);
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    },
    []
  );

  const scheduleAutoReply = useCallback(
    (conversationId, userMessage) => {
      if (replyTimeoutRef.current) clearTimeout(replyTimeoutRef.current);
      if (deliveredTimeoutRef.current) clearTimeout(deliveredTimeoutRef.current);

      setTypingId(conversationId);

      replyTimeoutRef.current = setTimeout(() => {
        setTypingId(null);

        const current = conversationsRef.current;
        const conversation = current.find((item) => item.id === conversationId);
        if (!conversation) return;

        const replyText = buildAutoReply(conversation, userMessage);
        const isActive = selectedIdRef.current === conversationId;

        onConversationsChange(
          markOutgoingMessagesRead(
            appendIncomingMessage(
              current,
              conversationId,
              { type: 'text', text: replyText },
              { incrementUnread: !isActive }
            ),
            conversationId
          )
        );
      }, getReplyDelay(userMessage));
    },
    [onConversationsChange]
  );

  const pushOutgoing = useCallback(
    (nextConversations, conversationId, userMessage) => {
      onConversationsChange(nextConversations);

      if (disableAutoReply) return;

      const conversation = nextConversations.find((item) => item.id === conversationId);

      if (deliveredTimeoutRef.current) clearTimeout(deliveredTimeoutRef.current);
      deliveredTimeoutRef.current = setTimeout(() => {
        onConversationsChange(
          updateLastOutgoingStatus(conversationsRef.current, conversationId, 'delivered')
        );
      }, 700);

      if (!conversation?.isGroup) {
        scheduleAutoReply(conversationId, userMessage);
      }
    },
    [disableAutoReply, onConversationsChange, scheduleAutoReply]
  );

  const handleSend = useCallback(
    async (text) => {
      const message = (text ?? draft).trim();
      if (!selectedId || !message || sending) return;

      if (onSendText && selected) {
        // WhatsApp-style: clear input + scroll immediately; bubble appears via optimistic pending.
        setDraft('');
        isNearBottomRef.current = true;
        requestAnimationFrame(() => scrollThreadToBottom());
        try {
          await onSendText(selected, message);
          isNearBottomRef.current = true;
          requestAnimationFrame(() => scrollThreadToBottom());
        } catch {
          // toast handled in hook — restore draft if send failed
          setDraft(message);
        }
        return;
      }

      pushOutgoing(appendMessage(conversations, selectedId, message), selectedId, message);
      setDraft('');
      isNearBottomRef.current = true;
      requestAnimationFrame(() => scrollThreadToBottom());
    },
    [
      conversations,
      draft,
      onSendText,
      pushOutgoing,
      scrollThreadToBottom,
      selected,
      selectedId,
      sending,
    ]
  );

  const handleSendAttachment = useCallback(
    async (messageData) => {
      if (!selectedId) return;

      if (onSendAttachmentMessage && selected) {
        try {
          await onSendAttachmentMessage(selected, messageData);
        } catch {
          // toast handled in hook
        }
        return;
      }

      pushOutgoing(appendChatMessage(conversations, selectedId, messageData), selectedId, messageData);
    },
    [conversations, onSendAttachmentMessage, pushOutgoing, selected, selectedId]
  );

  const handleImagePick = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file || !selectedId) return;

      if (!file.type.startsWith('image/')) {
        toast.error('Please choose an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be under 5 MB');
        return;
      }

      try {
        if (isApiMode) {
          handleSendAttachment({
            type: 'file',
            text: '',
            file,
            attachment: { name: file.name, size: file.size, mimeType: file.type },
          });
          toast.success('Image sent');
          return;
        }

        const url = await readFileAsDataUrl(file);
        handleSendAttachment({
          type: 'image',
          text: '',
          attachment: { name: file.name, url, size: file.size, mimeType: file.type },
        });
        toast.success('Image sent');
      } catch {
        toast.error('Could not read image');
      }
    },
    [handleSendAttachment, isApiMode, selectedId]
  );

  const handleFilePick = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file || !selectedId) return;

      if (file.size > 8 * 1024 * 1024) {
        toast.error('File must be under 8 MB');
        return;
      }

      try {
        if (isApiMode) {
          handleSendAttachment({
            type: 'file',
            text: '',
            file,
            attachment: { name: file.name, size: file.size, mimeType: file.type },
          });
          toast.success('File sent');
          return;
        }

        const url = await readFileAsDataUrl(file);
        handleSendAttachment({
          type: 'file',
          text: '',
          attachment: { name: file.name, url, size: file.size, mimeType: file.type },
        });
        toast.success('File sent');
      } catch {
        toast.error('Could not read file');
      }
    },
    [handleSendAttachment, isApiMode, selectedId]
  );

  const handleShareLocation = useCallback(() => {
    const conversation =
      selected ||
      conversations.find((item) => String(item.id) === String(selectedId)) ||
      null;

    if (!conversation) {
      toast.error('Select a chat first');
      return;
    }

    const conversationLocation = conversation?.location || {};
    setLocationInitial({
      title: conversationLocation.title || 'Home location',
      address:
        conversationLocation.address ||
        conversation?.locationLabel ||
        conversation?.address ||
        '',
      latitude: conversationLocation.latitude ?? null,
      longitude: conversationLocation.longitude ?? null,
    });
    setLocationDialogOpen(true);
  }, [conversations, selected, selectedId]);

  const handleConfirmShareLocation = useCallback(
    async (location) => {
      const latitude = Number(location?.latitude);
      const longitude = Number(location?.longitude);

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        Math.abs(latitude) > 90 ||
        Math.abs(longitude) > 180
      ) {
        toast.error('Invalid location coordinates');
        return;
      }

      setSharingLocation(true);
      try {
        await handleSendAttachment({
          type: 'location',
          text: '',
          location: {
            latitude: Number(latitude.toFixed(7)),
            longitude: Number(longitude.toFixed(7)),
          },
        });
        toast.success('Location shared');
        setLocationDialogOpen(false);
      } catch {
        // toast handled upstream
      } finally {
        setSharingLocation(false);
      }
    },
    [handleSendAttachment]
  );

  const stopRecording = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  }, []);

  const startRecording = useCallback(async () => {
    if (!selectedId || recording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorderMime = preferredVoiceRecorderMime();
      const recorder = recorderMime ? new MediaRecorder(stream, { mimeType: recorderMime }) : new MediaRecorder(stream);
      recordingChunksRef.current = [];
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordingChunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        const duration = recordingSecondsRef.current || 1;
        stream.getTracks().forEach((track) => track.stop());
        recordingSecondsRef.current = 0;
        setRecordingSeconds(0);

        try {
          const rawType = recorder.mimeType || recorderMime || '';
          const blob = new Blob(recordingChunksRef.current, { type: rawType || 'audio/webm' });
          if (!blob.size) {
            toast.error('Voice message was empty');
            return;
          }

          // webm does not play on the phone. m4a (Safari) and wav (Chrome) do.
          const file = await toMobilePlayableVoiceFile(blob, rawType);
          if (isApiMode) {
            handleSendAttachment({
              type: 'audio',
              text: '',
              file,
              attachment: {
                name: file.name,
                mimeType: file.type,
                duration,
              },
            });
          } else {
            handleSendAttachment({
              type: 'voice',
              text: '',
              attachment: {
                name: file.name,
                url: URL.createObjectURL(file),
                mimeType: file.type,
                duration,
              },
            });
          }
          toast.success('Voice message sent');
        } catch {
          toast.error('Could not prepare the voice message');
        }
      };

      recorder.start();
      setRecording(true);
      recordingSecondsRef.current = 0;
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        recordingSecondsRef.current += 1;
        setRecordingSeconds(recordingSecondsRef.current);
      }, 1000);
    } catch {
      toast.error('Microphone permission is required');
    }
  }, [handleSendAttachment, isApiMode, recording, selectedId]);

  const handleMicClick = useCallback(() => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [recording, startRecording, stopRecording]);

  const handleNewGroup = useCallback(
    (data) => {
      const conversation = createGroupConversation(data);
      const next = [conversation, ...conversations];
      onConversationsChange(next);
      setSelectedId(conversation.id);
      if (!lgUp) setMobileView('thread');
      toast.success(`Group "${conversation.name}" created`);
    },
    [conversations, lgUp, onConversationsChange]
  );

  const handleRequestDeleteMessage = useCallback((message) => {
    if (!message?.id) return;
    setPendingDeleteMessage(message);
    confirmDeleteMessage.onTrue();
  }, [confirmDeleteMessage]);

  const handleConfirmDeleteMessage = useCallback(async () => {
    if (!pendingDeleteMessage || !onDeleteMessage) return;

    const objectId = String(selected?.objectId || selected?.participantId || '').trim();
    const conversationId = String(selected?.conversationId || selected?.id || '').trim();
    setDeletingMessage(true);
    try {
      await onDeleteMessage(pendingDeleteMessage, objectId, conversationId);
      confirmDeleteMessage.onFalse();
      setPendingDeleteMessage(null);
    } catch {
      // toast handled upstream
    } finally {
      setDeletingMessage(false);
    }
  }, [confirmDeleteMessage, onDeleteMessage, pendingDeleteMessage, selected]);

  const handleRequestDeleteConversation = useCallback(
    (conversation) => {
      const target =
        conversation && typeof conversation === 'object' && conversation.id
          ? conversation
          : selected;
      if (!target) return;
      setPendingDeleteConversation(target);
      confirmDeleteConversation.onTrue();
    },
    [confirmDeleteConversation, selected]
  );

  const handleConfirmDeleteConversation = useCallback(async () => {
    const target = pendingDeleteConversation || selected;
    if (!target || !onDeleteConversation) return;

    const conversationId = String(target.conversationId || target.id || '').trim();
    if (!conversationId) {
      toast.error('Cannot delete this conversation');
      return;
    }

    setDeletingConversation(true);
    try {
      await onDeleteConversation(conversationId);
      confirmDeleteConversation.onFalse();
      setPendingDeleteConversation(null);
      if (String(selectedId) === String(target.id)) {
        setSelectedId(null);
        if (!lgUp) setMobileView('inbox');
      }
    } catch {
      // toast handled upstream
    } finally {
      setDeletingConversation(false);
    }
  }, [
    confirmDeleteConversation,
    lgUp,
    onDeleteConversation,
    pendingDeleteConversation,
    selected,
    selectedId,
  ]);

  const contactEmail = selected?.email || (isApiMode ? '—' : '');

  const isGroupChat = selected?.isGroup;
  // Admin viewing the account reads its chats but cannot send, delete or start conversations.
  const canSendMessage = selected?.canMessage !== false && !viewOnly;
  const canDeleteMessages = typeof onDeleteMessage === 'function' && !viewOnly;
  const canDeleteConversation = typeof onDeleteConversation === 'function' && !viewOnly;

  const renderChatList = () => {
    if (loading && !filtered.length) {
      return <ModuleLoading />;
    }

    if (filtered.length === 0) {
      return (
        <Box sx={{ px: 2, py: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No conversations found
          </Typography>
          {!isApiMode && !viewOnly ? (
            <Button size="small" variant="contained" sx={{ mt: 1.5 }} onClick={newGroupDialog.onTrue}>
              New group chat
            </Button>
          ) : null}
        </Box>
      );
    }

    if (groupByCategory && grouped) {
      const listItemProps = (item) => ({
        item,
        selected: item.id === selectedId,
        onClick: () => handleSelect(item.id),
        onDelete: canDeleteConversation ? handleRequestDeleteConversation : undefined,
      });

      return (
        <>
          {grouped.nextOfKin.length > 0 && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="overline" sx={{ px: 2, color: 'text.disabled', fontSize: 11 }}>
                Next of kin
              </Typography>
              {grouped.nextOfKin.map((item) => (
                <ChatListItem key={item.id} {...listItemProps(item)} />
              ))}
            </Box>
          )}
          {grouped.client.length > 0 && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="overline" sx={{ px: 2, color: 'text.disabled', fontSize: 11 }}>
                Clients / persons
              </Typography>
              {grouped.client.map((item) => (
                <ChatListItem key={item.id} {...listItemProps(item)} />
              ))}
            </Box>
          )}
          {grouped.agency.length > 0 && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="overline" sx={{ px: 2, color: 'text.disabled', fontSize: 11 }}>
                Agencies
              </Typography>
              {grouped.agency.map((item) => (
                <ChatListItem key={item.id} {...listItemProps(item)} />
              ))}
            </Box>
          )}
          {grouped.staff.length > 0 && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="overline" sx={{ px: 2, color: 'text.disabled', fontSize: 11 }}>
                Staff
              </Typography>
              {grouped.staff.map((item) => (
                <ChatListItem key={item.id} {...listItemProps(item)} />
              ))}
            </Box>
          )}
          {grouped.group.length > 0 && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="overline" sx={{ px: 2, color: 'text.disabled', fontSize: 11 }}>
                Groups
              </Typography>
              {grouped.group.map((item) => (
                <ChatListItem key={item.id} {...listItemProps(item)} />
              ))}
            </Box>
          )}
          {grouped.other.map((item) => (
            <ChatListItem key={item.id} {...listItemProps(item)} />
          ))}
        </>
      );
    }

    return filtered.map((item) => (
      <ChatListItem
        key={item.id}
        item={item}
        selected={item.id === selectedId}
        onClick={() => handleSelect(item.id)}
        onDelete={canDeleteConversation ? handleRequestDeleteConversation : undefined}
      />
    ));
  };

  const renderInbox = (
    <Stack sx={{ height: 1, minHeight: 0, overflow: 'hidden', bgcolor: 'background.neutral' }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ px: 2, py: 2 }}>
        <OnlineAvatar label={userInitial} avatarUrl={userAvatarUrl} online={false} size={48} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight={700} noWrap>
            {displayName}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap display="block">
            {userEmail}
          </Typography>
        </Box>
        {!isApiMode && !viewOnly ? (
          <IconButton size="small" onClick={newGroupDialog.onTrue}>
            <Iconify icon="eva:plus-fill" width={22} />
          </IconButton>
        ) : null}
      </Stack>

      <Box sx={{ px: 2, pb: 1.5 }}>
        <TextField
          fullWidth
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2.5,
              bgcolor: 'background.paper',
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" width={20} sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Box sx={{ px: 1, pb: 0.5 }}>
        <Button
          fullWidth
          onClick={() => setChatsOpen((prev) => !prev)}
          endIcon={
            <Iconify
              icon={chatsOpen ? 'eva:arrow-ios-downward-fill' : 'eva:arrow-ios-forward-fill'}
              width={16}
            />
          }
          sx={{
            justifyContent: 'space-between',
            px: 1.5,
            py: 0.75,
            color: 'text.primary',
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          Chats
        </Button>
      </Box>

      <Box
        sx={{
          flex: '1 1 0',
          minHeight: 0,
          overflow: 'hidden',
          display: chatsOpen ? 'flex' : 'none',
          flexDirection: 'column',
        }}
      >
        <Scrollbar sx={{ flex: 1, minHeight: 0, height: 1 }}>{renderChatList()}</Scrollbar>
      </Box>
    </Stack>
  );

  const renderThread = selected ? (
    <Stack sx={{ height: 1, minHeight: 0, bgcolor: 'background.paper' }}>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        {!lgUp && (
          <IconButton onClick={() => setMobileView('inbox')} edge="start">
            <Iconify icon="eva:arrow-back-fill" />
          </IconButton>
        )}
        <OnlineAvatar
          label={selected.avatar}
          avatarUrl={selected.avatarUrl || resolveProfileAssetUrl(selected.chatIcon || selected.profileIcon)}
          online={!isGroupChat && isContactOnline(selected)}
          size={40}
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight={700} noWrap>
            {selected.name}
          </Typography>
          {!isGroupChat && (
            <Typography
              variant="caption"
              noWrap
              display="block"
              sx={{
                color: isContactOnline(selected) ? 'success.dark' : 'text.secondary',
                fontWeight: 600,
              }}
            >
              {isContactOnline(selected) ? 'Active now' : 'Offline'}
            </Typography>
          )}
          {(selected.lovedOne || selected.relationship || selected.locationLabel) && (
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {[
                selected.relationship && selected.lovedOne
                  ? `${selected.relationship} of ${selected.lovedOne}`
                  : selected.lovedOne || selected.relationship,
                selected.locationLabel,
              ]
                .filter(Boolean)
                .join(' · ')}
            </Typography>
          )}
        </Box>
        {mdUp && (
          <Tooltip title={detailsOpen ? 'Hide details' : 'Show details & attachments'}>
            <IconButton onClick={() => setDetailsOpen((prev) => !prev)} color={detailsOpen ? 'primary' : 'default'}>
              <Iconify icon={detailsOpen ? 'eva:arrow-ios-forward-fill' : 'eva:arrow-ios-back-fill'} />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      <Box
        ref={threadEndRef}
        onScroll={handleThreadScroll}
        sx={{
          flex: 1,
          minHeight: 0,
          overflowX: 'hidden',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <Box
          sx={{
            width: 1,
            minHeight: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            px: { xs: 1.5, sm: 2, md: 3 },
            py: 3,
          }}
        >
          {messagesLoading && !visibleMessages.length ? (
            <ModuleLoading sx={{ flex: 1, minHeight: 240 }} />
          ) : (
            <>
              {visibleMessages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onDelete={canDeleteMessages ? handleRequestDeleteMessage : undefined}
                />
              ))}
              {typingId === selected.id && <TypingIndicator />}
            </>
          )}
        </Box>
      </Box>

      <Box sx={{ width: 1, px: { xs: 1.5, md: 2.5 }, pb: { xs: 1.5, md: 2 }, pt: 1 }}>
        {recording && (
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1, px: 0.5 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: 'error.main',
                animation: 'pulse 1s infinite',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.35 },
                },
              }}
            />
            <Typography variant="caption" color="error.main" fontWeight={600}>
              Recording {recordingSeconds}s — tap mic to send
            </Typography>
          </Stack>
        )}

        <TextField
          fullWidth
          multiline
          minRows={1}
          maxRows={6}
          placeholder={
            viewOnly
              ? 'View only — admin cannot send messages'
              : canSendMessage
                ? 'Type a message'
                : 'Messaging is disabled for this chat'
          }
          value={draft}
          disabled={!canSendMessage}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (!canSendMessage || sending) return;
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              pr: 0.5,
              alignItems: 'center',
              flexWrap: 'nowrap',
              bgcolor: 'background.neutral',
            },
            '& .MuiInputAdornment-root': {
              alignSelf: 'center',
              flexShrink: 0,
              height: 'auto',
              maxHeight: 'none',
              marginTop: 0,
            },
            '& .MuiOutlinedInput-input': {
              overflowWrap: 'anywhere',
              wordBreak: 'break-word',
            },
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end" sx={{ mr: 0.5 }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={{ xs: 0, sm: 0.25 }}
                  sx={{ flexShrink: 0, '& .MuiIconButton-root': { p: { xs: 0.75, sm: 1 } } }}
                >
                  {!isApiMode ? (
                    <IconButton
                      size="small"
                      onClick={() => imageInputRef.current?.click()}
                      title="Share photo"
                      disabled={!canSendMessage}
                    >
                      <Iconify icon="solar:gallery-add-bold" width={20} />
                    </IconButton>
                  ) : null}
                  <IconButton
                    size="small"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      handleShareLocation();
                    }}
                    title="Share home location"
                    disabled={!canSendMessage}
                  >
                    <Iconify icon="solar:map-point-bold" width={20} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach file"
                    disabled={!canSendMessage}
                  >
                    <Iconify icon="eva:attach-2-fill" width={20} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={handleMicClick}
                    title="Voice message"
                    disabled={!canSendMessage}
                    sx={{ color: recording ? 'error.main' : 'text.secondary' }}
                  >
                    <Iconify icon="solar:microphone-bold" width={20} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleSend()}
                    disabled={!canSendMessage || !draft.trim() || sending}
                    sx={{
                      color: 'primary.dark',
                      '&.Mui-disabled': { color: 'text.disabled' },
                    }}
                  >
                    {sending ? (
                      <CircularProgress size={18} thickness={5} />
                    ) : (
                      <Iconify icon="solar:plain-2-bold" width={22} />
                    )}
                  </IconButton>
                </Stack>
              </InputAdornment>
            ),
          }}
        />
      </Box>
    </Stack>
  ) : (
    <Stack alignItems="center" justifyContent="center" sx={{ height: 1, bgcolor: 'background.paper' }}>
      <Iconify icon="solar:chat-round-dots-bold-duotone" width={72} sx={{ color: 'text.disabled', mb: 2 }} />
      <Typography variant="h6">Select a chat</Typography>
      <Typography variant="body2" color="text.secondary">
        Pick a conversation from the left panel
      </Typography>
    </Stack>
  );

  const renderDetails = selected ? (
    <Stack sx={{ height: 1, minHeight: 0, bgcolor: 'background.neutral' }}>
      {mdUp && (
        <Box sx={{ px: 1, pt: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <IconButton size="small" onClick={() => setDetailsOpen(false)} aria-label="Close details">
            <Iconify icon="eva:arrow-ios-forward-fill" width={18} />
          </IconButton>
        </Box>
      )}

      <Scrollbar sx={{ flex: 1 }}>
        <Stack alignItems="center" sx={{ px: 3, pt: mdUp ? 1 : 3, pb: 3, textAlign: 'center' }}>
          <OnlineAvatar
            label={selected.avatar}
            avatarUrl={selected.avatarUrl || resolveProfileAssetUrl(selected.chatIcon || selected.profileIcon)}
            online={!isGroupChat && isContactOnline(selected)}
            size={88}
            sx={{ mb: 2 }}
          />
          <Typography variant="h6" fontWeight={700}>
            {selected.name}
          </Typography>
          {!isGroupChat && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {selected.relationship && selected.lovedOne
                ? `${selected.relationship} of ${selected.lovedOne}`
                : selected.lovedOne || contactEmail}
            </Typography>
          )}
          {!isGroupChat && selected.locationLabel && (
            <Stack direction="row" spacing={0.75} alignItems="center" justifyContent="center" sx={{ mt: 1 }}>
              <Iconify icon="solar:map-point-bold" width={16} sx={{ color: 'primary.main' }} />
              <Typography variant="caption" color="text.secondary">
                {selected.locationLabel}
              </Typography>
            </Stack>
          )}
          {isGroupChat && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Group chat
            </Typography>
          )}
          {!isGroupChat && selected.location && buildMapsUrl(selected.location) && (
            <Button
              size="small"
              sx={{ mt: 1.25 }}
              component="a"
              href={buildMapsUrl(selected.location)}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<Iconify icon="solar:map-arrow-right-bold" width={16} />}
            >
              Open home in Maps
            </Button>
          )}
          {!isGroupChat && isContactOnline(selected) ? (
            <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 1.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
              <Typography variant="caption" sx={{ color: 'success.dark', fontWeight: 600 }}>
                Active now
              </Typography>
            </Stack>
          ) : !isGroupChat ? (
            <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 1.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'text.disabled' }} />
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Offline
              </Typography>
            </Stack>
          ) : null}
        </Stack>

        <Divider />

        <Box sx={{ px: 2, py: 1.5 }}>
          <Button
            fullWidth
            onClick={() => setAttachmentsOpen((prev) => !prev)}
            endIcon={
              <Iconify
                icon={attachmentsOpen ? 'eva:arrow-ios-downward-fill' : 'eva:arrow-ios-forward-fill'}
                width={16}
              />
            }
            sx={{
              justifyContent: 'space-between',
              color: 'text.secondary',
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: 0.5,
            }}
          >
            ATTACHMENTS ({attachments.length})
          </Button>
          <Collapse in={attachmentsOpen}>
            {attachments.length === 0 ? (
              <Typography variant="body2" color="text.disabled" sx={{ px: 1, py: 2, textAlign: 'center' }}>
                No attachments shared yet
              </Typography>
            ) : (
              <Stack spacing={1} sx={{ py: 1 }}>
                {attachments.map((item) => {
                  const canOpen = Boolean(item.url);
                  const isLocation = item.type === 'location';

                  const handleOpenAttachment = () => {
                    if (!canOpen) return;
                    openAttachmentInNewTab(item.url);
                  };

                  const handleDownloadAttachment = async (event) => {
                    event.stopPropagation();
                    if (!canOpen) return;

                    if (isLocation) {
                      handleOpenAttachment();
                      return;
                    }

                    await downloadAttachmentFile(item.url, item.name);
                  };

                  return (
                    <Stack
                      key={item.id}
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      onClick={canOpen ? handleOpenAttachment : undefined}
                      sx={{
                        px: 1,
                        py: 0.75,
                        borderRadius: 1,
                        cursor: canOpen ? 'pointer' : 'default',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    >
                      <Iconify
                        icon={
                          item.type === 'image' || (item.type === 'file' && item.mimeType?.startsWith('image/'))
                            ? 'solar:gallery-bold'
                            : item.type === 'audio' || item.type === 'voice'
                              ? 'solar:microphone-bold'
                              : item.type === 'location'
                                ? 'solar:map-point-bold'
                                : 'eva:file-fill'
                        }
                        width={18}
                        sx={{ color: 'primary.light' }}
                      />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="caption" fontWeight={600} noWrap display="block">
                          {item.name}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          {item.at}
                          {item.size ? ` · ${formatFileSize(item.size)}` : ''}
                        </Typography>
                      </Box>
                      {canOpen ? (
                        <IconButton
                          size="small"
                          onClick={handleDownloadAttachment}
                          title={isLocation ? 'Open location' : 'Download file'}
                          sx={{ color: 'primary.main' }}
                        >
                          <Iconify
                            icon={isLocation ? 'eva:external-link-fill' : 'eva:download-fill'}
                            width={16}
                          />
                        </IconButton>
                      ) : null}
                    </Stack>
                  );
                })}
              </Stack>
            )}
          </Collapse>
        </Box>
      </Scrollbar>
    </Stack>
  ) : null;

  return (
    <>
      {!isApiMode ? (
        <input ref={imageInputRef} type="file" accept="image/*" hidden onChange={handleImagePick} />
      ) : null}
      <input
        ref={fileInputRef}
        type="file"
        accept={isApiMode ? 'image/*,*/*' : undefined}
        hidden
        onChange={handleFilePick}
      />

      <Card
        sx={{
          position: 'relative',
          width: 1,
          maxWidth: 1,
          height: {
            xs: 'calc(100dvh - var(--layout-header-mobile-height) - var(--layout-dashboard-content-pt) - 24px)',
            lg: 'calc(100dvh - var(--layout-header-desktop-height) - var(--layout-dashboard-content-pt) - 28px)',
          },
          maxHeight: {
            xs: 'calc(100dvh - var(--layout-header-mobile-height) - var(--layout-dashboard-content-pt) - 24px)',
            lg: 'calc(100dvh - var(--layout-header-desktop-height) - var(--layout-dashboard-content-pt) - 28px)',
          },
          minHeight: 320,
          display: 'flex',
          overflow: 'hidden',
          borderRadius: 3,
          boxShadow: theme.shadows[8],
        }}
      >
        <Box
          sx={{
            width: { xs: 1, lg: 300 },
            flex: { xs: '1 1 auto', lg: '0 0 auto' },
            minWidth: 0,
            maxWidth: 1,
            borderRight: '1px solid',
            borderColor: 'divider',
            display: { xs: mobileView === 'inbox' ? 'flex' : 'none', lg: 'flex' },
            flexDirection: 'column',
            minHeight: 0,
          }}
        >
          {renderInbox}
        </Box>

        <Box
          sx={{
            flex: 1,
            width: { xs: 1, lg: 'auto' },
            minWidth: 0,
            minHeight: 0,
            display: { xs: mobileView === 'thread' ? 'flex' : 'none', lg: 'flex' },
            flexDirection: 'column',
          }}
        >
          {renderThread}
        </Box>

        {lgUp && detailsOpen && selected && (
          <Box
            sx={{
              width: 280,
              flexShrink: 0,
              borderLeft: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
            }}
          >
            {renderDetails}
          </Box>
        )}

        {mdUp && !lgUp && detailsOpen && selected && mobileView === 'thread' && (
          <Box
            sx={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: 280,
              zIndex: 10,
              borderLeft: '1px solid',
              borderColor: 'divider',
              boxShadow: theme.shadows[16],
              display: { xs: 'none', md: 'flex' },
              flexDirection: 'column',
            }}
          >
            {renderDetails}
          </Box>
        )}
      </Card>

      {!isApiMode ? (
        <NewGroupChatDialog
          open={newGroupDialog.value}
          onClose={newGroupDialog.onFalse}
          onSubmit={handleNewGroup}
        />
      ) : null}

      <ConfirmDialog
        open={confirmDeleteMessage.value}
        onClose={() => {
          if (deletingMessage) return;
          confirmDeleteMessage.onFalse();
          setPendingDeleteMessage(null);
        }}
        title="Delete message?"
        content="This message will be permanently deleted."
        action={
          <Button
            variant="contained"
            color="error"
            loading={deletingMessage}
            disabled={deletingMessage}
            onClick={handleConfirmDeleteMessage}
          >
            Delete
          </Button>
        }
      />

      <ConfirmDialog
        open={confirmDeleteConversation.value}
        onClose={() => {
          if (deletingConversation) return;
          confirmDeleteConversation.onFalse();
          setPendingDeleteConversation(null);
        }}
        title="Delete conversation?"
        content={`Delete chat with ${pendingDeleteConversation?.name || selected?.name || 'this contact'}? This cannot be undone.`}
        action={
          <Button
            variant="contained"
            color="error"
            loading={deletingConversation}
            disabled={deletingConversation}
            onClick={handleConfirmDeleteConversation}
          >
            Delete
          </Button>
        }
      />

      <ChatLocationPickerDialog
        open={locationDialogOpen}
        initialLocation={locationInitial}
        submitting={sharingLocation}
        onClose={() => {
          if (sharingLocation) return;
          setLocationDialogOpen(false);
        }}
        onShare={handleConfirmShareLocation}
      />
    </>
  );
}
