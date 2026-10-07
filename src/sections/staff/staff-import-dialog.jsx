import { useCallback, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import LoadingButton from '@mui/lab/LoadingButton';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import {
  downloadStaffImportTemplate,
  parseStaffImportCsv,
} from './staff-import-utils';

// ----------------------------------------------------------------------

/**
 * Client: staff import including roles / teams — each company defines its own rota groups.
 *
 * The chosen CSV is parsed locally for the preview and handed to `onImport` as
 * the raw File, so callers can post it to their own import endpoint.
 * `onDownloadTemplate` does the same for the template button; without it the
 * built-in sample CSV is used.
 */
export function StaffImportDialog({
  open,
  onClose,
  onImport,
  onDownloadTemplate,
  importing = false,
  downloadingTemplate = false,
}) {
  const [fileName, setFileName] = useState('');
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState([]);

  const reset = useCallback(() => {
    setFileName('');
    setFile(null);
    setRows([]);
    setErrors([]);
  }, []);

  const handleClose = () => {
    if (importing) return;
    reset();
    onClose?.();
  };

  const handleFile = async (event) => {
    const selected = event.target.files?.[0];
    event.target.value = '';
    if (!selected) return;

    setFileName(selected.name);
    setFile(selected);
    try {
      const text = await selected.text();
      const parsed = parseStaffImportCsv(text);
      setRows(parsed.rows);
      setErrors(parsed.errors);
    } catch {
      setRows([]);
      setErrors(['Could not read that file']);
    }
  };

  const handleDownloadTemplate = async () => {
    if (downloadingTemplate) return;
    if (onDownloadTemplate) {
      await onDownloadTemplate();
      return;
    }
    downloadStaffImportTemplate();
  };

  const roleSummary = useMemo(() => {
    const set = new Set(rows.map((row) => row.team || row.role).filter(Boolean));
    return Array.from(set);
  }, [rows]);

  const handleImport = async () => {
    if (!rows.length || importing) return;
    await onImport?.(rows, file);
    reset();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>Import staff (roles & teams)</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Each company has its own roles. Import staff with a <strong>role</strong> and{' '}
            <strong>team</strong> so Shifts is built from your roster — not a pre-filled role list.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <LoadingButton
              variant="outlined"
              loading={downloadingTemplate}
              startIcon={<Iconify icon="solar:download-bold" />}
              onClick={handleDownloadTemplate}
            >
              Download template
            </LoadingButton>
            <Button
              variant="contained"
              component="label"
              startIcon={<Iconify icon="solar:upload-bold" />}
            >
              Choose CSV
              <input hidden type="file" accept=".csv,text/csv" onChange={handleFile} />
            </Button>
            {fileName ? (
              <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                {fileName}
              </Typography>
            ) : null}
          </Stack>

          {errors.length > 0 ? (
            <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: 'warning.lighter' }}>
              {errors.slice(0, 8).map((error) => (
                <Typography key={error} variant="caption" display="block" color="warning.darker">
                  {error}
                </Typography>
              ))}
              {errors.length > 8 ? (
                <Typography variant="caption" color="warning.darker">
                  +{errors.length - 8} more
                </Typography>
              ) : null}
            </Box>
          ) : null}

          {rows.length > 0 ? (
            <>
              <Typography variant="subtitle2">
                {rows.length} staff · {roleSummary.length} team
                {roleSummary.length === 1 ? '' : 's'}: {roleSummary.slice(0, 6).join(', ')}
                {roleSummary.length > 6 ? '…' : ''}
              </Typography>
              <Scrollbar sx={{ maxHeight: 320 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Team</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={`${row.email}-${row.name}`}>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.email || '—'}</TableCell>
                        <TableCell>{row.phone || '—'}</TableCell>
                        <TableCell>{row.role}</TableCell>
                        <TableCell>{row.team}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Scrollbar>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              CSV columns: name, email, phone, role, team
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button color="inherit" onClick={handleClose} disabled={importing}>
          Cancel
        </Button>
        <LoadingButton
          variant="contained"
          loading={importing}
          disabled={!rows.length}
          onClick={handleImport}
        >
          Import {rows.length ? `(${rows.length})` : ''}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
