import { createApi } from '@reduxjs/toolkit/query/react';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';

/** Images and docs — backend rejects over 10MB; check before upload. */
export const MAX_UPLOAD_FILE_BYTES = 10 * 1024 * 1024;

/**
 * Shared file upload — POST /upload/aws
 * Body: form-data { files: File }
 * Response: { message, data: { file, fileUrl, originalName, fileExtension } }
 * `file` is a storage key and may contain "/".
 */
export const uploadApi = createApi({
  reducerPath: 'uploadApi',
  baseQuery: createCustomFetchBaseQuery(),
  endpoints: (builder) => ({
    uploadAwsFile: builder.mutation({
      query: (file) => {
        const formData = new FormData();
        const originalName = String(file?.name || '').trim() || 'file';
        // Keep the browser filename on the multipart part so storage can use the real name.
        formData.append('files', file, originalName);
        formData.append('originalName', originalName);
        formData.append('fileName', originalName);

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

        // Storage key — may contain "/"; do not strip to basename.
        const fileKey = String(
          (typeof data?.file === 'string' && !/^https?:\/\//i.test(data.file) ? data.file : '') ||
            data?.fileName ||
            data?.file_name ||
            data?.key ||
            nestedFile?.file ||
            nestedFile?.key ||
            ''
        ).trim();

        const originalName = String(
          data?.originalName ||
            data?.original_name ||
            nestedFile?.originalName ||
            data?.name ||
            ''
        ).trim();

        const name = originalName || fileKey || (fileUrl ? fileUrl.split('/').pop()?.split('?')[0] : '') || '';

        return {
          message: response?.message || 'Files uploaded successfully',
          // Backend: save originalName as name, and file (key/url) as url.
          name,
          originalName: originalName || name,
          file: fileKey || fileUrl || '',
          fileUrl: fileUrl || fileKey || '',
          url: fileUrl || fileKey || '',
          fileExtension: data?.fileExtension || data?.file_extension || '',
          raw: response,
        };
      },
      transformErrorResponse: (response) => {
        const data = response?.data && typeof response.data === 'object' ? response.data : {};
        const nested = data?.data && typeof data.data === 'object' ? data.data : data;
        return {
          ...response,
          data: {
            ...data,
            oversizedFiles: nested?.oversizedFiles || data?.oversizedFiles || [],
          },
        };
      },
    }),
  }),
});

export const { useUploadAwsFileMutation } = uploadApi;

/** True when the file exceeds the backend image/doc size limit. */
export function isUploadOversized(file, maxBytes = MAX_UPLOAD_FILE_BYTES) {
  return Boolean(file && typeof file.size === 'number' && file.size > maxBytes);
}

/** Split files into ok / oversized before calling upload. */
export function partitionUploadFilesBySize(files = [], maxBytes = MAX_UPLOAD_FILE_BYTES) {
  const list = Array.isArray(files) ? files : [];
  const accepted = [];
  const oversized = [];
  list.forEach((file) => {
    if (isUploadOversized(file, maxBytes)) oversized.push(file);
    else accepted.push(file);
  });
  return { accepted, oversized };
}

/** Human message from oversized local files or API `data.oversizedFiles`. */
export function formatOversizedUploadMessage(oversized = []) {
  const names = (Array.isArray(oversized) ? oversized : [])
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      return String(item?.originalName || item?.name || item?.fileName || '').trim();
    })
    .filter(Boolean);
  if (!names.length) return 'One or more files exceed the 10 MB limit.';
  if (names.length === 1) return `"${names[0]}" exceeds the 10 MB limit.`;
  return `${names.length} files exceed the 10 MB limit: ${names.slice(0, 3).join(', ')}${
    names.length > 3 ? '…' : ''
  }`;
}

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
  if (value?.url) return resolveProfileAssetUrl(value.url);
  if (value?.file && String(value.file).includes('://')) return String(value.file);
  if (value?.file) return resolveProfileAssetUrl(value.file);
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
    if (value.url) return resolveProfileAssetUrl(value.url, depth + 1);
    if (value.file) return resolveProfileAssetUrl(value.file, depth + 1);
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
 * API profileIcon / document fields expect the upload `file` key.
 * Keys may contain "/" — keep the full key, do not strip to basename.
 */
export function toApiUploadedFileName(value, fallback = 'default.png') {
  if (!value) return fallback;

  if (typeof value === 'object' && !(value instanceof File)) {
    const fileKey = String(value.file || value.fileName || value.key || '').trim();
    if (fileKey && !/^https?:\/\//i.test(fileKey)) {
      return fileKey;
    }
    return toApiUploadedFileName(value.fileUrl || value.url || '', fallback);
  }

  if (value instanceof File) {
    return value.name || fallback;
  }

  const raw = String(value).trim();
  if (!raw) return fallback;

  // Full URL → path after host (may include folders). Fall back to basename if parsing fails.
  if (/^https?:\/\//i.test(raw)) {
    try {
      const path = new URL(raw).pathname.replace(/^\//, '');
      return decodeURIComponent(path.split('?')[0]) || fallback;
    } catch {
      const base = raw.split('/').filter(Boolean).pop() || raw;
      return base.split('?')[0] || fallback;
    }
  }

  // Path-like key with "/" — keep as-is (backend keys contain "/").
  return raw.split('?')[0] || fallback;
}
