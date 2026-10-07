import { mapGoogleProfile } from './social-auth-utils';

const GSI_SCRIPT_URL = 'https://accounts.google.com/gsi/client';

let gsiLoadPromise = null;

function loadGoogleIdentityServices() {
  if (window.google?.accounts?.oauth2) {
    return Promise.resolve();
  }

  if (gsiLoadPromise) {
    return gsiLoadPromise;
  }

  gsiLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GSI_SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Google sign-in.')));
      if (window.google?.accounts?.oauth2) {
        resolve();
      }
      return;
    }

    const script = document.createElement('script');
    script.src = GSI_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google sign-in.'));
    document.head.appendChild(script);
  });

  return gsiLoadPromise;
}

/**
 * Opens Google OAuth (web only). Returns normalized profile for /auth/social-auth.
 * Apple login is not used on web — mobile only.
 */
export async function signInWithGoogle({ clientId }) {
  if (!clientId) {
    throw new Error('Google sign-in is not configured. Add VITE_GOOGLE_CLIENT_ID to your .env file.');
  }

  await loadGoogleIdentityServices();

  if (!window.google?.accounts?.oauth2) {
    throw new Error('Google sign-in failed to initialize. Please refresh and try again.');
  }

  return new Promise((resolve, reject) => {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'openid email profile',
      callback: async (tokenResponse) => {
        if (tokenResponse.error) {
          reject(new Error(tokenResponse.error_description || tokenResponse.error));
          return;
        }

        try {
          const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
          });

          if (!response.ok) {
            throw new Error('Unable to fetch Google profile.');
          }

          const userInfo = await response.json();
          resolve(mapGoogleProfile(userInfo));
        } catch (error) {
          reject(error);
        }
      },
      error_callback: (error) => {
        if (error?.type === 'popup_closed') {
          reject(new Error('Google sign-in was cancelled.'));
          return;
        }
        if (error?.type === 'popup_failed_to_open') {
          reject(new Error('Google popup was blocked. Allow popups for this site and try again.'));
          return;
        }
        reject(new Error(error?.message || 'Google sign-in failed.'));
      },
    });

    // Always show account picker so click clearly opens Google UI
    tokenClient.requestAccessToken({ prompt: 'select_account' });
  });
}
