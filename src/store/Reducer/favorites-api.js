import { createApi } from '@reduxjs/toolkit/query/react';

import {
  extractFavoritesList,
  favoritesListArg,
  filterFavoritesForDashboard,
  isActiveFavorite,
  mapFavoriteFromApi,
} from 'src/sections/staff/favorites-api-utils';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';

function upsertFavoriteInCache(dispatch, getState, mapped, listArg) {
  if (!mapped?.id || !mapped?.favoriteUserId) return;

  const current = favoritesApi.endpoints.getFavorites.select(listArg)(getState())?.data;
  const prevList = current?.data || [];
  const nextList = [
    ...prevList.filter((item) => item.favoriteUserId !== mapped.favoriteUserId),
    mapped,
  ];

  dispatch(
    favoritesApi.util.upsertQueryData('getFavorites', listArg, {
      data: nextList,
      meta: current?.meta || {},
      message: current?.message || '',
      total_length: nextList.length,
    })
  );
}

function removeFavoriteFromCache(dispatch, getState, favoriteId, listArg) {
  const id = String(favoriteId || '');
  if (!id) return;

  const current = favoritesApi.endpoints.getFavorites.select(listArg)(getState())?.data;
  if (!current?.data) return;

  const nextList = current.data.filter((item) => item.id !== id);

  dispatch(
    favoritesApi.util.upsertQueryData('getFavorites', listArg, {
      ...current,
      data: nextList,
      total_length: nextList.length,
    })
  );
}

export const favoritesApi = createApi({
  reducerPath: 'favoritesApi',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: ['Favorite'],

  endpoints: (builder) => ({
    getFavorites: builder.query({
      query: ({ page = 0, limit = 200, keyword = '', accountType = '' } = {}) => {
        const params = {
          page: page + 1,
          limit,
        };
        if (keyword) params.keyword = keyword;
        if (accountType) params.accountType = accountType;

        return {
          url: API_ROUTES.FAVORITES,
          method: 'GET',
          params,
        };
      },
      transformResponse: (response, _meta, arg) => {
        const dashboardKey = arg?.accountType || '';
        const list = filterFavoritesForDashboard(
          extractFavoritesList(response)
            .map((item) => mapFavoriteFromApi(item, dashboardKey))
            .filter((item) => item.id && item.favoriteUserId && isActiveFavorite(item)),
          dashboardKey
        );

        return {
          data: list,
          meta: response?.meta || {},
          message: response?.message || '',
          total_length: response?.meta?.totalRecords ?? list.length,
        };
      },
      serializeQueryArgs: ({ queryArgs }) =>
        `favorites-${queryArgs?.accountType || 'all'}-${queryArgs?.page ?? 0}-${queryArgs?.limit ?? 200}`,
      providesTags: (result, _error, arg) =>
        result?.data?.length
          ? [
              ...result.data.map((item) => ({ type: 'Favorite', id: item.id })),
              { type: 'Favorite', id: `LIST-${arg?.accountType || 'all'}` },
            ]
          : [{ type: 'Favorite', id: `LIST-${arg?.accountType || 'all'}` }],
    }),

    createFavorite: builder.mutation({
      query: ({ favoriteUser }) => ({
        url: API_ROUTES.FAVORITES,
        method: 'POST',
        body: { favoriteUser },
      }),
      async onQueryStarted(arg, { dispatch, getState, queryFulfilled }) {
        try {
          const { data: response } = await queryFulfilled;
          const dashboardKey = arg?.accountType || 'care_home';
          const mapped = mapFavoriteFromApi(response?.data ?? response, dashboardKey);
          upsertFavoriteInCache(dispatch, getState, mapped, favoritesListArg(dashboardKey));
        } catch {
          // caller shows toast
        }
      },
    }),

    deleteFavorite: builder.mutation({
      query: ({ id, accountType }) => ({
        url: API_ROUTES.FAVORITES_BY_ID(id),
        method: 'DELETE',
      }),
      async onQueryStarted(arg, { dispatch, getState, queryFulfilled }) {
        const listArg = favoritesListArg(arg?.accountType);
        removeFavoriteFromCache(dispatch, getState, arg?.id, listArg);
        try {
          await queryFulfilled;
        } catch {
          dispatch(
            favoritesApi.util.invalidateTags([
              { type: 'Favorite', id: `LIST-${arg?.accountType || 'all'}` },
            ])
          );
        }
      },
    }),
  }),
});

export const {
  useGetFavoritesQuery,
  useLazyGetFavoritesQuery,
  useCreateFavoriteMutation,
  useDeleteFavoriteMutation,
} = favoritesApi;

export { favoritesListArg };
