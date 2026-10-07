import { useCallback } from 'react';

import { useRouter } from 'src/routes/hooks';

import { useDispatch, useSelector } from 'react-redux';

import { ADMIN_CUSTOMER_TABLE_HEAD, ADMIN_MENU_USER_TYPE } from '../../shared/admin-users-api-utils';
import { impersonateIndividualHomeCare } from '../../admin-impersonation-utils';
import { openAdminOrgProfile } from '../../org-profile/admin-org-profile-store';
import { AdminEntityListView } from '../../shared/admin-entity-list-view';

// ----------------------------------------------------------------------

export function AdminIndividualHomeCareListView() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);

  const handleView = useCallback(
    (record) => {
      impersonateIndividualHomeCare({ record, adminUser: user, dispatch, router });
    },
    [dispatch, router, user]
  );

  const handleOpenProfile = useCallback(
    (record) => openAdminOrgProfile(router, 'individual-home-care', record),
    [router]
  );

  return (
    <AdminEntityListView
      heading="Individual (Home Care)"
      breadcrumbLabel="Individual (Home Care)"
      userType={ADMIN_MENU_USER_TYPE.individualHomeCare}
      tableHead={ADMIN_CUSTOMER_TABLE_HEAD}
      searchKeys={['name', 'email', 'location', 'phone']}
      enableView
      onView={handleView}
      viewTooltip="View individual home care dashboard"
      onProfile={handleOpenProfile}
      profileKind="individual-home-care"
      profileTooltip="Open individual profile"
    />
  );
}
