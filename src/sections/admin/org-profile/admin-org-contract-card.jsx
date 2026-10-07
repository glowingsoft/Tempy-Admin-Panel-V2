import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Unstable_Grid2';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import {
  CONTRACT_STATUSES,
  EMPTY_CONTRACT,
  SERVICE_LEVEL_OPTIONS,
  getContractStatusMeta,
} from './admin-org-profile-store';

// ----------------------------------------------------------------------

function patchContract(prev, patch) {
  const next = { ...prev, ...patch };
  if ('ratesConfirmed' in patch || 'slaConfirmed' in patch) {
    if (next.ratesConfirmed && next.slaConfirmed) next.status = 'agreed';
    else if (next.ratesConfirmed || next.slaConfirmed) next.status = 'pending';
    else if (next.status === 'agreed') next.status = 'draft';
  }
  return next;
}

export function AdminOrgContractCard({
  contract = EMPTY_CONTRACT,
  onChange,
  onAddFiles,
  onRemoveFile,
  title = 'Contract / agreement',
}) {
  const statusMeta = getContractStatusMeta(contract.status);
  const confirmed = Boolean(contract.ratesConfirmed && contract.slaConfirmed);

  const update = (patch) => onChange(patchContract(contract, patch));

  return (
    <Card sx={{ p: 3 }}>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 0.5 }}>
        <Typography variant="h6">{title}</Typography>
        <Label variant="soft" color={statusMeta.color}>
          {statusMeta.label}
        </Label>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        Confirm agreed rates and the service level for this local authority.
      </Typography>

      {confirmed ? (
        <Alert severity="success" sx={{ mb: 2.5 }}>
          Rates and service level are both confirmed.
        </Alert>
      ) : (
        <Alert severity="info" sx={{ mb: 2.5 }}>
          Tick both confirmations once the rate card and SLA have been agreed.
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid xs={12} sm={6}>
          <TextField
            select
            fullWidth
            label="Agreement status"
            value={contract.status || 'draft'}
            onChange={(event) => update({ status: event.target.value })}
          >
            {CONTRACT_STATUSES.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid xs={12} sm={6}>
          <TextField
            select
            fullWidth
            label="Service level"
            value={contract.serviceLevel || 'standard'}
            onChange={(event) => update({ serviceLevel: event.target.value })}
          >
            {SERVICE_LEVEL_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid xs={12} sm={6}>
          <TextField
            fullWidth
            label="Agreed hourly rate (£)"
            value={contract.hourlyRate}
            onChange={(event) => update({ hourlyRate: event.target.value })}
            placeholder="e.g. 22.50"
            inputProps={{ inputMode: 'decimal' }}
          />
        </Grid>
        <Grid xs={12} sm={6}>
          <TextField
            fullWidth
            label="Agreed daily rate (£)"
            value={contract.dailyRate}
            onChange={(event) => update({ dailyRate: event.target.value })}
            placeholder="Optional"
            inputProps={{ inputMode: 'decimal' }}
          />
        </Grid>
        <Grid xs={12} sm={6}>
          <TextField
            fullWidth
            type="date"
            label="Start date"
            value={contract.startDate}
            onChange={(event) => update({ startDate: event.target.value })}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid xs={12} sm={6}>
          <TextField
            fullWidth
            type="date"
            label="End date"
            value={contract.endDate}
            onChange={(event) => update({ endDate: event.target.value })}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid xs={12}>
          <TextField
            fullWidth
            multiline
            minRows={2}
            label="Service level notes"
            value={contract.serviceLevelDetail}
            onChange={(event) => update({ serviceLevelDetail: event.target.value })}
            placeholder="Cover hours, response times, specialties, or other SLA terms..."
          />
        </Grid>
        <Grid xs={12}>
          <TextField
            fullWidth
            multiline
            minRows={2}
            label="Agreement notes"
            value={contract.notes}
            onChange={(event) => update({ notes: event.target.value })}
            placeholder="Framework reference, review date, or anything else both sides should know..."
          />
        </Grid>
      </Grid>

      <Stack spacing={0.5} sx={{ mt: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={Boolean(contract.ratesConfirmed)}
              onChange={(event) => update({ ratesConfirmed: event.target.checked })}
            />
          }
          label="Rates confirmed"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={Boolean(contract.slaConfirmed)}
              onChange={(event) => update({ slaConfirmed: event.target.checked })}
            />
          }
          label="Service level confirmed"
        />
      </Stack>

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 3, mb: 1.5 }}>
        <Box>
          <Typography variant="subtitle2">Agreement files</Typography>
          <Typography variant="body2" color="text.secondary">
            Signed contract, rate card, or SLA.
          </Typography>
        </Box>
        <Button
          component="label"
          variant="outlined"
          startIcon={<Iconify icon="solar:file-text-bold" />}
        >
          Add files
          <input hidden multiple type="file" onChange={onAddFiles} />
        </Button>
      </Stack>

      <Stack spacing={1}>
        {(contract.files || []).length ? (
          contract.files.map((doc) => (
            <Stack
              key={doc.id}
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ p: 1, borderRadius: 1, bgcolor: 'background.neutral' }}
            >
              <Iconify icon="solar:file-bold" width={18} />
              <Typography variant="body2" sx={{ flexGrow: 1 }} noWrap>
                {doc.name}
              </Typography>
              <IconButton size="small" onClick={() => onRemoveFile(doc.id)}>
                <Iconify icon="solar:trash-bin-trash-bold" width={16} />
              </IconButton>
            </Stack>
          ))
        ) : (
          <Typography variant="body2" color="text.secondary">
            No agreement files yet.
          </Typography>
        )}
      </Stack>
    </Card>
  );
}
