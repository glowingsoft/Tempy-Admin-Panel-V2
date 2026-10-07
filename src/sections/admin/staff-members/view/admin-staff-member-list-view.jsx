import { useCallback, useState } from 'react';

import { useRouter } from 'src/routes/hooks';

import { useDispatch, useSelector } from 'react-redux';

import { toast } from 'src/components/snackbar';

import { useRaiseAdminAllegationMutation } from 'src/store/Reducer/admin-allegations-api';

import { RaiseAllegationDialog } from 'src/sections/admin/allegations/raise-allegation-dialog';

import { ADMIN_MENU_USER_TYPE, ADMIN_SUPPLIER_TABLE_HEAD } from '../../shared/admin-users-api-utils';
import { impersonateStaffMember } from '../../admin-impersonation-utils';
import { openAdminOrgProfile } from '../../org-profile/admin-org-profile-store';
import { AdminEntityListView } from '../../shared/admin-entity-list-view';

// ----------------------------------------------------------------------

export function AdminStaffMemberListView() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);
  const [raiseAllegation] = useRaiseAdminAllegationMutation();

  const [allegationDialog, setAllegationDialog] = useState({ open: false, worker: null });
  const [submitting, setSubmitting] = useState(false);

  const handleView = useCallback(
    (record) => {
      impersonateStaffMember({ record, adminUser: user, dispatch, router });
    },
    [dispatch, router, user]
  );

  const handleOpenProfile = useCallback(
    (record) => openAdminOrgProfile(router, 'staff-members', record),
    [router]
  );

  const handleRaiseAllegation = useCallback((record) => {
    setAllegationDialog({ open: true, worker: record });
  }, []);

  const handleCloseAllegation = useCallback(() => {
    setAllegationDialog({ open: false, worker: null });
  }, []);

  const handleConfirmAllegation = useCallback(
    async (payload) => {
      try {
        setSubmitting(true);
        await raiseAllegation({
          workerId: payload.workerId,
          allegationType: payload.allegationType,
          description: payload.description,
          employerName: payload.employerName,
        }).unwrap();

        toast.success(`Allegation raised for ${payload.workerName || 'this worker'}`);
        router.push('/admin-dashboard/allegations');
      } catch (error) {
        toast.error(error?.data?.message || error?.message || 'Could not raise allegation');
        throw error;
      } finally {
        setSubmitting(false);
      }
    },
    [raiseAllegation, router]
  );

  return (
    <>
      <AdminEntityListView
        heading="Individual (Staff Member)"
        breadcrumbLabel="Individual (Staff Member)"
        userType={ADMIN_MENU_USER_TYPE.staffMembers}
        tableHead={ADMIN_SUPPLIER_TABLE_HEAD}
        searchKeys={['name', 'email', 'location', 'phone']}
        enableView
        onView={handleView}
        viewTooltip="View staff member dashboard"
        onProfile={handleOpenProfile}
        profileKind="staff-members"
        profileTooltip="Open staff profile"
        onRaiseAllegation={handleRaiseAllegation}
        raiseAllegationTooltip="Raise allegation"
      />

      <RaiseAllegationDialog
        open={allegationDialog.open}
        onClose={handleCloseAllegation}
        worker={allegationDialog.worker}
        onSubmit={handleConfirmAllegation}
        submitting={submitting}
      />
    </>
  );
}
