import fs from 'fs';
import path from 'path';
import esbuild from 'esbuild';
import checker from 'vite-plugin-checker';
import { loadEnv, defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// ----------------------------------------------------------------------

const PORT = 3030;

const env = loadEnv('all', process.cwd());

// Rollup cannot parse @audio/decode-mp4 (dynamic import). Bundle it with esbuild
// into public/ so the app loads it at runtime and the production build can finish.
function voiceDecoderPlugin() {
  const outfile = path.join(process.cwd(), 'public/decode-voice.js');
  let pending;

  const buildDecoder = () => {
    pending ||= esbuild.build({
      absWorkingDir: process.cwd(),
      entryPoints: ['node_modules/@audio/decode-mp4/decode-mp4.js'],
      bundle: true,
      format: 'esm',
      platform: 'browser',
      outfile,
      logLevel: 'silent',
    });
    return pending;
  };

  return {
    name: 'voice-decoder-bundle',
    async buildStart() {
      await buildDecoder();
    },
    async configureServer() {
      await buildDecoder();
    },
  };
}

export default defineConfig({
  // base: env.VITE_BASE_PATH,
  plugins: [
    voiceDecoderPlugin(),
    react(),
    checker({
      // Commented out the eslint config to disable it
      // eslint: {
      //   lintCommand: 'eslint "./src/**/*.{js,jsx,ts,tsx}"',
      // },
      overlay: {
        position: 'tl',
        initialIsOpen: false,
      },
    }),
  ],
  resolve: {
    alias: [
      {
        find: /^~(.+)/,
        replacement: path.join(process.cwd(), 'node_modules/$1'),
      },
      {
        find: /^src(.+)/,
        replacement: path.join(process.cwd(), 'src/$1'),
      },
      {
        find: /^@mui\/material\/Dialog$/,
        replacement: path.join(process.cwd(), 'src/components/app-dialog.jsx'),
      },
    ],
  },
  server: {
    port: PORT,
    host: true,
    proxy: {
      // Phone voice notes live on S3. The bucket does not send CORS headers, so the
      // browser cannot read the file itself. This path lets the dev server fetch it.
      '/s3-media': {
        target: env.VITE_ASSET_URL || 'https://tempys3-bucket.s3.eu-west-2.amazonaws.com',
        changeOrigin: true,
        rewrite: (requestPath) => requestPath.replace(/^\/s3-media/, ''),
      },
    },
  },
  preview: {
    port: PORT,
    host: true,
    proxy: {
      '/s3-media': {
        target: env.VITE_ASSET_URL || 'https://tempys3-bucket.s3.eu-west-2.amazonaws.com',
        changeOrigin: true,
        rewrite: (requestPath) => requestPath.replace(/^\/s3-media/, ''),
      },
    },
  },
});
