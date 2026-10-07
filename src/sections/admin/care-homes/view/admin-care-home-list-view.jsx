import { useCallback } from 'react';

import { useRouter } from 'src/routes/hooks';

import { useDispatch, useSelector } from 'react-redux';

import { ADMIN_CUSTOMER_TABLE_HEAD, ADMIN_MENU_USER_TYPE } from '../../shared/admin-users-api-utils';
import { impersonateCareHome } from '../../admin-impersonation-utils';
import { openAdminOrgProfile } from '../../org-profile/admin-org-profile-store';
import { AdminEntityListView } from '../../shared/admin-entity-list-view';

// ----------------------------------------------------------------------

export function AdminCareHomeListView() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);

  const handleViewCareHome = useCallback(
    (careHome) => {
      impersonateCareHome({ careHome, adminUser: user, dispatch, router });
    },
    [dispatch, router, user]
  );

  const handleOpenProfile = useCallback(
    (careHome) => openAdminOrgProfile(router, 'care-homes', careHome),
    [router]
  );

  return (
    <AdminEntityListView
      heading="Care Home"
      breadcrumbLabel="Care Home"
      userType={ADMIN_MENU_USER_TYPE.careHomes}
      tableHead={ADMIN_CUSTOMER_TABLE_HEAD}
      searchKeys={['name', 'email', 'location', 'phone']}
      enableView
      onView={handleViewCareHome}
      viewTooltip="View care home dashboard"
      onProfile={handleOpenProfile}
      profileKind="care-homes"
      profileTooltip="Open care home profile"
    />
  );
}
