import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useFormContext, useFormState } from 'react-hook-form';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

import { varAlpha } from 'src/theme/styles';

import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';
import { useUploadAwsFileMutation } from 'src/store/Reducer/upload-api';

const DOCUMENT_ICONS = {
  'Government-issued ID': 'solar:card-bold-duotone',
  'Nursing Degree / Diploma': 'solar:diploma-bold-duotone',
  'Certifications (BLS, ACLS, First Aid)': 'solar:medal-ribbons-star-bold-duotone',
};

export const STAFF_DOCUMENT_ACCEPT = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};

function getDocumentIcon(label) {
  return DOCUMENT_ICONS[label] || 'solar:document-add-bold-duotone';
}

function getFileName(file) {
  if (!file) return 'file';
  if (typeof file === 'string') return file.split('/').pop() || file;
  return file.name || 'file';
}

function getFileExt(file) {
  const name = getFileName(file).toLowerCase();
  const idx = name.lastIndexOf('.');
  return idx >= 0 ? name.slice(idx + 1) : '';
}

function FileTypeIcon({ file, width = 16 }) {
  const ext = getFileExt(file);
  const icon =
    ext === 'pdf'
      ? 'solar:file-text-bold'
      : ext === 'doc' || ext === 'docx'
        ? 'solar:document-text-bold'
        : 'solar:document-bold';

  return <Iconify icon={icon} width={width} />;
}

export function StaffDocumentUploadRow({
  name,
  label,
  existingFiles = [],
  onRemove,
  helperText = 'Upload PDF or Word document',
  accept = STAFF_DOCUMENT_ACCEPT,
}) {
  const { watch, setValue, control } = useFormContext();
  const { errors } = useFormState({ control, name });
  const errorMessage = errors?.[name]?.message;
  const uploadedFiles = watch(name) || [];
  const [uploadAwsFile] = useUploadAwsFileMutation();
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles) => {
      if (!acceptedFiles.length) return;

      setUploading(true);
      try {
        const urls = [];
        for (const file of acceptedFiles) {
          const result = await uploadAwsFile(file).unwrap();
          const url = result?.fileUrl || result?.file || '';
          if (url) urls.push(url);
        }
        if (urls.length) {
          setValue(name, [...uploadedFiles, ...urls], { shouldValidate: true });
        }
      } catch (err) {
        toast.error(
          err?.data?.message || err?.error || err?.message || 'Could not upload document.'
        );
      } finally {
        setUploading(false);
      }
    },
    [name, setValue, uploadAwsFile, uploadedFiles]
  );

  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({
    multiple: true,
    accept,
    noClick: true,
    noKeyboard: true,
    disabled: uploading,
    onDrop,
  });

  const hasFiles = existingFiles.length > 0 || uploadedFiles.length > 0;

  return (
    <Box
      {...getRootProps()}
      sx={{
        p: 1.5,
        borderRadius: 1.5,
        border: (theme) =>
          `1px solid ${errorMessage ? theme.vars.palette.error.main : theme.vars.palette.divider
          }`,
        bgcolor: (theme) =>
          isDragActive
            ? varAlpha(theme.vars.palette.primary.mainChannel, 0.08)
            : 'background.paper',
      }}
    >
      <input {...getInputProps()} />

      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: (theme) => varAlpha(theme.vars.palette.primary.mainChannel, 0.08),
            color: 'primary.main',
            flexShrink: 0,
          }}
        >
          {uploading ? (
            <CircularProgress size={18} />
          ) : (
            <Iconify icon={getDocumentIcon(label)} width={22} />
          )}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap>
            {label}
          </Typography>
          <Typography
            variant="caption"
            color={errorMessage && !uploading ? 'error.main' : 'text.secondary'}
          >
            {uploading ? 'Uploading…' : errorMessage || helperText}
          </Typography>
        </Box>

        <Button
          size="small"
          variant="outlined"
          onClick={open}
          disabled={uploading}
          startIcon={<Iconify icon="eva:cloud-upload-fill" width={16} />}
        >
          Upload
        </Button>
      </Stack>

      {hasFiles ? (
        <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 1.25 }}>
          {existingFiles.map((file, index) => (
            <Chip
              key={`existing-${getFileName(file)}-${index}`}
              size="small"
              icon={<FileTypeIcon file={file} />}
              label={getFileName(file)}
              onDelete={onRemove ? () => onRemove(file, index) : undefined}
              sx={{ maxWidth: 220 }}
            />
          ))}
          {uploadedFiles.map((file, index) => (
            <Chip
              key={`uploaded-${getFileName(file)}-${index}`}
              size="small"
              color="primary"
              variant="outlined"
              icon={<FileTypeIcon file={file} />}
              label={getFileName(file)}
              onDelete={() => {
                const next = uploadedFiles.filter((_, i) => i !== index);
                setValue(name, next, { shouldValidate: true });
              }}
              sx={{ maxWidth: 220 }}
            />
          ))}
        </Stack>
      ) : null}
    </Box>
  );
}
