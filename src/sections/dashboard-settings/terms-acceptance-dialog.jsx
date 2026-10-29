import { useState } from 'react';
import { useSelector } from 'react-redux';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';

import { useViewOnly } from 'src/hooks/use-view-only';

import { toast } from 'src/components/snackbar';

import {
  useAcceptTermsMutation,
  useGetTermsStatusQuery,
  useGetTermsConditionsQuery,
} from 'src/store/Reducer/dashboard-settings-api';

import { getRelationshipSide } from 'src/sections/supplier-relationship/supplier-relationship-utils';

import { RICH_TEXT_SX } from './rich-text-sx';
import { resolveSettingsAccountKey } from './dashboard-settings-api-utils';

export function TermsAcceptanceDialog({ open: openProp, onClose, onAccepted }) {
  const { user } = useSelector((state) => state.user);
  const viewOnly = useViewOnly();
  const isSupplier = getRelationshipSide(user) === 'supplier' && !viewOnly;
  const controlled = openProp !== undefined;

  const [agreed, setAgreed] = useState(false);

  const { data: status } = useGetTermsStatusQuery(undefined, {
    skip: controlled ? !openProp : !isSupplier,
  });
  const open = controlled ? Boolean(openProp) : Boolean(isSupplier && status?.needsAcceptance);
  const alreadyAccepted = controlled && status?.needsAcceptance === false;
  const readOnly = alreadyAccepted || viewOnly;

  const accountKey = resolveSettingsAccountKey(user);
  const { data: terms } = useGetTermsConditionsQuery({ accountKey }, { skip: !open });

  const [acceptTerms, { isLoading }] = useAcceptTermsMutation();

  const handleClose = () => {
    setAgreed(false);
    onClose?.();
  };

  const handleAccept = async () => {
    try {
      await acceptTerms().unwrap();
      toast.success('Terms accepted');
      setAgreed(false);
      onAccepted?.();
    } catch (err) {
      toast.error(err?.data?.message || 'Could not accept the terms.');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={controlled && !isLoading ? handleClose : undefined}
      fullWidth
      maxWidth="md"
      disableEscapeKeyDown={!controlled}
    >
      <DialogTitle>
        {status?.acceptedVersion ? 'Our terms have changed' : 'Terms and Conditions'}
      </DialogTitle>

      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {viewOnly
            ? 'View only — the account holder accepts the terms themselves.'
            : alreadyAccepted
              ? 'You have already accepted the current terms.'
              : 'Please read and accept the terms to keep using Tempy. You agree not to go direct with customers you meet through Tempy.'}
        </Typography>

        {terms?.isHtml ? (
          <Box
            sx={{ typography: 'body2', ...RICH_TEXT_SX }}
            dangerouslySetInnerHTML={{ __html: terms.content }}
          />
        ) : (
          <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
            {terms?.content || 'Loading…'}
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ justifyContent: readOnly ? 'flex-end' : 'space-between' }}>
        {!readOnly && (
          <FormControlLabel
            control={<Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />}
            label="I have read and accept the terms"
          />
        )}

        <Box sx={{ display: 'flex', gap: 1 }}>
          {controlled && (
            <Button color="inherit" variant="outlined" onClick={handleClose} disabled={isLoading}>
              Close
            </Button>
          )}
          {!readOnly && (
            <LoadingButton
              variant="contained"
              disabled={!agreed || !terms?.content}
              loading={isLoading}
              onClick={handleAccept}
            >
              Accept
            </LoadingButton>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
}
