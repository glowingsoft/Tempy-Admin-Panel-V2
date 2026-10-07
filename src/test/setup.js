import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

import { requests, server } from './server';

// ----------------------------------------------------------------------
// Browser APIs jsdom does not implement but MUI / sonner / the screens touch.

if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

class NoopObserver {
  observe() {}

  unobserve() {}

  disconnect() {}

  takeRecords() {
    return [];
  }
}

window.ResizeObserver = window.ResizeObserver || NoopObserver;
window.IntersectionObserver = window.IntersectionObserver || NoopObserver;
window.scrollTo = () => {};
Element.prototype.scrollIntoView = Element.prototype.scrollIntoView || (() => {});
URL.createObjectURL = URL.createObjectURL || (() => 'blob:test');
URL.revokeObjectURL = URL.revokeObjectURL || (() => {});
HTMLCanvasElement.prototype.getContext = () => null;

// RTK Query builds `new Request(url, { signal })` with jsdom's AbortSignal, which Node's
// fetch rejects ("Expected signal to be an instance of AbortSignal"). Tests don't rely on
// aborting requests, so drop the foreign signal.
const NodeRequest = globalThis.Request;
globalThis.Request = class TestRequest extends NodeRequest {
  constructor(input, init) {
    if (init && 'signal' in init) {
      const { signal, ...rest } = init;
      super(input, rest);
    } else {
      super(input, init);
    }
  }
};

// Screens log every API error; keep test output readable.
vi.spyOn(console, 'error').mockImplementation(() => {});
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});

// ----------------------------------------------------------------------
// Mock API. Each test registers the handlers for its case with server.use(...).

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));

afterEach(async () => {
  cleanup();
  server.resetHandlers();
  requests.length = 0;
  window.localStorage.clear();
  window.sessionStorage.clear();

  const { store } = await import('src/store/store');
  const { logout } = await import('src/store/slices/userSlice');
  const { resetRoleApiCaches } = await import('src/store/reset-role-api-caches');
  resetRoleApiCaches(store.dispatch);
  store.dispatch(logout());
});

afterAll(() => server.close());
