/** Staff CSV import — preview helpers + import response summary. */

import { pickTemplateUrl } from 'src/store/file-response';

export const STAFF_IMPORT_HEADERS = ['name', 'email', 'phone', 'role', 'team'];

/** Sample only — prefer the live GET …/staff/import/template from the server. */
export const STAFF_IMPORT_TEMPLATE_CSV = [
  STAFF_IMPORT_HEADERS.join(','),
  'Sam Taylor,sam.taylor@example.com,07123456789,healthcareAssistant,Care - Days',
  'Alex Morgan,alex.morgan@example.com,07987654321,generalNurse,Nursing',
].join('\n');

/** Save a Blob to disk under `filename`. */
export function saveBlobAsFile(blob, filename = 'download.csv') {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadStaffImportTemplate(filename = 'staff-import-template.csv') {
  saveBlobAsFile(
    new Blob([STAFF_IMPORT_TEMPLATE_CSV], { type: 'text/csv;charset=utf-8;' }),
    filename
  );
}

/**
 * Save whatever the template endpoint returned — the file itself, or JSON
 * pointing at a hosted copy. Returns false when the response held neither.
 */
export function saveTemplateResponse(response, fallbackName = 'staff-import-template.csv') {
  if (response?.blob?.size) {
    saveBlobAsFile(response.blob, response.filename || fallbackName);
    return true;
  }

  const url = pickTemplateUrl(response?.json);
  if (url) {
    const link = document.createElement('a');
    link.href = url;
    link.download = response?.filename || fallbackName;
    link.target = '_blank';
    link.rel = 'noopener';
    link.click();
    return true;
  }

  return false;
}

function detectDelimiter(headerLine = '') {
  let commas = 0;
  let semicolons = 0;
  let inQuotes = false;

  for (let i = 0; i < headerLine.length; i += 1) {
    const char = headerLine[i];
    if (char === '"') {
      if (inQuotes && headerLine[i + 1] === '"') {
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (inQuotes) continue;
    if (char === ',') commas += 1;
    if (char === ';') semicolons += 1;
  }

  return semicolons > commas ? ';' : ',';
}

function splitCsvLine(line, delimiter = ',') {
  const cells = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === delimiter && !inQuotes) {
      cells.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }
  cells.push(current.trim());
  return cells;
}

function normalizeHeader(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^\uFEFF/, '')
    .replace(/[\s_-]+/g, '');
}

const HEADER_ALIASES = {
  name: ['name', 'fullname', 'staffname', 'worker', 'displayname'],
  firstName: ['firstname', 'first', 'givenname', 'forename'],
  lastName: ['lastname', 'last', 'surname', 'familyname'],
  email: ['email', 'emailaddress', 'mail'],
  phone: ['phone', 'phonenumber', 'mobile', 'tel', 'telephone', 'mobilenumber'],
  role: ['role', 'jobrole', 'jobtitle', 'specialty', 'speciality', 'position', 'specialities'],
  team: ['team', 'teamname', 'group', 'department', 'unit'],
};

function mapHeaderIndexes(headerCells) {
  const normalized = headerCells.map(normalizeHeader);
  const indexes = {};

  Object.entries(HEADER_ALIASES).forEach(([field, aliases]) => {
    const index = normalized.findIndex((cell) => aliases.includes(cell));
    if (index >= 0) indexes[field] = index;
  });

  return indexes;
}

/**
 * Parse CSV text → { rows, errors }
 * Required for preview: name (or first+last) or email.
 * Role/team are optional — the server template is the source of truth for import.
 */
export function parseStaffImportCsv(text = '') {
  const lines = String(text || '')
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return { rows: [], errors: ['File is empty'] };
  }

  const delimiter = detectDelimiter(lines[0]);
  const headerCells = splitCsvLine(lines[0], delimiter);
  const indexes = mapHeaderIndexes(headerCells);

  if (
    indexes.name == null &&
    indexes.email == null &&
    indexes.firstName == null &&
    indexes.lastName == null
  ) {
    return {
      rows: [],
      errors: ['CSV must include a name or email column (or first name + last name)'],
    };
  }

  const rows = [];
  const errors = [];

  lines.slice(1).forEach((line, lineIndex) => {
    const cells = splitCsvLine(line, delimiter);
    const get = (field) => {
      const index = indexes[field];
      return index == null ? '' : String(cells[index] || '').trim();
    };

    const firstName = get('firstName');
    const lastName = get('lastName');
    const combinedName = [firstName, lastName].filter(Boolean).join(' ').trim();
    const name = get('name') || combinedName;
    const email = get('email').toLowerCase();
    const phone = get('phone');
    const role = get('role');
    const team = get('team') || role;

    if (!name && !email) {
      errors.push(`Row ${lineIndex + 2}: missing name and email`);
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push(`Row ${lineIndex + 2}: invalid email (${email})`);
      return;
    }

    if (!role && !team) {
      errors.push(
        `Row ${lineIndex + 2}: no role/specialty/team — import may still work if the server template does not require it`
      );
    }

    rows.push({
      name: name || email,
      email,
      phone,
      role: role || team || '',
      team: team || role || 'General',
    });
  });

  return { rows, errors };
}

function toCount(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  if (Array.isArray(value)) return value.length;
  return null;
}

function collectImportErrors(source) {
  if (!source) return [];
  if (typeof source === 'string' && source.trim()) return [source.trim()];
  if (!Array.isArray(source)) return [];

  return source
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (!item || typeof item !== 'object') return '';
      return String(item.message || item.msg || item.error || item.reason || '').trim();
    })
    .filter(Boolean);
}

/**
 * Read imported/failed counts from common import response shapes.
 * `imported` / `failed` are `null` when the API did not send a count.
 */
export function summarizeStaffImportResponse(response) {
  const root = response && typeof response === 'object' ? response : {};
  const data =
    root.data && typeof root.data === 'object' && !Array.isArray(root.data) ? root.data : root;
  const nestedResult =
    data.result && typeof data.result === 'object' && !Array.isArray(data.result)
      ? data.result
      : null;
  const sources = [data, nestedResult, root].filter(Boolean);

  let imported = null;
  let failed = null;

  sources.forEach((source) => {
    if (imported == null) {
      imported = toCount(
        source.imported ??
          source.importedCount ??
          source.successCount ??
          source.created ??
          source.createdCount ??
          source.totalImported ??
          source.successful ??
          source.staffCreated
      );
    }
    if (imported == null && Array.isArray(source.createdStaff)) {
      imported = source.createdStaff.length;
    }
    if (imported == null && Array.isArray(source.staff) && source.staff.length) {
      imported = source.staff.length;
    }
    if (failed == null) {
      failed = toCount(
        source.failed ??
          source.failedCount ??
          source.errorCount ??
          source.skipped ??
          source.skippedCount ??
          source.totalFailed
      );
    }
  });

  if (imported == null && Array.isArray(root.data) && root.data.length) {
    imported = root.data.length;
  }

  const errors = [
    ...collectImportErrors(data.errors),
    ...collectImportErrors(data.failedRows),
    ...collectImportErrors(data.failures),
    ...collectImportErrors(nestedResult?.errors),
    ...collectImportErrors(root.errors),
  ];

  const message = String(root.message || data.message || '').trim();

  return {
    imported,
    failed,
    errors,
    message,
    hasExplicitCounts: imported != null || failed != null,
  };
}
