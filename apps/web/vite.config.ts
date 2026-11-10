import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function firebaseMessagingSwPlugin(mode: string): Plugin {
  const env = loadEnv(mode, process.cwd(), '');
  const replacements: Record<string, string> = {
    __FIREBASE_API_KEY__:
      env.VITE_FIREBASE_API_KEY || 'AIzaSyBWgi0owmNLcmlxHQw4RjoT3hnGsc97WZc',
    __FIREBASE_AUTH_DOMAIN__:
      env.VITE_FIREBASE_AUTH_DOMAIN || 'table-reservation-admin.firebaseapp.com',
    __FIREBASE_PROJECT_ID__:
      env.VITE_FIREBASE_PROJECT_ID || 'table-reservation-admin',
    __FIREBASE_STORAGE_BUCKET__:
      env.VITE_FIREBASE_STORAGE_BUCKET ||
      'table-reservation-admin.firebasestorage.app',
    __FIREBASE_MESSAGING_SENDER_ID__:
      env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1098827193162',
    __FIREBASE_APP_ID__:
      env.VITE_FIREBASE_APP_ID || '1:1098827193162:web:d27adb187661c9b04e3fb3',
  };

  const render = () => {
    const template = readFileSync(
      resolve(__dirname, 'scripts/firebase-messaging-sw.template.js'),
      'utf8',
    );
    return Object.entries(replacements).reduce(
      (content, [key, value]) => content.replaceAll(key, value),
      template,
    );
  };

  return {
    name: 'firebase-messaging-sw',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/firebase-messaging-sw.js')) {
          res.setHeader('Content-Type', 'application/javascript');
          res.end(render());
          return;
        }
        next();
      });
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'firebase-messaging-sw.js',
        source: render(),
      });
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), firebaseMessagingSwPlugin(mode)],
  server: {
    port: 5173,
  },
}));
