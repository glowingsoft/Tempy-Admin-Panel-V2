import { useCallback, useEffect, useState } from 'react';

import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Upload } from 'src/components/upload';
import { toast } from 'src/components/snackbar';
import {
  useUploadAwsFileMutation,
  resolveUploadedAssetUrl,
} from 'src/store/Reducer/upload-api';

const MAX_SOURCE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function resolveJobImageSrc(image) {
  if (!image) return '';
  if (typeof image === 'string') {
    const value = image.trim();
    if (
      !value ||
      value === 'null' ||
      value === 'undefined' ||
      /^default\.(png|jpg|jpeg|webp)$/i.test(value)
    ) {
      return '';
    }
  }
  return resolveUploadedAssetUrl(image);
}

export function JobImageUpload({ value, onChange, disabled = false, required = false }) {
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [uploadAwsFile] = useUploadAwsFileMutation();

  const handleDrop = useCallback(
    async (acceptedFiles) => {
      const file = acceptedFiles?.[0];
      if (!file) return;

      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        setError('Please choose a JPG, PNG or WebP image.');
        return;
      }
      if (file.size > MAX_SOURCE_BYTES) {
        setError('Image must be smaller than 5 MB.');
        return;
      }

      setProcessing(true);
      setError('');
      try {
        const result = await uploadAwsFile(file).unwrap();
        const url = resolveUploadedAssetUrl(result?.fileUrl || result) || result?.fileUrl || result?.file || '';
        if (!url) throw new Error('Upload succeeded but no file URL was returned.');
        onChange(url);
      } catch (err) {
        const message =
          err?.data?.message || err?.error || err?.message || 'Could not upload this image.';
        setError(message);
        toast.error(message);
      } finally {
        setProcessing(false);
      }
    },
    [onChange, uploadAwsFile]
  );

  const handleRejected = useCallback(() => {
    setError('Please choose a JPG, PNG or WebP image smaller than 5 MB.');
  }, []);

  return (
    <Stack spacing={1}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
        <Typography variant="subtitle2" fontWeight={600}>
          {required ? 'Job image (required)' : 'Job image (optional)'}
        </Typography>
        {processing && (
          <Typography variant="caption" color="text.secondary">
            Uploading image…
          </Typography>
        )}
      </Stack>

      <Upload
        value={value}
        disabled={disabled || processing}
        accept={{ 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] }}
        maxSize={MAX_SOURCE_BYTES}
        onDrop={handleDrop}
        onDropRejected={handleRejected}
        onDelete={() => {
          setError('');
          onChange('');
        }}
        error={Boolean(error)}
        helperText={error || (required ? 'Required · JPG, PNG or WebP · maximum 5 MB' : 'JPG, PNG or WebP · maximum 5 MB')}
        sx={{ '& > div:first-of-type': { minHeight: 164 } }}
      />
    </Stack>
  );
}

function getImageInitial(text) {
  const cleaned = String(text || '')
    .trim()
    .replace(/^job image$/i, '');
  const match = cleaned.match(/[a-zA-Z0-9]/);
  return (match?.[0] || 'J').toUpperCase();
}

export function JobMediaThumb({
  image,
  alt = 'Job image',
  label,
  width = 48,
  height = 48,
  borderRadius = 1.25,
  sx,
}) {
  const src = resolveJobImageSrc(image);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const numericSize = [width, height]
    .map((value) => Number(value))
    .find((value) => Number.isFinite(value) && value > 0) || 48;

  return (
    <Avatar
      src={src && !failed ? src : undefined}
      alt=""
      title={alt}
      imgProps={{ onError: () => setFailed(true) }}
      sx={{
        width,
        height,
        minWidth: width === '100%' ? undefined : width,
        borderRadius,
        fontWeight: 700,
        fontSize: Math.max(14, Math.round(numericSize * 0.38)),
        bgcolor: 'primary.lighter',
        color: 'primary.darker',
        border: (theme) =>
          `1px solid ${(theme.vars || theme).palette.divider}`,
        ...sx,
      }}
    >
      {getImageInitial(label || alt)}
    </Avatar>
  );
}
