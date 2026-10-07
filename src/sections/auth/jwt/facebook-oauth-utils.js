import { mapFacebookProfile } from './social-auth-utils';

const FB_SDK_URL = 'https://connect.facebook.net/en_US/sdk.js';

let fbSdkPromise = null;

function loadFacebookSDK(appId) {
  if (window.FB) {
    return Promise.resolve();
  }

  if (fbSdkPromise) {
    return fbSdkPromise;
  }

  fbSdkPromise = new Promise((resolve, reject) => {
    window.fbAsyncInit = () => {
      window.FB.init({
        appId,
        cookie: true,
        xfbml: false,
        version: 'v19.0',
      });
      resolve();
    };

    const script = document.createElement('script');
    script.src = FB_SDK_URL;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error('Failed to load Facebook sign-in.'));
    document.head.appendChild(script);
  });

  return fbSdkPromise;
}

/**
 * Opens Facebook OAuth (web). Returns normalized profile for /auth/social-auth.
 */
export async function signInWithFacebook({ appId }) {
  if (!appId) {
    throw new Error('Facebook sign-in is not configured. Add VITE_FACEBOOK_APP_ID to your .env file.');
  }

  await loadFacebookSDK(appId);

  return new Promise((resolve, reject) => {
    window.FB.login(
      (response) => {
        if (!response.authResponse) {
          reject(new Error('Facebook login was cancelled.'));
          return;
        }

        window.FB.api(
          '/me',
          { fields: 'id,name,email,first_name,last_name,picture.type(large)' },
          (user) => {
            if (!user || user.error) {
              reject(new Error(user?.error?.message || 'Unable to fetch Facebook profile.'));
              return;
            }

            resolve(mapFacebookProfile(user));
          }
        );
      },
      { scope: 'email,public_profile' }
    );
  });
}
