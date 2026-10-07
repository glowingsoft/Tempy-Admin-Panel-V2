import path from 'path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';

// Separate from vite.config.js so the dev-only checker plugin and .env files stay out of tests.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^~(.+)/, replacement: path.join(process.cwd(), 'node_modules/$1') },
      { find: /^src(.+)/, replacement: path.join(process.cwd(), 'src/$1') },
    ],
  },
  define: {
    // Every request goes to this fake origin; MSW answers it (see src/test/server.js).
    'import.meta.env.VITE_BASE_URL': JSON.stringify('http://api.test/api/v1'),
    'import.meta.env.VITE_SERVER_URL': JSON.stringify('http://api.test'),
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
    css: false,
    testTimeout: 15000,
  },
});
