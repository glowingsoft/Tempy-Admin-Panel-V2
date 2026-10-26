const IGNORED_CLIENT_MESSAGES = new Set([
  'Rejected',
  'Network request failed',
  'Failed to fetch',
]);

function firstNonEmptyString(...candidates) {
  for (const value of candidates) {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed) return trimmed;
    }
  }
  return '';
}

function messageFromErrorsField(errors) {
  if (!errors) return '';

  if (typeof errors === 'string') return firstNonEmptyString(errors);

  if (Array.isArray(errors)) {
    for (const item of errors) {
      if (typeof item === 'string' && item.trim()) return item.trim();
      if (item && typeof item === 'object') {
        const nested = firstNonEmptyString(item.message, item.msg, item.error);
        if (nested) return nested;
      }
    }
  }

  if (typeof errors === 'object') {
    for (const value of Object.values(errors)) {
      const nested = messageFromErrorsField(value);
      if (nested) return nested;
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
  }

  return '';
}

function messageFromData(data) {
  if (!data) return '';
  if (typeof data === 'string') return firstNonEmptyString(data);

  let nestedErrorMessage = '';
  if (typeof data.error === 'string') {
    try {
      nestedErrorMessage = JSON.parse(data.error)?.message || data.error;
    } catch {
      nestedErrorMessage = data.error;
    }
  } else if (data.error && typeof data.error === 'object') {
    nestedErrorMessage = firstNonEmptyString(data.error.message, data.error.msg);
  }

  const topMessage =
    typeof data.message === 'string'
      ? data.message
      : data.message && typeof data.message === 'object'
        ? firstNonEmptyString(data.message.message, data.message.msg)
        : '';

  return firstNonEmptyString(
    topMessage,
    data.msg,
    data.errorMessage,
    nestedErrorMessage,
    messageFromErrorsField(data.errors),
    typeof data.data === 'string' ? data.data : data.data?.message
  );
}


export function pickApiToastMessage(payload, fallback = '') {
  const message = firstNonEmptyString(
    typeof payload === 'string' ? payload : '',
    payload?.message,
    payload?.msg,
    payload?.data?.message,
    typeof payload?.data === 'string' ? payload.data : '',
    payload?.data?.msg
  );
  return message || fallback || '';
}

export function handleApiError(error) {
  if (!error) return 'Unknown error occurred.';

  const apiError = error?.cause && typeof error.cause === 'object' ? error.cause : error;
  const data = apiError?.data ?? error?.data;

  const backendMessage = firstNonEmptyString(
    messageFromData(data),
    typeof apiError?.error === 'string' ? apiError.error : '',
    typeof error?.error === 'string' ? error.error : ''
  );

  if (backendMessage) {
    return backendMessage;
  }

  const clientMessage = firstNonEmptyString(error?.message, apiError?.message);
  if (clientMessage && !IGNORED_CLIENT_MESSAGES.has(clientMessage)) {
    return clientMessage;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (apiError?.status === 429 || apiError?.originalStatus === 429 || error?.status === 429) {
    return 'Too many requests. Please wait 1–2 minutes and try again.';
  }

  return 'An error occurred. Please try again.';
}

export function isRateLimitError(error) {
  if (!error) return false;
  if (error.status === 429 || error?.originalStatus === 429) return true;
  const message = String(
    error.data?.message || error.data?.error || error.message || ''
  ).toLowerCase();
  return message.includes('too many requests');
}
