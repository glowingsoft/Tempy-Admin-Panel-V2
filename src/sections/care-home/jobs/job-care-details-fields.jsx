import { useCallback, useState } from 'react';
import { isValidPhoneNumber } from 'react-phone-number-input';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { Iconify } from 'src/components/iconify';
import { PhoneInput } from 'src/components/phone-input';
import { toast } from 'src/components/snackbar';

import { useUploadAwsFileMutation } from 'src/store/Reducer/upload-api';

import { toPhoneInputValue } from './job-alert-utils';


const fieldProps = {
  fullWidth: true,
  size: 'small',
  InputLabelProps: { shrink: true },
};

function PhoneWithCountryCode({ label, value, onChange, required = false, sx }) {
  const [touched, setTouched] = useState(false);
  const inputValue = toPhoneInputValue(value);
  const invalid = Boolean(inputValue) && !isValidPhoneNumber(inputValue);

  return (
    <PhoneInput
      fullWidth
      size="small"
      required={required}
      label={label}
      country="GB"
      value={inputValue}
      onChange={(next) => onChange(next || '')}
      onBlur={() => setTouched(true)}
      error={touched && invalid}
      helperText={touched && invalid ? 'This number does not match the selected country code' : undefined}
      placeholder="Enter phone number"
      sx={{ flex: 1, minWidth: 0, ...sx }}
    />
  );
}

export function JobCareDetailsFields({ draft = {}, onChange }) {
  const [uploadAwsFile, uploadState] = useUploadAwsFileMutation();

  const handleField = useCallback(
    (field) => (event) => {
      onChange?.(field, event.target.value);
    },
    [onChange]
  );

  const handleUpload = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;

      const documents = Array.isArray(draft.careDocuments) ? draft.careDocuments : [];

      try {
        const response = await uploadAwsFile(file).unwrap();
        const url = response?.fileUrl || response?.url || '';
        onChange?.('careDocuments', [
          ...documents,
          {
            id: `${Date.now()}-${file.name}`,
            name: file.name,
            url: url || '',
            uploadedAt: new Date().toISOString(),
          },
        ]);
        toast.success(url ? 'Document uploaded' : 'Document added');
      } catch (err) {
        toast.error(err?.data?.message || 'Upload failed');
      }
    },
    [draft.careDocuments, onChange, uploadAwsFile]
  );

  const handleRemoveDoc = useCallback(
    (docId) => {
      const documents = Array.isArray(draft.careDocuments) ? draft.careDocuments : [];
      onChange?.(
        'careDocuments',
        documents.filter((doc) => doc.id !== docId)
      );
    },
    [draft.careDocuments, onChange]
  );

  const documents = Array.isArray(draft.careDocuments) ? draft.careDocuments : [];

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
          Care details
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Required. Notes, instructions and contacts for staff on this job. Documents can be added later.
        </Typography>
      </Box>

      <TextField
        {...fieldProps}
        required
        label="Notes (person / location)"
        value={draft.careNotes || ''}
        onChange={handleField('careNotes')}
        multiline
        minRows={3}
        placeholder="Visit notes, access codes, preferences…"
      />

      <TextField
        {...fieldProps}
        required
        label="Instructions"
        value={draft.instructions || ''}
        onChange={handleField('instructions')}
        multiline
        minRows={3}
        placeholder="Care instructions for staff on this shift…"
      />

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
          Contact details
        </Typography>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              {...fieldProps}
              required
              label="Contact name"
              value={draft.contactName || ''}
              onChange={handleField('contactName')}
              sx={{ flex: 1 }}
            />
            <PhoneWithCountryCode
              required
              label="Contact phone"
              value={draft.contactPhone || ''}
              onChange={(next) => onChange?.('contactPhone', next)}
            />
          </Stack>
          <TextField
            {...fieldProps}
            required
            label="Contact email"
            value={draft.contactEmail || ''}
            onChange={handleField('contactEmail')}
          />
        </Stack>
      </Box>

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
          Emergency contact
        </Typography>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              {...fieldProps}
              required
              label="Name"
              value={draft.emergencyName || ''}
              onChange={handleField('emergencyName')}
              sx={{ flex: 1 }}
            />
            <PhoneWithCountryCode
              required
              label="Phone"
              value={draft.emergencyPhone || ''}
              onChange={(next) => onChange?.('emergencyPhone', next)}
            />
          </Stack>
          <TextField
            {...fieldProps}
            required
            label="Relation"
            value={draft.emergencyRelation || ''}
            onChange={handleField('emergencyRelation')}
            placeholder="e.g. Daughter, Next of kin"
          />
        </Stack>
      </Box>

      <Stack spacing={1.25}>
        <Typography variant="subtitle2">Documents (optional)</Typography>

        {!documents.length ? (
          <Stack
            spacing={1.25}
            alignItems="center"
            sx={{
              py: 2.5,
              px: 2,
              borderRadius: 1.5,
              border: (theme) => `1px dashed ${theme.vars.palette.divider}`,
              bgcolor: (theme) => theme.vars.palette.background.neutral,
            }}
          >
            <Typography variant="caption" color="text.secondary" textAlign="center">
              Upload care plans, risk assessments, etc.
            </Typography>
            <Button
              component="label"
              size="small"
              variant="outlined"
              startIcon={<Iconify icon="solar:upload-bold" width={16} />}
              disabled={uploadState.isLoading}
            >
              Upload
              <input hidden type="file" onChange={handleUpload} />
            </Button>
          </Stack>
        ) : (
          <Stack spacing={0.75}>
            <Button
              component="label"
              size="small"
              variant="outlined"
              startIcon={<Iconify icon="solar:upload-bold" width={16} />}
              disabled={uploadState.isLoading}
              sx={{ alignSelf: 'flex-start' }}
            >
              Upload another
              <input hidden type="file" onChange={handleUpload} />
            </Button>
            {documents.map((doc) => (
              <Stack
                key={doc.id}
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{
                  px: 1.25,
                  py: 0.75,
                  borderRadius: 1,
                  border: (theme) => `1px solid ${theme.vars.palette.divider}`,
                }}
              >
                <Iconify icon="solar:document-bold" width={18} sx={{ color: 'text.secondary' }} />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="caption" fontWeight={700} noWrap display="block">
                    {doc.name}
                  </Typography>
                </Box>
                {doc.url ? (
                  <IconButton
                    size="small"
                    component="a"
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Iconify icon="solar:eye-bold" width={16} />
                  </IconButton>
                ) : null}
                <IconButton size="small" color="error" onClick={() => handleRemoveDoc(doc.id)}>
                  <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                </IconButton>
              </Stack>
            ))}
          </Stack>
        )}
      </Stack>
    </Stack>
  );
}
