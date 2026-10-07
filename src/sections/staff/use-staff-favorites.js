import { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { toast } from 'src/components/snackbar';

import {
  favoritesListArg,
  useCreateFavoriteMutation,
  useDeleteFavoriteMutation,
  useGetFavoritesQuery,
} from 'src/store/Reducer/favorites-api';

import {
  mapFavoriteFromApi,
  resolveFavoriteDashboardKey,
  resolveFavoriteUserId,
} from './favorites-api-utils';

// ----------------------------------------------------------------------

/**
 * Staff-details favourites: POST/DELETE for current dashboard only (no GET).
 */
export function useStaffFavorites({ skip = true } = {}) {
  const { user } = useSelector((state) => state.user);
  const dashboardKey = useMemo(() => resolveFavoriteDashboardKey(user), [user]);
  const listArg = useMemo(() => favoritesListArg(dashboardKey), [dashboardKey]);

  const { data: cacheData } = useGetFavoritesQuery(listArg, { skip });

  const [localByUserId, setLocalByUserId] = useState(() => new Map());
  const [createFavorite, { isLoading: creating }] = useCreateFavoriteMutation();
  const [deleteFavorite, { isLoading: deleting }] = useDeleteFavoriteMutation();

  const favoriteByUserId = useMemo(() => {
    const map = new Map();

    localByUserId.forEach((value, key) => {
      if (String(key).startsWith(`${dashboardKey}:`)) {
        map.set(String(key).slice(dashboardKey.length + 1), value);
      }
    });

    (cacheData?.data || []).forEach((favorite) => {
      if (favorite.favoriteUserId) {
        map.set(String(favorite.favoriteUserId), favorite);
      }
    });

    return map;
  }, [cacheData?.data, dashboardKey, localByUserId]);

  const isFavoriteUser = useCallback(
    (userId) => {
      const id = String(userId || '').trim();
      return Boolean(id && favoriteByUserId.has(id));
    },
    [favoriteByUserId]
  );

  const isFavoriteStaff = useCallback(
    (staff) => isFavoriteUser(resolveFavoriteUserId(staff)),
    [isFavoriteUser]
  );

  const toggleFavoriteUser = useCallback(
    async (userId) => {
      const id = String(userId || '').trim();
      if (!id) {
        toast.error('Staff id is missing.');
        return false;
      }

      const localKey = `${dashboardKey}:${id}`;
      const existing = favoriteByUserId.get(id);

      try {
        if (existing?.id) {
          await deleteFavorite({ id: existing.id, accountType: dashboardKey }).unwrap();
          setLocalByUserId((prev) => {
            const next = new Map(prev);
            next.delete(localKey);
            return next;
          });
          toast.success('Removed from favourites');
          return true;
        }

        const response = await createFavorite({
          favoriteUser: id,
          accountType: dashboardKey,
        }).unwrap();

        const mapped = mapFavoriteFromApi(response?.data ?? response, dashboardKey);
        const record = mapped.id
          ? mapped
          : {
              id: `local-${id}`,
              favoriteUserId: id,
              accountType: dashboardKey,
              status: 'active',
            };

        setLocalByUserId((prev) => {
          const next = new Map(prev);
          next.set(localKey, record);
          return next;
        });
        toast.success('Added to favourites');
        return true;
      } catch (err) {
        toast.error(
          err?.data?.message || err?.error || err?.message || 'Could not update favourite'
        );
        return false;
      }
    },
    [createFavorite, dashboardKey, deleteFavorite, favoriteByUserId]
  );

  const toggleFavoriteStaff = useCallback(
    (staff) => toggleFavoriteUser(resolveFavoriteUserId(staff)),
    [toggleFavoriteUser]
  );

  return {
    dashboardKey,
    favorites: Array.from(favoriteByUserId.values()),
    favoriteByUserId,
    isFavoriteUser,
    isFavoriteStaff,
    toggleFavoriteUser,
    toggleFavoriteStaff,
    busy: creating || deleting,
  };
}
