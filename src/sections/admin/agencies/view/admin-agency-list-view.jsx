import { useCallback } from 'react';

import { useRouter } from 'src/routes/hooks';

import { useDispatch, useSelector } from 'react-redux';

import { ADMIN_MENU_USER_TYPE, ADMIN_SUPPLIER_TABLE_HEAD } from '../../shared/admin-users-api-utils';
import { impersonateAgency } from '../../admin-impersonation-utils';
import { openAdminOrgProfile } from '../../org-profile/admin-org-profile-store';
import { AdminEntityListView } from '../../shared/admin-entity-list-view';

// ----------------------------------------------------------------------

export function AdminAgencyListView() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);

  const handleViewAgency = useCallback(
    (agency) => {
      impersonateAgency({ agency, adminUser: user, dispatch, router });
    },
    [dispatch, router, user]
  );

  const handleOpenProfile = useCallback(
    (agency) => openAdminOrgProfile(router, 'agencies', agency),
    [router]
  );

  return (
    <AdminEntityListView
      heading="Agency/Supplier"
      breadcrumbLabel="Agency/Supplier"
      userType={ADMIN_MENU_USER_TYPE.agencies}
      tableHead={ADMIN_SUPPLIER_TABLE_HEAD}
      searchKeys={['name', 'email', 'location', 'phone']}
      enableView
      onView={handleViewAgency}
      viewTooltip="View agency dashboard"
      onProfile={handleOpenProfile}
      profileKind="agencies"
      profileTooltip="Open agency profile"
    />
  );
}
