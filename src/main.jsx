import ReactDOM from 'react-dom/client';
import { Suspense, StrictMode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import App from './app';
import { CONFIG } from './config-global';

import { store, persistor } from './store/store';

// ----------------------------------------------------------------------

// Live deploys delete the previous JS chunks. A tab that is already open then
// fails the next client-side navigation and the screen stays blank until a
// manual refresh. Reload once so the browser picks up the new build.
const STALE_BUILD_RELOAD_KEY = 'tempy-stale-build-reload';

function reloadOnceForStaleBuild() {
  try {
    if (window.sessionStorage.getItem(STALE_BUILD_RELOAD_KEY) === '1') return;
    window.sessionStorage.setItem(STALE_BUILD_RELOAD_KEY, '1');
  } catch {
    // sessionStorage can be blocked; still try one reload.
  }
  window.location.reload();
}

window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  reloadOnceForStaleBuild();
});

window.addEventListener('unhandledrejection', (event) => {
  const message = String(event?.reason?.message || event?.reason || '');
  if (
    /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk [\d]+ failed|Loading CSS chunk/i.test(
      message
    )
  ) {
    event.preventDefault();
    reloadOnceForStaleBuild();
  }
});

window.setTimeout(() => {
  try {
    window.sessionStorage.removeItem(STALE_BUILD_RELOAD_KEY);
  } catch {
    // ignore
  }
}, 8000);

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter basename={CONFIG.site.basePath}>
        <Suspense>
          <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
              <App />
            </PersistGate>
          </Provider>
        </Suspense>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>
);
