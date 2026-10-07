import { createApi } from '@reduxjs/toolkit/query/react';

import {
  buildConversationActionPayload,
  buildSendMessagePayload,
  extractConversationsList,
  extractMessagesList,
  mapConversationFromApi,
  mapMessageFromApi,
  resolveSendMessageResponse,
  sortMessagesChronologically,
} from 'src/sections/messaging/conversations-api-utils';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';

export const conversationsApi = createApi({
  reducerPath: 'conversationsApi',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: ['Conversation', 'ConversationMessage'],

  endpoints: (builder) => ({
    /** GET /conversations?page=1&limit=10 */
    getConversations: builder.query({
      query: ({ page = 0, limit = 20, keyword = '', action = '' } = {}) => {
        const params = {
          page: page + 1,
          limit,
        };
        if (keyword) params.keyword = keyword;
        if (action && action !== 'all') params.action = action;

        return {
          url: API_ROUTES.CONVERSATIONS,
          method: 'GET',
          params,
        };
      },
      transformResponse: (response, _meta, arg) => {
        const currentUserId = arg?.currentUserId || '';
        const list = extractConversationsList(response);
        const data = list
          .map((item) => mapConversationFromApi(item, currentUserId))
          .filter((item) => item.id);

        return {
          data,
          meta: response?.meta || {},
          message: response?.message || '',
          total_length: response?.meta?.totalRecords ?? data.length,
        };
      },
      providesTags: (result) =>
        result?.data?.length
          ? [
              ...result.data.map((item) => ({ type: 'Conversation', id: item.id })),
              { type: 'Conversation', id: 'LIST' },
            ]
          : [{ type: 'Conversation', id: 'LIST' }],
    }),

    getConversationMessages: builder.query({
      query: ({ objectId, page = 0, limit = 50 } = {}) => ({
        url: API_ROUTES.CONVERSATIONS_MESSAGES,
        method: 'GET',
        params: {
          page: page + 1,
          limit,
          objectId,
        },
      }),
      transformResponse: (response, _meta, arg) => {
        const currentUserId = arg?.currentUserId || '';
        const list = extractMessagesList(response);
        const data = sortMessagesChronologically(
          list
            .map((item) => mapMessageFromApi(item, currentUserId))
            .filter((item) => item.id)
        );

        return {
          data,
          meta: response?.meta || {},
          message: response?.message || '',
          total_length: response?.meta?.totalRecords ?? data.length,
        };
      },
      providesTags: (_result, _error, arg) => [
        { type: 'ConversationMessage', id: `OBJECT-${arg?.objectId || 'none'}` },
      ],
    }),


    sendConversationMessage: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.CONVERSATIONS_SEND_MESSAGE,
        method: 'POST',
        body: buildSendMessagePayload(body),
      }),
      transformResponse: (response, _meta, arg) => {
        const currentUserId = arg?.currentUserId || '';
        const parsed = resolveSendMessageResponse(response);
        const message = mapMessageFromApi(parsed.messageRaw, currentUserId);

        return {
          ...parsed,
          message: message?.id ? message : null,
        };
      },
      invalidatesTags: (result, _error, arg) => {
        const tags = [{ type: 'Conversation', id: 'LIST' }];
        const conversationId = String(result?.conversationId || arg?.conversationId || '').trim();
        const objectId = String(arg?.participantId || arg?.objectId || '').trim();

        if (conversationId) {
          tags.push({ type: 'Conversation', id: conversationId });
        }
        if (objectId) {
          tags.push({ type: 'ConversationMessage', id: `OBJECT-${objectId}` });
        }
        return tags;
      },
    }),

    updateConversationAction: builder.mutation({
      query: ({ conversationId, action }) => ({
        url: API_ROUTES.CONVERSATIONS_ACTION(conversationId),
        method: 'PUT',
        body: buildConversationActionPayload(action),
      }),
      invalidatesTags: (_result, _error, { conversationId }) => [
        { type: 'Conversation', id: conversationId },
        { type: 'Conversation', id: 'LIST' },
      ],
    }),

    deleteConversationMessage: builder.mutation({
      query: (arg) => {
        const messageId = String(
          typeof arg === 'object' ? arg?.messageId || arg?.id || arg?._id : arg || ''
        ).trim();
        return {
          url: API_ROUTES.CONVERSATIONS_MESSAGE_BY_ID(messageId),
          method: 'DELETE',
        };
      },
      // Manual refetch after delete — avoids duplicate auto-refetch from invalidatesTags.
      invalidatesTags: [],
    }),

    deleteConversation: builder.mutation({
      query: (arg) => {
        const conversationId =
          typeof arg === 'object'
            ? String(arg?.conversationId || arg?.id || '').trim()
            : String(arg || '').trim();

        return {
          url: API_ROUTES.CONVERSATIONS_BY_ID(conversationId),
          method: 'DELETE',
        };
      },
      invalidatesTags: (_result, _error, arg) => {
        const conversationId =
          typeof arg === 'object'
            ? String(arg?.conversationId || arg?.id || '').trim()
            : String(arg || '').trim();
        return [
          { type: 'Conversation', id: conversationId },
          { type: 'Conversation', id: 'LIST' },
        ];
      },
    }),
  }),
});

export const {
  useGetConversationsQuery,
  useGetConversationMessagesQuery,
  useSendConversationMessageMutation,
  useUpdateConversationActionMutation,
  useDeleteConversationMessageMutation,
  useDeleteConversationMutation,
} = conversationsApi;
