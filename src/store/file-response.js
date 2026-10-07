/**
 * Helpers for endpoints that return a file (CSV / XLSX) instead of JSON.
 *
 * `fileResponseHandler` is passed to fetchBaseQuery as `responseHandler`, so the
 * raw Response is read here — that is the only place `content-disposition` is
 * still available. Some backends answer with JSON holding a download URL, so
 * both shapes are returned and the caller decides what to do with them.
 */

/** Multipart field name the import endpoints read the CSV from. */
export const IMPORT_FILE_FIELD = 'file';

function parseFilename(contentDisposition = '') {
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition);
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1].trim().replace(/^"|"$/g, ''));
    } catch {
      // fall through to the plain filename
    }
  }

  const plain = /filename="?([^";]+)"?/i.exec(contentDisposition);
  return plain?.[1] ? plain[1].trim() : '';
}

export async function fileResponseHandler(response) {
  const contentType = response.headers.get('content-type') || '';
  const filename = parseFilename(response.headers.get('content-disposition') || '');

  // Errors — and "here is a URL" responses — come back as JSON.
  if (contentType.includes('application/json')) {
    const json = await response.json().catch(() => null);
    return { json, contentType, filename };
  }

  const blob = await response.blob();
  return { blob, contentType, filename };
}

/** Pull a download URL out of a JSON template response. */
export function pickTemplateUrl(json) {
  const data = json?.data ?? json;
  if (typeof data === 'string' && /^https?:\/\//i.test(data)) return data;
  return String(
    data?.url || data?.fileUrl || data?.templateUrl || data?.downloadUrl || ''
  ).trim();
}
