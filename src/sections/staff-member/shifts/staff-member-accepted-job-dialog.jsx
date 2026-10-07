import { SupplierJobDetailsDialog } from 'src/sections/agency/jobs/supplier-job-details-dialog';

// Employee job details — shift alert + cancel shift.
export function StaffMemberAcceptedJobDialog(props) {
  return <SupplierJobDetailsDialog {...props} showShiftAlert showCancelShift />;
}
