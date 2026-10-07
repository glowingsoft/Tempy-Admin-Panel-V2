import { createApi } from '@reduxjs/toolkit/query/react';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';

/**
 * Shared file upload — POST /upload/aws
 * Body: form-data { files: File }
 * Response: { message, data: { file, fileUrl, fileExtension } }
 */
export const uploadApi = createApi({
  reducerPath: 'uploadApi',
  baseQuery: createCustomFetchBaseQuery(),
  endpoints: (builder) => ({
    uploadAwsFile: builder.mutation({
      query: (file) => {
        const formData = new FormData();
        formData.append('files', file);

        return {
          url: API_ROUTES.UPLOAD_AWS,
          method: 'POST',
          body: formData,
        };
      },
      transformResponse: (response) => {
        const data = response?.data && typeof response.data === 'object' ? response.data : response;
        const nestedFile = Array.isArray(data?.files) ? data.files[0] : null;
        const fileUrl =
          data?.fileUrl ||
          data?.file_url ||
          data?.url ||
          data?.location ||
          data?.Location ||
          nestedFile?.fileUrl ||
          nestedFile?.url ||
          (typeof nestedFile === 'string' && nestedFile.startsWith('http') ? nestedFile : '') ||
          (typeof data?.file === 'string' && /^https?:\/\//i.test(data.file) ? data.file : '') ||
          '';
        const fileName = String(
          data?.fileName ||
            data?.file_name ||
            (typeof data?.file === 'string' && !/^https?:\/\//i.test(data.file) ? data.file : '') ||
            nestedFile?.file ||
            ''
        ).trim();

        return {
          message: response?.message || 'Files uploaded successfully',
          file: fileName || (fileUrl ? fileUrl.split('/').pop()?.split('?')[0] : '') || '',
          fileUrl: fileUrl || fileName || '',
          fileExtension: data?.fileExtension || data?.file_extension || '',
          raw: response,
        };
      },
    }),
  }),
});

export const { useUploadAwsFileMutation } = uploadApi;

/** Normalize API image fields (string, { file, fileUrl }, File) to a stored string. */
export function pickStoredMediaValue(value) {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  if (value instanceof File) return value.name || '';
  return String(value.fileUrl || value.url || value.file || value.preview || '').trim();
}

/** Resolve stored form value → URL for display/preview */
export function resolveUploadedAssetUrl(value) {
  if (!value) return '';
  if (typeof value === 'string') return resolveProfileAssetUrl(value);
  if (value instanceof File) return URL.createObjectURL(value);
  if (value?.fileUrl) return resolveProfileAssetUrl(value.fileUrl);
  if (value?.file && String(value.file).includes('://')) return String(value.file);
  if (value?.file) return resolveProfileAssetUrl(value.file);
  if (value?.url) return resolveProfileAssetUrl(value.url);
  if (value?.name) return resolveProfileAssetUrl(value.name);
  return '';
}

function isLikelyAssetUrl(value) {
  const raw = String(value || '').trim();
  return (
    /^https?:\/\//i.test(raw) ||
    raw.startsWith('blob:') ||
    raw.startsWith('data:') ||
    raw.startsWith('/')
  );
}

/** Turn API profileIcon filename into a browser-ready image URL */
export function resolveProfileAssetUrl(value, depth = 0) {
  if (!value || depth > 4) return '';

  if (typeof value === 'object' && !(value instanceof File)) {
    if (value.fileUrl) return resolveProfileAssetUrl(value.fileUrl, depth + 1);
    if (value.file) return resolveProfileAssetUrl(value.file, depth + 1);
    if (value.url) return resolveProfileAssetUrl(value.url, depth + 1);
    return '';
  }

  const raw = String(value).trim();
  // The API's placeholders (default.png / noimage.png) aren't in the bucket, so treat them as no picture.
  if (!raw || /(^|\/)(default|noimage)\.png(\?|$)/i.test(raw)) return '';
  if (raw.startsWith('//')) return `https:${raw}`;
  if (isLikelyAssetUrl(raw)) return raw;

  const assetUrl = String(import.meta.env.VITE_ASSET_URL || '').replace(/\/$/, '');
  const serverUrl = String(import.meta.env.VITE_SERVER_URL || '').replace(/\/$/, '');
  const apiBase = String(import.meta.env.VITE_BASE_URL || '').replace(/\/$/, '');
  const apiOrigin = apiBase.replace(/\/api\/v\d+$/i, '');

  const assetBase = assetUrl || serverUrl || apiOrigin || apiBase;
  if (!assetBase) return raw;

  return `${assetBase}/${raw.replace(/^\//, '')}`;
}

/**
 * API profileIcon / document fields expect the upload `file` key (filename),
 * not `fileUrl`. Error if URL is sent: "Expected file found fileUrl in profileIcon"
 */
export function toApiUploadedFileName(value, fallback = 'default.png') {
  if (!value) return fallback;

  if (typeof value === 'object' && !(value instanceof File)) {
    const fileKey = String(value.file || value.fileName || value.key || '').trim();
    if (fileKey && !/^https?:\/\//i.test(fileKey) && !fileKey.includes('/')) {
      return fileKey;
    }
    if (fileKey && !/^https?:\/\//i.test(fileKey)) {
      // path-like key without scheme — take last segment
      const base = fileKey.split('/').filter(Boolean).pop();
      if (base) return decodeURIComponent(base.split('?')[0]);
    }
    return toApiUploadedFileName(value.fileUrl || value.url || '', fallback);
  }

  if (value instanceof File) {
    return value.name || fallback;
  }

  const raw = String(value).trim();
  if (!raw) return fallback;

  // Full URL or path → basename only
  if (/^https?:\/\//i.test(raw) || raw.includes('/')) {
    try {
      const path = /^https?:\/\//i.test(raw) ? new URL(raw).pathname : raw;
      const base = path.split('/').filter(Boolean).pop() || '';
      const name = decodeURIComponent(base.split('?')[0]);
      return name || fallback;
    } catch {
      const base = raw.split('/').filter(Boolean).pop() || raw;
      return base.split('?')[0] || fallback;
    }
  }

  return raw;
}
