import { useMemo, useEffect } from 'react';

import { usePathname } from 'src/routes/hooks';

import { useViewOnly } from 'src/hooks/use-view-only';
import {
  useGetSidebarCountsQuery,
  useMarkSidebarSeenMutation,
} from 'src/store/Reducer/sidebar-counts-api';

import { Label } from 'src/components/label';


const NOT_CLEARED_ON_VISIT = ['chat'];

function badge(count) {
  return (
    <Label
      color="error"
      variant="filled"
      sx={{
        height: 20,
        minWidth: 20,
        px: 0.75,
        borderRadius: 10,
        fontSize: 12,
        fontWeight: 700,
        lineHeight: 1,
      }}
    >
      {count > 99 ? '99+' : count}
    </Label>
  );
}

function withCountBadges(items = [], counts = {}) {
  return items.map((item) => {
    const children = item.children ? withCountBadges(item.children, counts) : undefined;
    const own = item.countKey ? counts[item.countKey] || 0 : 0;
    const fromChildren = (children || []).reduce((sum, child) => sum + (child.count || 0), 0);
    const count = own + fromChildren;

    return {
      ...item,
      ...(children && { children }),
      count,
      ...(count > 0 && { info: badge(count) }),
    };
  });
}

function findCountKey(items = [], pathname = '') {
  let best = null;

  const visit = (list) =>
    list.forEach((item) => {
      const path = String(item.path || '');
      const matches = path && (pathname === path || pathname.startsWith(`${path}/`));
      if (item.countKey && matches && (!best || path.length > best.path.length)) {
        best = { path, key: item.countKey };
      }
      if (item.children) visit(item.children);
    });

  visit(items);
  return best?.key || null;
}


export function useNavCountBadges(navData, apiPrefix) {
  const viewOnly = useViewOnly();
  const pathname = usePathname();

  const { data: counts } = useGetSidebarCountsQuery(apiPrefix, {
    skip: !apiPrefix,
    refetchOnFocus: false,
    refetchOnReconnect: false,
    refetchOnMountOrArgChange: false,
  });
  const [markSeen] = useMarkSidebarSeenMutation();

  const allItems = useMemo(() => navData.flatMap((section) => section.items || []), [navData]);
  const currentKey = useMemo(() => findCountKey(allItems, pathname), [allItems, pathname]);
  const currentCount = (currentKey && counts?.[currentKey]) || 0;

  useEffect(() => {
    if (!apiPrefix || viewOnly || !currentKey || NOT_CLEARED_ON_VISIT.includes(currentKey)) return;
    if (currentCount > 0) markSeen({ prefix: apiPrefix, section: currentKey });
  }, [apiPrefix, viewOnly, currentKey, currentCount, markSeen]);

  return useMemo(() => {
    if (!counts) return navData;
    return navData.map((section) => ({
      ...section,
      items: withCountBadges(section.items, counts),
    }));
  }, [navData, counts]);
}
