import { useEffect, useRef } from 'react';

import Typography from '@mui/material/Typography';

import { useSearchParams } from 'src/routes/hooks';

import { DashboardContent } from 'src/layouts/dashboard';

import { DashboardMessagesPanel } from './dashboard-messages-panel';
import { useConversationsMessaging } from './use-conversations-messaging';
import { ModuleLoading } from 'src/components/loading-screen';

// ----------------------------------------------------------------------

export function ApiMessagesView({ groupByCategory = true } = {}) {
  const searchParams = useSearchParams();
  const participantId = searchParams.get('participantId') || '';
  const participantName = searchParams.get('name') || '';
  const participantEmail = searchParams.get('email') || '';
  const syncedParticipantRef = useRef('');

  const messaging = useConversationsMessaging({
    preferredParticipantId: participantId,
  });
  const { startDirectChat, initialLoading } = messaging;

  useEffect(() => {
    const id = String(participantId || '').trim();
    if (!id || initialLoading) return;
    if (syncedParticipantRef.current === id) return;

    syncedParticipantRef.current = id;
    startDirectChat({
      id,
      name: participantName || 'Contact',
      email: participantEmail || '',
    });
  }, [initialLoading, participantEmail, participantId, participantName, startDirectChat]);

  return (
    <DashboardContent
      maxWidth={false}
      sx={{
        px: { xs: 1, md: 1.5 },
        pb: { xs: 1, lg: 1.5 },
        minHeight: 0,
      }}
    >
      {messaging.apiErrorMessage ? (
        <Typography color="error" variant="body2" sx={{ mb: 2 }}>
          {messaging.apiErrorMessage}
        </Typography>
      ) : null}

      {/* One loader for the whole panel — its list/thread loaders would otherwise stack with it. */}
      {messaging.initialLoading ? (
        <ModuleLoading />
      ) : (
      <DashboardMessagesPanel
        conversations={messaging.conversations}
        selectedConversationId={messaging.selectedConversationId}
        threadMessages={messaging.selectedMessages}
        onConversationsChange={messaging.onConversationsChange}
        onSendText={messaging.onSendText}
        onSendAttachmentMessage={messaging.onSendAttachment}
        onSelectConversation={messaging.onSelectConversation}
        onDeleteMessage={messaging.onDeleteMessage}
        onDeleteConversation={messaging.onDeleteConversation}
        disableAutoReply
        apiMode
        loading={messaging.initialLoading}
        messagesLoading={messaging.isMessagesFetching}
        sending={messaging.isSending}
        apiErrorMessage={messaging.apiErrorMessage}
        groupByCategory={groupByCategory}
      />
      )}
    </DashboardContent>
  );
}

export const MessagesView = ApiMessagesView;
