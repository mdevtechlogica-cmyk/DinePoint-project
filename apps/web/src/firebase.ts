import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getMessaging, isSupported, type Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ??
    'AIzaSyBWgi0owmNLcmlxHQw4RjoT3hnGsc97WZc',
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ??
    'table-reservation-admin.firebaseapp.com',
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'table-reservation-admin',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ??
    'table-reservation-admin.firebasestorage.app',
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '1098827193162',
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ??
    '1:1098827193162:web:d27adb187661c9b04e3fb3',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? 'G-4WE51HHWGE',
};

export function isWebFirebaseConfigured() {
  return Boolean(firebaseConfig.appId && import.meta.env.VITE_FIREBASE_VAPID_KEY);
}

let app: FirebaseApp | null = null;
let messagingPromise: Promise<Messaging | null> | null = null;

export function getFirebaseApp() {
  if (!firebaseConfig.appId) return null;
  if (!app) {
    app = initializeApp(firebaseConfig);
  }
  return app;
}

export async function getFirebaseMessaging() {
  if (!isWebFirebaseConfigured()) return null;
  if (!messagingPromise) {
    messagingPromise = (async () => {
      const supported = await isSupported();
      if (!supported) return null;
      const firebaseApp = getFirebaseApp();
      if (!firebaseApp) return null;
      return getMessaging(firebaseApp);
    })();
  }
  return messagingPromise;
}

export function getFirebaseWebConfig() {
  return firebaseConfig;
}
