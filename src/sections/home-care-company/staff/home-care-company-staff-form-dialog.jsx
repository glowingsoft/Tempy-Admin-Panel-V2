import { AgencyStaffFormDialog } from 'src/sections/agency/staff/agency-staff-form-dialog';
import { useGetHomeCareCompanyBranchesQuery } from 'src/store/Reducer/home-care-company-branches-api';
import { useGetHomeCareCompanyStaffNursesQuery } from 'src/store/Reducer/home-care-company-staff-api';

export function HomeCareCompanyStaffFormDialog(props) {
  return (
    <AgencyStaffFormDialog
      {...props}
      useBranchesQuery={useGetHomeCareCompanyBranchesQuery}
      useNursesQuery={useGetHomeCareCompanyStaffNursesQuery}
    />
  );
}
