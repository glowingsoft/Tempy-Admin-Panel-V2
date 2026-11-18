import {
  HOME_CARE_PROVIDER_TERMS_HTML,
  HOME_CARE_PROVIDER_TERMS_META,
  isHomeCareCompanyAccountKey,
} from './home-care-provider-terms';
import {
  isSupplierTermsAccountKey,
  SUPPLIER_TERMS_HTML,
  SUPPLIER_TERMS_META,
} from './supplier-terms';

/** Resolve the exact client draft terms for supplier / home-care dashboards. */
export function resolveTermsForAccount(accountKey, apiTerms) {
  if (isHomeCareCompanyAccountKey(accountKey)) {
    return {
      ...(apiTerms && typeof apiTerms === 'object' ? apiTerms : {}),
      id: apiTerms?.id || '',
      title: 'Terms and Conditions',
      content: HOME_CARE_PROVIDER_TERMS_HTML,
      isHtml: true,
      version: HOME_CARE_PROVIDER_TERMS_META.version,
      message: apiTerms?.message || '',
      meta: apiTerms?.meta || {},
    };
  }

  if (isSupplierTermsAccountKey(accountKey)) {
    return {
      ...(apiTerms && typeof apiTerms === 'object' ? apiTerms : {}),
      id: apiTerms?.id || '',
      title: 'Terms and Conditions',
      content: SUPPLIER_TERMS_HTML,
      isHtml: true,
      version: SUPPLIER_TERMS_META.version,
      message: apiTerms?.message || '',
      meta: apiTerms?.meta || {},
    };
  }

  return apiTerms || null;
}

export function hasLocalDraftTerms(accountKey) {
  return isHomeCareCompanyAccountKey(accountKey) || isSupplierTermsAccountKey(accountKey);
}
