export const JOB_TYPE_CATEGORIES = ['Management', 'Care'];

export const DEFAULT_JOB_TYPE_LABELS = [
  'Management · Head of Care',
  'Management · Home Manager',
  'Management · Deputy Manager',
  'Care · Care Assistant Days',
  'Care · Care Assistant Days - Bank',
  'Care · Senior Care Days',
  'Care · Senior Care Nights',
  'Care · Lead Care Assistant Nights',
  'Care · Lead Care Assistant Days',
];

const STORAGE_KEY = 'care-home-job-types';

export function buildJobTypeLabel(category, name) {
  const trimmedCategory = category?.trim() || '';
  const trimmedName = name?.trim() || '';

  if (trimmedCategory && trimmedName) {
    return `${trimmedCategory} · ${trimmedName}`;
  }

  return trimmedName || trimmedCategory;
}

export function parseJobTypeLabel(label) {
  const separatorIndex = label.indexOf(' · ');

  if (separatorIndex === -1) {
    return { category: 'Care', name: label.trim() };
  }

  return {
    category: label.slice(0, separatorIndex).trim() || 'Care',
    name: label.slice(separatorIndex + 3).trim(),
  };
}

export function createJobTypeId() {
  return `job-type-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createJobType({ category, name, id = createJobTypeId() }) {
  const normalizedCategory = category?.trim() || 'Care';
  const normalizedName = name?.trim() || '';

  return {
    id,
    category: normalizedCategory,
    name: normalizedName,
    label: buildJobTypeLabel(normalizedCategory, normalizedName),
  };
}

export function createDefaultJobTypes() {
  return DEFAULT_JOB_TYPE_LABELS.map((label, index) => {
    const { category, name } = parseJobTypeLabel(label);

    return createJobType({
      id: `job-type-default-${index}`,
      category,
      name,
    });
  });
}

export function loadJobTypes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    // Empty until the org adds types — do not invent a default catalog.
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) return [];

    return parsed.map((item) =>
      createJobType({
        id: item.id || createJobTypeId(),
        category: item.category,
        name: item.name,
      })
    );
  } catch {
    return [];
  }
}

export function saveJobTypes(jobTypes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jobTypes));
}
