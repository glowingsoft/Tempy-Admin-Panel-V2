import { useState } from 'react';
import { useSelector } from 'react-redux';

import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { fDate } from 'src/utils/format-time';

import { DashboardContent } from 'src/layouts/dashboard';
import { getDashboardRootPath } from 'src/auth/utils/dashboard-path-utils';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { rowInPage, TablePaginationCustom, useTable } from 'src/components/table';

import { dataUrlToFile } from 'src/sections/staff-member/jobs/nurse-checkin-api-utils';
import { SignaturePad } from 'src/sections/staff-member/jobs/staff-member-check-dialogs';
import { SignatureImage } from 'src/sections/staff-member/jobs/signature-image';

import { useUploadAwsFileMutation } from 'src/store/Reducer/upload-api';
import {
  useGetContractsQuery,
  useSignContractMutation,
  useUploadContractMutation,
  useGetCustomerOptionsQuery,
} from 'src/store/Reducer/supplier-relationships-api';

import {
  CONTRACT_STATUS,
  getRoleApiBase,
  getRelationshipSide,
  CUSTOMER_TYPE_OPTIONS,
} from '../supplier-relationship-utils';
import { RowActionButton } from '../row-action-button';
import { useViewOnly } from 'src/hooks/use-view-only';

// ----------------------------------------------------------------------

export function ContractsView() {
  // Admin viewing this account: contracts can be viewed, not uploaded or signed.
  const viewOnly = useViewOnly();
  const { user } = useSelector((state) => state.user);
  const side = getRelationshipSide(user);
  const isSupplier = side === 'supplier';
  const base = getRoleApiBase(user);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [signing, setSigning] = useState(null);

  const { data, isLoading, isError } = useGetContractsQuery({ base }, { skip: !side });
  const rows = data?.data || [];
  const table = useTable({ defaultRowsPerPage: 10 });
  const pageCount = Math.max(1, Math.ceil(rows.length / table.rowsPerPage));
  const safePage = Math.min(table.page, pageCount - 1);
  const pageRows = rowInPage(rows, safePage, table.rowsPerPage);

  return (
    <DashboardContent maxWidth={false}>
      <CustomBreadcrumbs
        heading="Contracts"
        links={[
          {
            name: 'Dashboard',
            href: getDashboardRootPath(user?.permission, user?.accountState?.accountType),
          },
          { name: 'Contracts' },
        ]}
        action={
          isSupplier && !viewOnly && (
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:cloud-upload-fill" />}
              onClick={() => setUploadOpen(true)}
            >
              Upload contract
            </Button>
          )
        }
        sx={{ mb: { xs: 2, md: 3 } }}
      />

      <Alert severity="info" sx={{ mb: 2.5 }}>
        {isSupplier
          ? 'Upload your own contract for each customer. The customer signs it, then you countersign. It must be signed by both sides before your first shift together, and it does not expire.'
          : 'Suppliers send you their contract. Sign it here, then the supplier countersigns. It must be signed by both sides before your first shift together.'}
      </Alert>

      {isError && (
        <Alert severity="error" sx={{ mb: 2.5 }}>
          Could not load contracts.
        </Alert>
      )}

      <Card>
        <Scrollbar>
          <Table size="small" sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow>
                <TableCell>{isSupplier ? 'Customer' : 'Supplier'}</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Signed</TableCell>
                <TableCell align="right" sx={{ width: 160 }}>
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pageRows.map((row) => {
                const party = isSupplier ? row.customer : row.supplier;
                const status = CONTRACT_STATUS[row.status] || CONTRACT_STATUS.none;
                const canSign = !isSupplier && row.status === 'awaitingCustomer';
                const canCountersign = isSupplier && row.status === 'awaitingSupplier';

                return (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">{party.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {party.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={status.label} color={status.color} />
                    </TableCell>
                    <TableCell>
                      <SignedBy
                        label="Customer"
                        date={row.customerSignedAt}
                        signature={row.customerSignature}
                      />
                      <SignedBy
                        label="Supplier"
                        date={row.supplierSignedAt}
                        signature={row.supplierSignature}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
                        {row.status === 'signed' ? (
                          <RowActionButton
                            title="Download signed copy"
                            icon="solar:download-bold"
                            href={row.signedDocumentUrl || row.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          />
                        ) : (
                          <RowActionButton
                            title="View contract"
                            icon="solar:document-text-bold"
                            href={row.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          />
                        )}
                        {!viewOnly && (canSign || canCountersign) && (
                          <RowActionButton
                            title={canSign ? 'Sign' : 'Countersign'}
                            icon="solar:pen-bold"
                            color="primary"
                            onClick={() => setSigning(row)}
                          />
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}

              {!isLoading && !rows.length && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    No contracts yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Scrollbar>
        <TablePaginationCustom
          page={safePage}
          count={rows.length}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>

      {isSupplier && (
        <UploadContractDialog base={base} open={uploadOpen} onClose={() => setUploadOpen(false)} />
      )}

      <SignContractDialog
        base={base}
        row={signing}
        isSupplier={isSupplier}
        onClose={() => setSigning(null)}
      />
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

function UploadContractDialog({ base, open, onClose }) {
  const [customerType, setCustomerType] = useState('careHome');
  const [customer, setCustomer] = useState('');
  const [file, setFile] = useState(null);

  const { data: customers } = useGetCustomerOptionsQuery(
    { base, userType: customerType },
    { skip: !open }
  );
  const [uploadFile, { isLoading: isUploading }] = useUploadAwsFileMutation();
  const [uploadContract, { isLoading: isSaving }] = useUploadContractMutation();

  const handleClose = () => {
    setCustomer('');
    setFile(null);
    onClose();
  };

  const handleSubmit = async () => {
    try {
      const uploaded = await uploadFile(file).unwrap();
      // Save the full S3 link: the backend returns contract.document as-is, so a bare key
      // would resolve against the API server and 404.
      await uploadContract({ base, customer, document: uploaded.fileUrl || uploaded.file }).unwrap();
      toast.success('Contract sent to the customer to sign');
      handleClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Could not upload the contract.');
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Upload contract</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            select
            label="Customer type"
            value={customerType}
            onChange={(e) => {
              setCustomerType(e.target.value);
              setCustomer('');
            }}
          >
            {CUSTOMER_TYPE_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Customer"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
          >
            {(customers?.data || []).map((option) => (
              <MenuItem key={option.id} value={option.id}>
                {option.name}
                {option.email ? ` · ${option.email}` : ''}
              </MenuItem>
            ))}
          </TextField>

          <Button component="label" variant="outlined" startIcon={<Iconify icon="eva:attach-2-fill" />}>
            {file ? file.name : 'Choose PDF'}
            <input
              hidden
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </Button>

          <Typography variant="caption" color="text.secondary">
            Uploading again replaces a contract that has not been signed yet.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={handleClose}>
          Cancel
        </Button>
        <LoadingButton
          variant="contained"
          disabled={!customer || !file}
          loading={isUploading || isSaving}
          onClick={handleSubmit}
        >
          Send to customer
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

// ----------------------------------------------------------------------

/** Signed date plus the drawn signature (older rows may hold a typed name instead). */
function SignedBy({ label, date, signature }) {
  const isImage = /^https?:\/\//i.test(signature || '');

  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 0.25 }}>
      <Typography variant="caption">
        {label}: {date ? fDate(date) : '—'}
      </Typography>
      {isImage && (
        <SignatureImage
          src={signature}
          alt={`${label} signature`}
          sx={{ height: 28, maxWidth: 90, borderRadius: 0.5 }}
        />
      )}
    </Stack>
  );
}

// ----------------------------------------------------------------------

function SignContractDialog({ base, row, isSupplier, onClose }) {
  // Drawn signature as a PNG data URL, same as check-in / check-out.
  const [signature, setSignature] = useState(null);

  const [uploadFile, { isLoading: isUploading }] = useUploadAwsFileMutation();
  const [signContract, { isLoading: isSigning }] = useSignContractMutation();

  const handleClose = () => {
    setSignature(null);
    onClose();
  };

  const handleSign = async () => {
    try {
      const file = dataUrlToFile(signature, 'contract-signature.png');
      const uploaded = await uploadFile(file).unwrap();
      await signContract({
        base,
        id: row.id,
        action: isSupplier ? 'countersign' : 'sign',
        signature: uploaded.fileUrl || uploaded.file,
      }).unwrap();
      toast.success(isSupplier ? 'Contract signed by both sides' : 'Contract signed');
      handleClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Could not sign the contract.');
    }
  };

  return (
    <Dialog open={Boolean(row)} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>{isSupplier ? 'Countersign contract' : 'Sign contract'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Link href={row?.documentUrl} target="_blank" rel="noopener">
            Read the contract
          </Link>
          <Typography variant="subtitle2">Draw your signature below</Typography>
          <SignaturePad onChange={setSignature} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={handleClose}>
          Cancel
        </Button>
        <LoadingButton
          variant="contained"
          disabled={!signature}
          loading={isUploading || isSigning}
          onClick={handleSign}
        >
          Sign
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
