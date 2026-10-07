const PENDING_EMAIL_VERIFY_KEY = 'tempy-pending-email-verify';
const PREFERRED_AUTH_ROLE_KEY = 'tempy-preferred-auth-role';

// ----------------------------------------------------------------------

/**
 * TEMP: Email OTP delivery is not connected yet — show & auto-fill OTP on screen
 * everywhere (including production). Set VITE_SHOW_OTP_ON_SCREEN=false to disable.
 */
export function isOtpScreenPreviewEnabled() {
  const override = import.meta.env.VITE_SHOW_OTP_ON_SCREEN;

  if (override === 'false') return false;
  if (override === 'true') return true;

  return true;
}

export function resolveOtpForScreen(otp) {
  if (!isOtpScreenPreviewEnabled()) return '';

  return String(otp || '').trim();
}

export function applyServerOtpToForm({ otp, setDevOtp, setValue }) {
  const visibleOtp = resolveOtpForScreen(otp);

  if (!visibleOtp) return '';

  if (setDevOtp) setDevOtp(visibleOtp);
  if (setValue) setValue('otp', visibleOtp, { shouldValidate: true });

  return visibleOtp;
}

export function extractSignupOtp(response) {
  const data = response?.data ?? response;

  return (
    data?.otpInfo?.emailOtp?.otp ||
    data?.emailOtp?.otp ||
    data?.otpInfo?.otp ||
    data?.otp ||
    data?.devOtp ||
    data?.result?.otp ||
    response?.otpInfo?.emailOtp?.otp ||
    response?.emailOtp?.otp ||
    response?.otpInfo?.otp ||
    response?.otp ||
    response?.devOtp ||
    ''
  );
}

export function extractResetToken(response) {
  const data = response?.data ?? response;

  return (
    data?.resetToken ||
    data?.reset_token ||
    data?.otpInfo?.resetToken ||
    data?.result?.resetToken ||
    response?.resetToken ||
    response?.reset_token ||
    ''
  );
}

export function savePreferredAuthRole(role) {
  if (typeof window === 'undefined' || !role) return;
  localStorage.setItem(PREFERRED_AUTH_ROLE_KEY, role);
}

export function loadPreferredAuthRole() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(PREFERRED_AUTH_ROLE_KEY) || null;
}

export function savePendingEmailVerification({ email, devOtp = '', role = '', fromLogin = false }) {
  if (typeof window === 'undefined' || !email) return;

  if (role) {
    savePreferredAuthRole(role);
  }

  sessionStorage.setItem(
    PENDING_EMAIL_VERIFY_KEY,
    JSON.stringify({
      email: email.trim().toLowerCase(),
      devOtp: resolveOtpForScreen(devOtp),
      role: role || '',
      fromLogin: Boolean(fromLogin),
    })
  );
}

export function loadPendingEmailVerification() {
  if (typeof window === 'undefined') return null;

  try {
    const raw = sessionStorage.getItem(PENDING_EMAIL_VERIFY_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.email) return null;

    return {
      email: parsed.email,
      devOtp: resolveOtpForScreen(parsed.devOtp),
      role: parsed.role || '',
      fromLogin: Boolean(parsed.fromLogin),
    };
  } catch {
    return null;
  }
}

export function clearPendingEmailVerification() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(PENDING_EMAIL_VERIFY_KEY);
}

export function resolveEmailVerificationContext(locationState) {
  const pending = loadPendingEmailVerification();

  return {
    email: locationState?.email || pending?.email || '',
    devOtp: resolveOtpForScreen(locationState?.devOtp || pending?.devOtp || ''),
    role: locationState?.role || pending?.role || loadPreferredAuthRole() || '',
    fromLogin: Boolean(locationState?.fromLogin || pending?.fromLogin),
  };
}

/** Login API: supplier-added staff / unverified accounts. */
export function isEmailVerificationPendingMessage(message) {
  const raw = String(message || '').toLowerCase();
  if (!raw) return false;

  return (
    raw.includes('verify your account') ||
    raw.includes('account verification is pending') ||
    raw.includes('verification is pending') ||
    raw.includes('please verify your account') ||
    raw.includes('email not verified') ||
    raw.includes('please verify your email') ||
    raw.includes('verify your email') ||
    (raw.includes('unverified') && (raw.includes('email') || raw.includes('account')))
  );
}
