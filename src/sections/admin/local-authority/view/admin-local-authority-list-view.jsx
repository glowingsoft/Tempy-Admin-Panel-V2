import { useCallback } from 'react';

import { useRouter } from 'src/routes/hooks';

import { useDispatch, useSelector } from 'react-redux';

import { ADMIN_CUSTOMER_TABLE_HEAD, ADMIN_MENU_USER_TYPE } from '../../shared/admin-users-api-utils';
import { impersonateLocalAuthority } from '../../admin-impersonation-utils';
import { openAdminOrgProfile } from '../../org-profile/admin-org-profile-store';
import { AdminEntityListView } from '../../shared/admin-entity-list-view';

// ----------------------------------------------------------------------

export function AdminLocalAuthorityListView() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);

  const handleView = useCallback(
    (record) => {
      impersonateLocalAuthority({ record, adminUser: user, dispatch, router });
    },
    [dispatch, router, user]
  );

  const handleOpenProfile = useCallback(
    (record) => openAdminOrgProfile(router, 'local-authority', record),
    [router]
  );

  return (
    <AdminEntityListView
      heading="Local Authority"
      breadcrumbLabel="Local Authority"
      userType={ADMIN_MENU_USER_TYPE.localAuthority}
      tableHead={ADMIN_CUSTOMER_TABLE_HEAD}
      searchKeys={['name', 'email', 'location', 'phone']}
      enableView
      onView={handleView}
      viewTooltip="View local authority dashboard"
      onProfile={handleOpenProfile}
      profileKind="local-authority"
      profileTooltip="Open local authority profile"
    />
  );
}
