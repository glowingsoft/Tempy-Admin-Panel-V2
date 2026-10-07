import { useCallback } from 'react';

import { useRouter } from 'src/routes/hooks';

import { useDispatch, useSelector } from 'react-redux';

import { ADMIN_CUSTOMER_TABLE_HEAD, ADMIN_MENU_USER_TYPE } from '../../shared/admin-users-api-utils';
import { impersonateHospital } from '../../admin-impersonation-utils';
import { openAdminOrgProfile } from '../../org-profile/admin-org-profile-store';
import { AdminEntityListView } from '../../shared/admin-entity-list-view';

// ----------------------------------------------------------------------

export function AdminHospitalListView() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);

  const handleView = useCallback(
    (record) => {
      impersonateHospital({ hospital: record, adminUser: user, dispatch, router });
    },
    [dispatch, router, user]
  );

  const handleOpenProfile = useCallback(
    (record) => openAdminOrgProfile(router, 'hospitals', record),
    [router]
  );

  return (
    <AdminEntityListView
      heading="Hospitals/NHS"
      breadcrumbLabel="Hospitals/NHS"
      userType={ADMIN_MENU_USER_TYPE.hospitals}
      tableHead={ADMIN_CUSTOMER_TABLE_HEAD}
      searchKeys={['name', 'email', 'location', 'phone']}
      enableView
      onView={handleView}
      viewTooltip="View hospital dashboard"
      onProfile={handleOpenProfile}
      profileKind="hospitals"
      profileTooltip="Open hospital profile"
    />
  );
}
