import { useMemo } from 'react';

import {
  useCreateCareHomeJobTypeMutation,
  useDeleteCareHomeJobTypeMutation,
  useUpdateCareHomeJobTypeMutation,
} from 'src/store/Reducer/care-home-jobs-api';
import {
  useCreateHospitalJobTypeMutation,
  useDeleteHospitalJobTypeMutation,
  useUpdateHospitalJobTypeMutation,
} from 'src/store/Reducer/hospital-jobs-api';
import {
  useCreateLocalAuthorityJobTypeMutation,
  useDeleteLocalAuthorityJobTypeMutation,
  useUpdateLocalAuthorityJobTypeMutation,
} from 'src/store/Reducer/local-authority-jobs-api';
import {
  useCreateUserJobTypeMutation,
  useDeleteUserJobTypeMutation,
  useUpdateUserJobTypeMutation,
} from 'src/store/Reducer/user-jobs-api';

import { isSupplierRole } from './supplier-job-roles-utils';


const EMPLOYER_ROLES = new Set(['careHome', 'hospital', 'localAuthority', 'user']);

export function useRoleJobTypeMutations(role = 'careHome') {
  const jobTypeRole = EMPLOYER_ROLES.has(role) ? role : 'careHome';
  const canMutate = EMPLOYER_ROLES.has(role) && !isSupplierRole(role);

  const [createCareHome, careHomeCreateState] = useCreateCareHomeJobTypeMutation();
  const [updateCareHome, careHomeUpdateState] = useUpdateCareHomeJobTypeMutation();
  const [deleteCareHome, careHomeDeleteState] = useDeleteCareHomeJobTypeMutation();

  const [createHospital, hospitalCreateState] = useCreateHospitalJobTypeMutation();
  const [updateHospital, hospitalUpdateState] = useUpdateHospitalJobTypeMutation();
  const [deleteHospital, hospitalDeleteState] = useDeleteHospitalJobTypeMutation();

  const [createLocalAuthority, laCreateState] = useCreateLocalAuthorityJobTypeMutation();
  const [updateLocalAuthority, laUpdateState] = useUpdateLocalAuthorityJobTypeMutation();
  const [deleteLocalAuthority, laDeleteState] = useDeleteLocalAuthorityJobTypeMutation();

  const [createUser, userCreateState] = useCreateUserJobTypeMutation();
  const [updateUser, userUpdateState] = useUpdateUserJobTypeMutation();
  const [deleteUser, userDeleteState] = useDeleteUserJobTypeMutation();

  return useMemo(() => {
    const byRole = {
      careHome: {
        create: createCareHome,
        update: updateCareHome,
        remove: deleteCareHome,
        createState: careHomeCreateState,
        updateState: careHomeUpdateState,
        deleteState: careHomeDeleteState,
      },
      hospital: {
        create: createHospital,
        update: updateHospital,
        remove: deleteHospital,
        createState: hospitalCreateState,
        updateState: hospitalUpdateState,
        deleteState: hospitalDeleteState,
      },
      localAuthority: {
        create: createLocalAuthority,
        update: updateLocalAuthority,
        remove: deleteLocalAuthority,
        createState: laCreateState,
        updateState: laUpdateState,
        deleteState: laDeleteState,
      },
      user: {
        create: createUser,
        update: updateUser,
        remove: deleteUser,
        createState: userCreateState,
        updateState: userUpdateState,
        deleteState: userDeleteState,
      },
    };

    const selected = byRole[jobTypeRole] || byRole.careHome;
    const isSaving =
      selected.createState.isLoading ||
      selected.updateState.isLoading ||
      selected.deleteState.isLoading;

    return {
      canMutate,
      create: selected.create,
      update: selected.update,
      remove: selected.remove,
      isSaving,
    };
  }, [
    canMutate,
    careHomeCreateState,
    careHomeDeleteState,
    careHomeUpdateState,
    createCareHome,
    createHospital,
    createLocalAuthority,
    createUser,
    deleteCareHome,
    deleteHospital,
    deleteLocalAuthority,
    deleteUser,
    hospitalCreateState,
    hospitalDeleteState,
    hospitalUpdateState,
    jobTypeRole,
    laCreateState,
    laDeleteState,
    laUpdateState,
    updateCareHome,
    updateHospital,
    updateLocalAuthority,
    updateUser,
    userCreateState,
    userDeleteState,
    userUpdateState,
  ]);
}
