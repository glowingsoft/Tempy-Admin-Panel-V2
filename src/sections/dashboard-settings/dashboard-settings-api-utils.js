// ----------------------------------------------------------------------

/**
 * Per-dashboard settings content + contact routes.
 * Paths are identical for now; change independently later (same as Support/FAQs).
 */
export const SETTINGS_ROUTE_KEYS_BY_ACCOUNT = {
  care_home: {
    terms: 'CARE_HOME_TERMS',
    about: 'CARE_HOME_ABOUT',
    privacy: 'CARE_HOME_PRIVACY',
    contact: 'CARE_HOME_CONTACT_CREATE',
  },
  careHome: {
    terms: 'CARE_HOME_TERMS',
    about: 'CARE_HOME_ABOUT',
    privacy: 'CARE_HOME_PRIVACY',
    contact: 'CARE_HOME_CONTACT_CREATE',
  },
  hospital_nhs: {
    terms: 'HOSPITAL_TERMS',
    about: 'HOSPITAL_ABOUT',
    privacy: 'HOSPITAL_PRIVACY',
    contact: 'HOSPITAL_CONTACT_CREATE',
  },
  hospital: {
    terms: 'HOSPITAL_TERMS',
    about: 'HOSPITAL_ABOUT',
    privacy: 'HOSPITAL_PRIVACY',
    contact: 'HOSPITAL_CONTACT_CREATE',
  },
  local_authority: {
    terms: 'LOCAL_AUTHORITY_TERMS',
    about: 'LOCAL_AUTHORITY_ABOUT',
    privacy: 'LOCAL_AUTHORITY_PRIVACY',
    contact: 'LOCAL_AUTHORITY_CONTACT_CREATE',
  },
  localAuthority: {
    terms: 'LOCAL_AUTHORITY_TERMS',
    about: 'LOCAL_AUTHORITY_ABOUT',
    privacy: 'LOCAL_AUTHORITY_PRIVACY',
    contact: 'LOCAL_AUTHORITY_CONTACT_CREATE',
  },
  individual_home_care: {
    terms: 'INDIVIDUAL_HOME_CARE_TERMS',
    about: 'INDIVIDUAL_HOME_CARE_ABOUT',
    privacy: 'INDIVIDUAL_HOME_CARE_PRIVACY',
    contact: 'INDIVIDUAL_HOME_CARE_CONTACT_CREATE',
  },
  agency: {
    terms: 'AGENCY_TERMS',
    about: 'AGENCY_ABOUT',
    privacy: 'AGENCY_PRIVACY',
    contact: 'AGENCY_CONTACT_CREATE',
  },
  home_care_company: {
    terms: 'HOME_CARE_COMPANY_TERMS',
    about: 'HOME_CARE_COMPANY_ABOUT',
    privacy: 'HOME_CARE_COMPANY_PRIVACY',
    contact: 'HOME_CARE_COMPANY_CONTACT_CREATE',
  },
  homeCareCompany: {
    terms: 'HOME_CARE_COMPANY_TERMS',
    about: 'HOME_CARE_COMPANY_ABOUT',
    privacy: 'HOME_CARE_COMPANY_PRIVACY',
    contact: 'HOME_CARE_COMPANY_CONTACT_CREATE',
  },
  staff_member: {
    terms: 'STAFF_MEMBER_TERMS',
    about: 'STAFF_MEMBER_ABOUT',
    privacy: 'STAFF_MEMBER_PRIVACY',
    contact: 'STAFF_MEMBER_CONTACT_CREATE',
  },
  nurse: {
    terms: 'STAFF_MEMBER_TERMS',
    about: 'STAFF_MEMBER_ABOUT',
    privacy: 'STAFF_MEMBER_PRIVACY',
    contact: 'STAFF_MEMBER_CONTACT_CREATE',
  },
};

export const SETTINGS_CONTENT_TYPES = {
  terms: {
    key: 'terms',
    heading: 'Terms and Conditions',
    titleFallback: 'Terms and Conditions',
    subtitle: 'Please read these terms carefully before using Tempy services.',
    icon: 'solar:document-text-bold',
  },
  about: {
    key: 'about',
    heading: 'About Us',
    titleFallback: 'About Us',
    subtitle: 'Learn more about Tempy and how we support care teams.',
    icon: 'solar:info-circle-bold',
  },
  privacy: {
    key: 'privacy',
    heading: 'Privacy Policy',
    titleFallback: 'Privacy Policy',
    subtitle: 'How we collect, use, and protect your information.',
    icon: 'solar:shield-keyhole-bold',
  },
};

export function resolveSettingsAccountKey(user) {
  const accountType = user?.accountState?.accountType || user?.accountType || user?.userType || '';
  const permission = Number(user?.permission);

  if (SETTINGS_ROUTE_KEYS_BY_ACCOUNT[accountType]) return accountType;

  if (permission === 2) return 'care_home';
  if (permission === 3) return 'agency';
  if (permission === 4) return 'hospital_nhs';
  if (permission === 5) return 'local_authority';
  if (permission === 6) return 'individual_home_care';
  if (permission === 7) return 'home_care_company';
  if (permission === 8) return 'staff_member';

  return '';
}

function looksLikeHtml(value) {
  return /<\/?[a-z][\s\S]*>/i.test(String(value || ''));
}

const SETTINGS_CONTENT_FIELD_KEYS = [
  'content',
  'description',
  'text',
  'body',
  'html',
  'detail',
  'about_us',
  'aboutUs',
  'about',
  'about_en',
  'aboutUs_en',
  'privacy_policy',
  'privacyPolicy',
  'privacy',
  'terms_conditions',
  'terms_and_conditions',
  'termsConditions',
  'termsAndConditions',
  'term_conditions',
  'terms',
  'value',
  'en',
  'english',
  'text_en',
  'textEn',
];

function pickSettingsContentField(raw) {
  if (!raw) return { content: '', contentKey: '' };
  if (typeof raw === 'string') return { content: raw, contentKey: '' };

  if (typeof raw !== 'object') return { content: '', contentKey: '' };

  for (const key of SETTINGS_CONTENT_FIELD_KEYS) {
    if (raw[key] == null) continue;
    const text = String(raw[key]).trim();
    if (text) return { content: text, contentKey: key };
  }

  if (typeof raw.data === 'string' && raw.data.trim()) {
    return { content: raw.data.trim(), contentKey: 'data' };
  }

  return { content: '', contentKey: '' };
}

function pickSettingsContent(raw) {
  return pickSettingsContentField(raw).content;
}

export function normalizeSettingsContentResponse(response) {
  let raw = response?.data ?? response;

  // Some list-shaped payloads: [{ type, content, ... }]
  if (Array.isArray(raw)) {
    const about = raw.find((item) => {
      const t = String(item?.type || item?.settingType || item?.key || '').toLowerCase();
      return t.includes('about');
    });
    // Dedicated about-us GET often returns a 1-item list without type
    raw = about || raw[0] || null;
  } else if (raw && typeof raw === 'object') {
    const nestedList = Array.isArray(raw.docs) ? raw.docs : Array.isArray(raw.items) ? raw.items : Array.isArray(raw.data) ? raw.data : null;

    const nestedAbout = nestedList
      ? nestedList.find((item) => {
          const t = String(item?.type || item?.settingType || item?.key || '').toLowerCase();
          return t.includes('about');
        }) || nestedList[0]
      : null;

    const nested = raw.aboutUs || raw.about || raw.setting || nestedAbout || null;

    if (nested && typeof nested === 'object' && !pickSettingsContent(raw)) {
      raw = nested;
    }
  }

  if (typeof raw === 'string') {
    return {
      id: '',
      title: '',
      content: raw,
      contentKey: '',
      type: '',
      isHtml: looksLikeHtml(raw),
      message: response?.message || '',
      meta: response?.meta || {},
    };
  }

  if (!raw || typeof raw !== 'object') {
    return {
      id: '',
      title: '',
      content: '',
      contentKey: '',
      type: '',
      isHtml: false,
      message: response?.message || '',
      meta: response?.meta || {},
    };
  }

  const { content, contentKey } = pickSettingsContentField(raw);

  const title = String(raw.title || raw.heading || raw.name || '').trim();
  const rawId = String(raw._id || raw.id || '').trim();
  // Only keep real Mongo ids — avoids treating placeholders as "existing"
  const id = /^[a-f\d]{24}$/i.test(rawId) ? rawId : '';

  return {
    id,
    title,
    content,
    contentKey,
    type: String(raw.type || raw.settingType || '').trim(),
    isHtml: Boolean(raw.isHtml) || looksLikeHtml(content),
    message: response?.message || '',
    meta: response?.meta || {},
    raw,
  };
}

/** Admin legal pages config — GET field + PUT body key */
export const ADMIN_LEGAL_PAGE_CONFIG = {
  about: {
    label: 'About Us',
    contentKey: 'about_us',
    tagId: 'ABOUT',
  },
  policy: {
    label: 'Privacy Policy',
    contentKey: 'privacy_policy',
    tagId: 'PRIVACY',
  },
  terms: {
    label: 'Terms',
    // Common backend keys — actual key from GET is preferred at save time
    contentKey: 'terms_and_conditions',
    tagId: 'TERMS',
  },
};

/** Admin About / Privacy / Terms → PUT /admin/settings/update/:id body */
export function buildAdminSettingPayload(pageType = 'about', { content = '', contentKey = '' } = {}) {
  const config = ADMIN_LEGAL_PAGE_CONFIG[pageType] || ADMIN_LEGAL_PAGE_CONFIG.about;
  const key = String(contentKey || config.contentKey || 'content').trim();
  return {
    [key]: String(content || '').trim(),
  };
}

/** @deprecated use buildAdminSettingPayload('about', ...) */
export function buildAboutUsPayload({ content = '', title = '' } = {}) {
  const body = buildAdminSettingPayload('about', { content });
  const resolvedTitle = String(title || '').trim();
  if (resolvedTitle) body.title = resolvedTitle;
  return body;
}

export function buildContactUsPayload({ name = '', email = '', phoneNumber = '', subject = '', message = '', description = '' } = {}) {
  const resolvedSubject = String(subject || '').trim();
  const resolvedMessage = String(message || description || '').trim();
  // Backend contact-us historically stores `description` (not subject/message alone).
  const resolvedDescription = String(description || '').trim() || (resolvedSubject ? `${resolvedSubject}\n\n${resolvedMessage}` : resolvedMessage);

  const payload = {
    name: String(name || '').trim(),
    email: String(email || '')
      .trim()
      .toLowerCase(),
    subject: resolvedSubject,
    message: resolvedMessage,
    description: resolvedDescription,
  };

  const phone = String(phoneNumber || '').trim();
  if (phone) payload.phoneNumber = phone;

  return payload;
}

export function validateContactUsPayload(payload = {}) {
  if (!payload.name) return 'Name is required.';
  if (!payload.email) return 'Email is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) return 'Enter a valid email.';
  if (!payload.subject) return 'Subject is required.';
  if (!payload.message) return 'Message is required.';
  return '';
}
