import { toApiUploadedFileName, resolveProfileAssetUrl } from 'src/store/Reducer/upload-api';

import {
  DEFAULT_STAFF_PROFESSIONAL_PROFILE,
  createQualification,
} from './staff-member-profile-store';


function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function asList(value) {
  if (Array.isArray(value)) return value;
  if (value == null || value === '') return [];
  return [value];
}

function toDateInput(value) {
  if (!value) return '';
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

export function normalizeCertificateFiles(files = []) {
  return asList(files)
    .map((file) => {
      if (!file) return '';
      if (typeof file === 'string') {
        return resolveProfileAssetUrl(file) || file;
      }
      if (typeof file === 'object') {
        const key = file.fileUrl || file.url || file.path || file.file || file.fileName || file.name || '';
        return resolveProfileAssetUrl(key) || String(key || '').trim();
      }
      return '';
    })
    .filter(Boolean);
}

function toApiFileKeys(files = []) {
  return normalizeCertificateFiles(files)
    .map((file) => toApiUploadedFileName(file, ''))
    .filter(Boolean);
}

function mapTraining(list) {
  return asList(list)
    .map((item, index) => {
      if (!item) return null;
      if (typeof item === 'string') {
        return {
          id: `t-${index}`,
          name: item,
          status: 'valid',
          expiresOn: '',
        };
      }
      return {
        id: String(item.id || item._id || `t-${index}`),
        name: String(item.name || item.title || item.course || '').trim(),
        status: String(item.status || 'valid')
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '_'),
        expiresOn: toDateInput(item.expiresOn || item.expiryDate || item.expiry || ''),
      };
    })
    .filter((item) => item && item.name);
}

function mapQualifications(list) {
  return asList(list)
    .map((item) => {
      if (!item) return null;
      if (typeof item === 'string') {
        return createQualification({ title: item, files: [] });
      }
      const files = normalizeCertificateFiles(
        item.files || item.documents || item.certificates || item.file || []
      );
      const title = String(item.title || item.name || item.label || '').trim();
      if (!title && !files.length) return null;
      return createQualification({
        id: String(item.id || item._id || createQualification().id),
        title,
        files,
      });
    })
    .filter(Boolean);
}

function mapDbs(source = {}) {
  const dbs = asObject(source.dbs || source.DBS || source.dbsCheck);
  return {
    status: String(dbs.status || DEFAULT_STAFF_PROFESSIONAL_PROFILE.dbs.status)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_'),
    certificateNumber: String(
      dbs.certificateNumber || dbs.number || dbs.certificate || ''
    ).trim(),
    issueDate: toDateInput(dbs.issueDate || dbs.issuedOn || dbs.printDate || ''),
    expiryDate: toDateInput(dbs.expiryDate || dbs.expiresOn || dbs.expiry || ''),
  };
}

function mapRtw(source = {}) {
  const rtw = asObject(
    source.rtw || source.rightToWork || source.right_to_work || source.rightToWorkCheck
  );
  return {
    status: String(rtw.status || DEFAULT_STAFF_PROFESSIONAL_PROFILE.rtw.status)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_'),
    documentType: String(rtw.documentType || rtw.type || rtw.document || '').trim(),
    expiryDate: toDateInput(rtw.expiryDate || rtw.expiresOn || rtw.expiry || ''),
  };
}

function pickDocumentLists(raw = {}, basic = {}) {
  const docs = asObject(raw.documents || basic.documents);

  return {
    governmentId: normalizeCertificateFiles(
      raw.governmentIdentity ||
        basic.governmentIdentity ||
        docs.governmentId ||
        docs.governmentIdentity ||
        []
    ),
    nursingDegree: normalizeCertificateFiles(
      raw.degree || basic.degree || docs.nursingDegree || docs.degree || []
    ),
    professionalCerts: normalizeCertificateFiles(
      raw.certification ||
        raw.certifications ||
        basic.certification ||
        basic.certifications ||
        docs.professionalCerts ||
        docs.certifications ||
        docs.certification ||
        []
    ),
    dbsCertificate: normalizeCertificateFiles(
      raw.dbsCertificate ||
        raw.dbsDocument ||
        docs.dbsCertificate ||
        docs.dbs ||
        asObject(raw.dbs).certificate ||
        asObject(raw.dbs).file ||
        []
    ),
    rightToWork: normalizeCertificateFiles(
      raw.rightToWorkDocument ||
        raw.rightToWorkDocuments ||
        docs.rightToWork ||
        asObject(raw.rightToWork).documents ||
        asObject(raw.rtw).documents ||
        []
    ),
    other: normalizeCertificateFiles(
      raw.otherCertificates ||
        raw.otherDocuments ||
        docs.other ||
        docs.otherCertificates ||
        raw.validationDocument ||
        basic.validationDocument ||
        []
    ),
  };
}


export function mapStaffProfessionalFromProfile(profile) {
  const raw = asObject(profile?.raw || profile);
  const basic = asObject(raw.basicInfo);
  const source = { ...basic, ...raw };

  const bio = String(
    profile?.bio || source.bio || source.summary || source.about || ''
  ).trim();

  const training = mapTraining(source.training || source.trainings || source.mandatoryTraining);
  const qualifications = mapQualifications(source.qualifications || source.qualification);

  return {
    ...DEFAULT_STAFF_PROFESSIONAL_PROFILE,
    bio,
    training: training.length ? training : [],
    dbs: mapDbs(source),
    rtw: mapRtw(source),
    certificates: {
      ...DEFAULT_STAFF_PROFESSIONAL_PROFILE.certificates,
      ...pickDocumentLists(raw, basic),
    },
    qualifications,
  };
}


export function buildStaffProfessionalUpdatePayload(profile = {}) {
  const certificates = asObject(profile.certificates);
  const governmentIdentity = toApiFileKeys(certificates.governmentId);
  const degree = toApiFileKeys(certificates.nursingDegree);
  const certification = toApiFileKeys(certificates.professionalCerts);
  const dbsCertificate = toApiFileKeys(certificates.dbsCertificate);
  const rightToWorkDocs = toApiFileKeys(certificates.rightToWork);
  const otherCertificates = toApiFileKeys(certificates.other);

  const bio = String(profile.bio || '').trim();

  const payload = {
    bio,
    summary: bio,
    about: bio,
    governmentIdentity,
    degree,
    certification,
    dbs: {
      status: profile.dbs?.status || 'clear',
      certificateNumber: String(profile.dbs?.certificateNumber || '').trim(),
      issueDate: profile.dbs?.issueDate || '',
      expiryDate: profile.dbs?.expiryDate || '',
      ...(dbsCertificate.length ? { certificate: dbsCertificate } : {}),
    },
    rightToWork: {
      status: profile.rtw?.status || 'continuous',
      documentType: String(profile.rtw?.documentType || '').trim(),
      expiryDate: profile.rtw?.expiryDate || '',
      ...(rightToWorkDocs.length ? { documents: rightToWorkDocs } : {}),
    },
    training: (Array.isArray(profile.training) ? profile.training : [])
      .map((item) => ({
        id: item.id,
        name: String(item.name || '').trim(),
        status: item.status || 'valid',
        expiresOn: item.expiresOn || '',
      }))
      .filter((item) => item.name),
    qualifications: (Array.isArray(profile.qualifications) ? profile.qualifications : [])
      .map((item) => ({
        id: item.id,
        title: String(item.title || '').trim(),
        files: toApiFileKeys(item.files),
      }))
      .filter((item) => item.title),
  };

  if (dbsCertificate.length) payload.dbsCertificate = dbsCertificate;
  if (rightToWorkDocs.length) payload.rightToWorkDocument = rightToWorkDocs;
  if (otherCertificates.length) {
    payload.otherCertificates = otherCertificates;
    payload.validationDocument = otherCertificates;
  }

  return payload;
}
