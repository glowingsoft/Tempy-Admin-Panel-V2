import { Controller, useFormContext } from 'react-hook-form';
import { useState } from 'react';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import FormHelperText from '@mui/material/FormHelperText';

import { toast } from 'src/components/snackbar';
import { useUploadAwsFileMutation } from 'src/store/Reducer/upload-api';

import { Upload, UploadBox, UploadAvatar } from '../upload';

// ----------------------------------------------------------------------

export function RHFUploadAvatar({ name, ...other }) {
  const { control, setValue } = useFormContext();
  const [uploadAwsFile] = useUploadAwsFileMutation();
  const [uploading, setUploading] = useState(false);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const onDrop = async (acceptedFiles) => {
          const file = acceptedFiles?.[0];
          if (!file) return;

          setUploading(true);
          try {
            const result = await uploadAwsFile(file).unwrap();
            const fileKey = String(result?.file || '').trim();
            const fileUrl = String(result?.fileUrl || '').trim();
            if (!fileKey && !fileUrl) {
              throw new Error('Upload succeeded but no file was returned.');
            }
            // Keep both: preview uses fileUrl; API profileIcon must use `file` (not fileUrl)
            setValue(
              name,
              {
                file: fileKey || fileUrl.split('/').pop()?.split('?')[0] || '',
                fileUrl: fileUrl || fileKey,
              },
              { shouldValidate: true, shouldDirty: true }
            );
          } catch (err) {
            toast.error(
              err?.data?.message ||
                err?.error ||
                err?.message ||
                'Could not upload photo. Please try again.'
            );
          } finally {
            setUploading(false);
          }
        };

        return (
          <Box sx={{ position: 'relative' }}>
            <UploadAvatar
              value={field.value}
              error={!!error}
              onDrop={onDrop}
              disabled={uploading || other.disabled}
              {...other}
            />

            {uploading ? (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(255,255,255,0.55)',
                  borderRadius: '50%',
                  zIndex: 10,
                }}
              >
                <CircularProgress size={28} />
              </Box>
            ) : null}

            {!!error && (
              <FormHelperText error sx={{ px: 2, textAlign: 'center' }}>
                {error.message}
              </FormHelperText>
            )}
          </Box>
        );
      }}
    />
  );
}

// ----------------------------------------------------------------------

export function RHFUploadBox({ name, ...other }) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <UploadBox value={field.value} error={!!error} {...other} />
      )}
    />
  );
}

// ----------------------------------------------------------------------

export function RHFUpload({ name, multiple, helperText, ...other }) {
  const { control, setValue } = useFormContext();
  const [uploadAwsFile] = useUploadAwsFileMutation();
  const [uploading, setUploading] = useState(false);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const uploadProps = {
          multiple,
          accept: { 'image/*': [] },
          error: !!error,
          helperText: error?.message ?? helperText,
          disabled: uploading || other.disabled,
        };

        const onDrop = async (acceptedFiles) => {
          if (!acceptedFiles?.length) return;

          setUploading(true);
          try {
            if (multiple) {
              const uploaded = [];
              for (const file of acceptedFiles) {
                const result = await uploadAwsFile(file).unwrap();
                const url = result?.fileUrl || result?.file || '';
                if (url) uploaded.push(url);
              }
              const prev = Array.isArray(field.value) ? field.value : [];
              setValue(name, [...prev, ...uploaded], { shouldValidate: true, shouldDirty: true });
            } else {
              const result = await uploadAwsFile(acceptedFiles[0]).unwrap();
              const url = result?.fileUrl || result?.file || '';
              if (!url) throw new Error('Upload succeeded but no file URL was returned.');
              setValue(name, url, { shouldValidate: true, shouldDirty: true });
            }
          } catch (err) {
            toast.error(
              err?.data?.message ||
                err?.error ||
                err?.message ||
                'Could not upload file. Please try again.'
            );
          } finally {
            setUploading(false);
          }
        };

        return (
          <Box sx={{ position: 'relative' }}>
            <Upload {...uploadProps} value={field.value} onDrop={onDrop} {...other} />
            {uploading ? (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'rgba(255,255,255,0.5)',
                  zIndex: 2,
                  borderRadius: 1,
                }}
              >
                <CircularProgress size={28} />
              </Box>
            ) : null}
          </Box>
        );
      }}
    />
  );
}
