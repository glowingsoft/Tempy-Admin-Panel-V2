import { useEffect, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';


export function ComplianceTrustIdInviteDialog({ open, onClose, staffList, preselectedId, onSendInvites }) {
  const eligibleStaff = useMemo(
    () => staffList.filter((s) => s.trustId.checkStatus !== 'complete'),
    [staffList]
  );

  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    if (open && !preselectedId) {
      setSelectedIds([]);
    }
  }, [open, preselectedId]);

  const effectiveSelected = useMemo(() => {
    if (preselectedId && open) {
      return [preselectedId];
    }
    return selectedIds;
  }, [preselectedId, open, selectedIds]);

  const toggleStaff = (id) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const handleRowClick = (staffId, isPreselected) => {
    if (!isPreselected) {
      toggleStaff(staffId);
    }
  };

  const handleSend = () => {
    onSendInvites?.(effectiveSelected);
    setSelectedIds([]);
    onClose?.();
  };

  const handleClose = () => {
    setSelectedIds([]);
    onClose?.();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Iconify icon="solar:letter-bold" width={24} sx={{ color: 'primary.main' }} />
          <Box>
            <Typography variant="h6">Send TrustID GuestLink</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Invite staff to complete identity, Right to Work and DBS checks
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        {eligibleStaff.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>
            All staff have completed TrustID verification.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {eligibleStaff.map((staff) => {
              const checked = effectiveSelected.includes(staff.id);
              const isPreselected = Boolean(preselectedId);

              return (
                <Stack
                  key={staff.id}
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                  onClick={() => handleRowClick(staff.id, isPreselected)}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: (theme) => `1px solid ${theme.vars.palette.divider}`,
                    cursor: isPreselected ? 'default' : 'pointer',
                    bgcolor: checked ? 'primary.lighter' : 'transparent',
                  }}
                >
                  {!isPreselected && (
                    <Checkbox
                      checked={checked}
                      onClick={(event) => event.stopPropagation()}
                      onChange={() => toggleStaff(staff.id)}
                    />
                  )}
                  <Avatar sx={{ width: 36, height: 36 }}>{staff.name[0]}</Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2">{staff.name}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {staff.role}
                      {staff.email ? ` · ${staff.email}` : ''}
                    </Typography>
                  </Box>
                  <Label variant="soft" color="info">
                    {staff.trustId.checkStatus === 'awaiting_candidate' ? 'Invited' : 'Needs check'}
                  </Label>
                </Stack>
              );
            })}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="outlined" color="inherit" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={!effectiveSelected.length}
          startIcon={<Iconify icon="solar:plain-2-bold" width={18} />}
          onClick={handleSend}
        >
          Send {effectiveSelected.length || ''} invite{effectiveSelected.length === 1 ? '' : 's'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
