/** Staff CSV import — includes role / team (client: company-specific roles). */

import { pickTemplateUrl } from 'src/store/file-response';

export const STAFF_IMPORT_HEADERS = ['name', 'email', 'phone', 'role', 'team'];

export const STAFF_IMPORT_TEMPLATE_CSV = [
  STAFF_IMPORT_HEADERS.join(','),
  'Sam Taylor,sam.taylor@example.com,07123456789,Care Assistant,Care - Days',
  'Alex Morgan,alex.morgan@example.com,07987654321,Nurse,Nursing',
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

function splitCsvLine(line) {
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
    if (char === ',' && !inQuotes) {
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
    .replace(/[\s_-]+/g, '');
}

const HEADER_ALIASES = {
  name: ['name', 'fullname', 'staffname', 'worker'],
  email: ['email', 'emailaddress', 'mail'],
  phone: ['phone', 'phonenumber', 'mobile', 'tel'],
  role: ['role', 'jobrole', 'jobtitle', 'specialty', 'speciality', 'position'],
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
 * Required: name or email; role or team recommended.
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

  const headerCells = splitCsvLine(lines[0]);
  const indexes = mapHeaderIndexes(headerCells);

  if (indexes.name == null && indexes.email == null) {
    return {
      rows: [],
      errors: ['CSV must include a name or email column'],
    };
  }

  const rows = [];
  const errors = [];

  lines.slice(1).forEach((line, lineIndex) => {
    const cells = splitCsvLine(line);
    const get = (field) => {
      const index = indexes[field];
      return index == null ? '' : String(cells[index] || '').trim();
    };

    const name = get('name');
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
      errors.push(`Row ${lineIndex + 2}: add a role or team (required for company-specific rota)`);
      return;
    }

    rows.push({
      name: name || email,
      email,
      phone,
      role: role || team,
      team: team || role || 'General',
    });
  });

  return { rows, errors };
}
