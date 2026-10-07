import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { varAlpha } from 'src/theme/styles';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { useUploadAwsFileMutation, resolveUploadedAssetUrl } from 'src/store/Reducer/upload-api';
import { useViewOnly } from 'src/hooks/use-view-only';

// ----------------------------------------------------------------------

export const CERTIFICATE_ACCEPT = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
};

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
        : ext === 'jpg' || ext === 'jpeg' || ext === 'png'
          ? 'solar:gallery-bold'
          : 'solar:document-bold';

  return <Iconify icon={icon} width={width} />;
}

export function StaffMemberCertificateUploadRow({
  label,
  icon = 'solar:document-add-bold-duotone',
  files = [],
  onChange,
  helperText = 'PDF, Word or image',
}) {
  // Admin viewing the account: files can be opened, not uploaded or removed.
  const viewOnly = useViewOnly();
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
        if (urls.length) onChange?.([...files, ...urls]);
      } catch (err) {
        toast.error(
          err?.data?.message || err?.error || err?.message || 'Could not upload certificate.'
        );
      } finally {
        setUploading(false);
      }
    },
    [files, onChange, uploadAwsFile]
  );

  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({
    multiple: true,
    accept: CERTIFICATE_ACCEPT,
    noClick: true,
    noKeyboard: true,
    disabled: uploading || viewOnly,
    onDrop,
  });

  return (
    <Box
      {...getRootProps()}
      sx={{
        p: 1.5,
        borderRadius: 1.5,
        border: (theme) => `1px solid ${theme.vars.palette.divider}`,
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
          {uploading ? <CircularProgress size={18} /> : <Iconify icon={icon} width={22} />}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap>
            {label}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {uploading ? 'Uploading…' : helperText}
          </Typography>
        </Box>

        <Button

          sx={{ display: viewOnly ? 'none' : 'inline-flex' }}
          size="small"
          variant="outlined"
          onClick={open}
          disabled={uploading}
          startIcon={<Iconify icon="eva:cloud-upload-fill" width={16} />}
        >
          Upload
        </Button>
      </Stack>

      {files.length ? (
        <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 1.25 }}>
          {files.map((file, index) => {
            const href = resolveUploadedAssetUrl(file) || (typeof file === 'string' ? file : '');
            return (
              <Chip
                key={`${getFileName(file)}-${index}`}
                size="small"
                color="primary"
                variant="outlined"
                icon={<FileTypeIcon file={file} />}
                label={getFileName(file)}
                component={href ? 'a' : 'div'}
                href={href || undefined}
                target={href ? '_blank' : undefined}
                rel={href ? 'noopener noreferrer' : undefined}
                onDelete={viewOnly ? undefined : () => onChange?.(files.filter((_, i) => i !== index))}
                sx={{ maxWidth: 240 }}
              />
            );
          })}
        </Stack>
      ) : null}
    </Box>
  );
}
