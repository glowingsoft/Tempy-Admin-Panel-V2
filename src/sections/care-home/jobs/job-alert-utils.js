import { parsePhoneNumber } from 'react-phone-number-input';

import { countries } from 'src/assets/data/countries';


export const JOB_ALERT_MAX_HOURS = 168;
export const JOB_ALERT_MAX_MINUTES = 59;
export const JOB_ALERT_DEFAULT_CODE = '+44';

export const EMPTY_JOB_ALERT = {
  enabled: false,
  phoneNumber: { code: '', number: '' },
  hoursBefore: 0,
  minutesBefore: 0,
};

function toWholeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
}

export function mapJobAlertFromApi(source) {
  const alert = source?.alert && typeof source.alert === 'object' ? source.alert : source;
  if (!alert || typeof alert !== 'object') return { ...EMPTY_JOB_ALERT, phoneNumber: { ...EMPTY_JOB_ALERT.phoneNumber } };

  const phone = alert.phoneNumber && typeof alert.phoneNumber === 'object' ? alert.phoneNumber : {};

  return {
    enabled: alert.enabled === true,
    phoneNumber: {
      code: String(phone.code ?? '').trim(),
      number: String(phone.number ?? '').trim(),
    },
    hoursBefore: toWholeNumber(alert.hoursBefore),
    minutesBefore: toWholeNumber(alert.minutesBefore),
  };
}

export function mapJobAlertMutationResponse(response) {
  return {
    ...mapJobAlertFromApi(response?.data ?? response),
    message: String(response?.message || response?.data?.message || '').trim(),
  };
}

export function patchJobAlert(draft, alert) {
  if (!draft || typeof draft !== 'object' || !alert) return;
  draft.alert = alert;
  if (draft.raw && typeof draft.raw === 'object') draft.raw.alert = alert;
}

export function normalizeAlertPhoneNumber(value) {
  return String(value ?? '').replace(/[\s-]+/g, '');
}

export function normalizeAlertPhoneCode(value) {
  const digits = String(value ?? '').replace(/[^\d]/g, '');
  return digits ? `+${digits}` : '';
}

/**
 * @returns {{ phone?: string, time?: string }}
 */
export function validateJobAlertForm(form) {
  const errors = {};
  const code = normalizeAlertPhoneCode(form.phoneNumber.code);
  const number = normalizeAlertPhoneNumber(form.phoneNumber.number);
  const hours = Number(form.hoursBefore);
  const minutes = Number(form.minutesBefore);
  const hasPhone = Boolean(number);

  if (hasPhone && (!/^\+\d{1,4}$/.test(code) || !/^\d{4,14}$/.test(number))) {
    errors.phone = 'Enter a country code like +44 and a 4–14 digit number.';
  } else if (form.enabled && !hasPhone) {
    errors.phone = 'A phone number is required to turn the alert on.';
  }

  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || hours > JOB_ALERT_MAX_HOURS || minutes < 0 || minutes > JOB_ALERT_MAX_MINUTES) {
    errors.time = `Hours must be 0–${JOB_ALERT_MAX_HOURS} and minutes 0–${JOB_ALERT_MAX_MINUTES}, in whole numbers.`;
  } else if (form.enabled && hours * 60 + minutes <= 0) {
    errors.time = 'Set a time above zero to turn the alert on.';
  }

  return errors;
}

export function buildJobAlertPayload(form) {
  const number = normalizeAlertPhoneNumber(form.phoneNumber.number);

  return {
    enabled: Boolean(form.enabled),
    phoneNumber: {
      code: number ? normalizeAlertPhoneCode(form.phoneNumber.code) : '',
      number,
    },
    hoursBefore: Number(form.hoursBefore),
    minutesBefore: Number(form.minutesBefore),
  };
}

const DIAL_CODES_LONGEST_FIRST = [...new Set(
  countries
    .map((country) => `+${String(country.phone || '').replace(/\D/g, '')}`)
    .filter((code) => /^\+\d{1,4}$/.test(code))
)].sort((left, right) => right.length - left.length);

export function splitStoredPhone(value, fallbackCode = JOB_ALERT_DEFAULT_CODE) {
  const raw = String(value || '').trim();
  if (!raw) return { code: fallbackCode, number: '' };

  const compact = raw.startsWith('+') ? raw.replace(/[\s()-]/g, '') : '';
  if (compact) {
    try {
      const parsed = parsePhoneNumber(compact);
      if (parsed?.countryCallingCode) {
        return {
          code: `+${parsed.countryCallingCode}`,
          number: String(parsed.nationalNumber || ''),
        };
      }
    } catch {
    }

    const dialCode = DIAL_CODES_LONGEST_FIRST.find((code) => compact.startsWith(code));
    if (dialCode) {
      return { code: dialCode, number: compact.slice(dialCode.length) };
    }
  }

  return { code: fallbackCode, number: raw.replace(/[^\d]/g, '') };
}

export function toPhoneInputValue(value) {
  const { code, number } = splitStoredPhone(value);
  if (!number) return undefined;
  return `${normalizeAlertPhoneCode(code) || JOB_ALERT_DEFAULT_CODE}${number}`;
}

export function formatJobAlertLead(hoursBefore, minutesBefore) {
  const parts = [];
  if (hoursBefore) parts.push(`${hoursBefore} ${hoursBefore === 1 ? 'hour' : 'hours'}`);
  if (minutesBefore) parts.push(`${minutesBefore} ${minutesBefore === 1 ? 'minute' : 'minutes'}`);
  return parts.join(' ');
}
