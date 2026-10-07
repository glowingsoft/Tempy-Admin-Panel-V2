import { AUTH_PUBLIC_LOGIN_ROLE_OPTIONS } from 'src/sections/auth/jwt/auth-role-options';

import { _faqs } from 'src/_mock';

// ----------------------------------------------------------------------

const STORAGE_KEY = 'tempy-faqs';

function readStoredFaqs() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeStoredFaqs(faqs) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(faqs));
  } catch {
    // ignore quota / private mode failures
  }
}

let faqsCache = readStoredFaqs() || _faqs.map((item) => ({ ...item }));

export const FAQ_TYPE_OPTIONS = AUTH_PUBLIC_LOGIN_ROLE_OPTIONS.map((option) => ({
  // Backend Faq/Support `type` enum uses apiUserType (careHome, nurse, …)
  value: option.apiUserType,
  label: option.label,
}));

export function getFaqTypeLabel(type) {
  const match = FAQ_TYPE_OPTIONS.find((option) => option.value === type);
  if (match) return match.label;

  // Tolerate UI account keys (care_home, local_authority, …)
  const byAccount = AUTH_PUBLIC_LOGIN_ROLE_OPTIONS.find((option) => option.value === type);
  if (byAccount) return byAccount.label;

  return type || '—';
}

export function getFaqs() {
  return faqsCache;
}

export function setFaqs(nextFaqs) {
  faqsCache = nextFaqs;
  writeStoredFaqs(faqsCache);
  return faqsCache;
}

export function getFaqsByType(type) {
  if (!type) return [];
  return faqsCache.filter((faq) => faq.type === type);
}
