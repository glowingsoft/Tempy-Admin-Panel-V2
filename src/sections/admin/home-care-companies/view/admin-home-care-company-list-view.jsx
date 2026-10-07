import { useCallback } from 'react';

import { useRouter } from 'src/routes/hooks';

import { useDispatch, useSelector } from 'react-redux';

import { ADMIN_MENU_USER_TYPE, ADMIN_SUPPLIER_TABLE_HEAD } from '../../shared/admin-users-api-utils';
import { impersonateHomeCareCompany } from '../../admin-impersonation-utils';
import { openAdminOrgProfile } from '../../org-profile/admin-org-profile-store';
import { AdminEntityListView } from '../../shared/admin-entity-list-view';

// ----------------------------------------------------------------------

export function AdminHomeCareCompanyListView() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);

  const handleView = useCallback(
    (record) => {
      impersonateHomeCareCompany({ record, adminUser: user, dispatch, router });
    },
    [dispatch, router, user]
  );

  const handleOpenProfile = useCallback(
    (record) => openAdminOrgProfile(router, 'home-care-companies', record),
    [router]
  );

  return (
    <AdminEntityListView
      heading="Home Care Company"
      breadcrumbLabel="Home Care Company"
      userType={ADMIN_MENU_USER_TYPE.homeCareCompanies}
      tableHead={ADMIN_SUPPLIER_TABLE_HEAD}
      searchKeys={['name', 'email', 'location', 'phone']}
      enableView
      onView={handleView}
      viewTooltip="View home care company dashboard"
      onProfile={handleOpenProfile}
      profileKind="home-care-companies"
      profileTooltip="Open company profile"
    />
  );
}
