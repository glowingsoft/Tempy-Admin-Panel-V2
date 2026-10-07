import { createApi } from '@reduxjs/toolkit/query/react';

import {
  buildNotificationReadPayload,
  extractNotificationsList,
  mapNotificationFromApi,
  normalizeNotificationStatus,
  readServerUnreadCount,
} from 'src/sections/notifications/notifications-api-utils';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';

export const notificationsApi = createApi({
  reducerPath: 'notificationsApi',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: ['Notification'],

  endpoints: (builder) => ({
    getNotifications: builder.query({
      query: ({ page = 0, limit = 50, status = '', keyword = '' } = {}) => {
        const params = {
          page: page + 1,
          limit,
        };
        if (keyword) params.keyword = keyword;
        if (status && status !== 'all') params.status = status;

        return {
          url: API_ROUTES.NOTIFICATIONS,
          method: 'GET',
          params,
        };
      },
      transformResponse: (response) => {
        const list = extractNotificationsList(response)
          .map(mapNotificationFromApi)
          .filter((item) => item.id);

        const unreadFromList = list.filter((item) => item.isUnRead).length;
        const serverUnread = readServerUnreadCount(response);

        return {
          data: list,
          meta: response?.meta || {},
          message: response?.message || '',
          total_length: response?.meta?.totalRecords ?? list.length,
          unreadCount: serverUnread == null ? unreadFromList : Math.max(serverUnread, unreadFromList),
        };
      },
      providesTags: (result) =>
        result?.data?.length
          ? [
              ...result.data.map((item) => ({ type: 'Notification', id: item.id })),
              { type: 'Notification', id: 'LIST' },
            ]
          : [{ type: 'Notification', id: 'LIST' }],
    }),

    markNotificationRead: builder.mutation({
      query: ({ id, status } = {}) => ({
        url: API_ROUTES.NOTIFICATIONS_READ_BY_ID(id),
        method: 'PUT',
        body: buildNotificationReadPayload({ status, markRead: true }),
      }),
      async onQueryStarted({ id, status }, { dispatch, getState, queryFulfilled }) {
        const patchResults = [];

        const markItemRead = (draft) => {
          if (!draft?.data) return;

          const item = draft.data.find((entry) => String(entry.id) === String(id));
          if (item) {
            item.isUnRead = false;
            item.isRead = true;
            if (status) {
              item.status = normalizeNotificationStatus(status);
            }
          }

          draft.unreadCount = draft.data.filter((entry) => entry.isUnRead).length;
        };

        const cachedArgs = notificationsApi.util.selectCachedArgsForQuery(getState(), 'getNotifications');
        const argsList = cachedArgs.length ? cachedArgs : [{ page: 0, limit: 50 }];

        argsList.forEach((args) => {
          patchResults.push(
            dispatch(notificationsApi.util.updateQueryData('getNotifications', args, markItemRead))
          );
        });

        try {
          await queryFulfilled;
        } catch {
          patchResults.forEach((patch) => patch.undo());
        }
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Notification', id },
        { type: 'Notification', id: 'LIST' },
      ],
    }),
  }),
});

export const { useGetNotificationsQuery, useMarkNotificationReadMutation } = notificationsApi;
