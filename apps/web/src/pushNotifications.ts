import { deleteToken, getToken, onMessage } from 'firebase/messaging';
import { api } from './api';
import { getFirebaseMessaging, isWebFirebaseConfigured } from './firebase';
import { readSession } from './session';

const tokenKey = 'dinepoint.fcmToken';
let foregroundHooked = false;
let registerInFlight: Promise<string | null> | null = null;

function rememberToken(token: string | null) {
  if (!token) {
    localStorage.removeItem(tokenKey);
    return;
  }
  localStorage.setItem(tokenKey, token);
}

function rememberedToken() {
  return localStorage.getItem(tokenKey);
}

/** Register this browser for FCM and store the token on the API. */
export async function registerWebPush() {
  if (registerInFlight) return registerInFlight;

  registerInFlight = (async () => {
    if (!isWebFirebaseConfigured()) {
      console.info(
        '[push] Web Firebase not configured. Set VITE_FIREBASE_APP_ID and VITE_FIREBASE_VAPID_KEY.',
      );
      return null;
    }
    if (!readSession()?.accessToken) return null;
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return null;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const messaging = await getFirebaseMessaging();
    if (!messaging) return null;

    const registration = await navigator.serviceWorker.register(
      '/firebase-messaging-sw.js',
    );

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY as string;
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (!token) return null;

    await api('/device-tokens', {
      method: 'POST',
      body: JSON.stringify({ token, platform: 'WEB' }),
    });
    rememberToken(token);

    if (!foregroundHooked) {
      foregroundHooked = true;
      onMessage(messaging, (payload) => {
        const title = payload.notification?.title ?? 'DinePoint';
        const body = payload.notification?.body ?? '';
        if (Notification.permission === 'granted') {
          new Notification(title, {
            body,
            icon: '/favicon.svg',
            data: payload.data,
          });
        }
      });
    }

    return token;
  })().finally(() => {
    registerInFlight = null;
  });

  return registerInFlight;
}

/** Remove this browser token from the API and FCM. */
export async function unregisterWebPush() {
  const token = rememberedToken();
  try {
    if (token && readSession()?.accessToken) {
      await api('/device-tokens', {
        method: 'DELETE',
        body: JSON.stringify({ token }),
      });
    }
  } catch (error) {
    console.warn('[push] Failed to unregister device token', error);
  }

  try {
    const messaging = await getFirebaseMessaging();
    if (messaging) await deleteToken(messaging);
  } catch {
    // ignore
  }

  rememberToken(null);
}
