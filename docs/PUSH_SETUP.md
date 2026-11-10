# DinePoint push notifications setup

Covers **Firebase Console**, **Nest API**, **Host Stand (Android)**, and **Web admin**.

Project in use: `table-reservation-admin`  
Android package: `com.techlogica.dinepoint`

---

## A. Firebase Console

### 1. Android app (Host Stand) — already done if `google-services.json` is present

1. Firebase Console → Project **table-reservation-admin**
2. Project settings → Your apps → Android `com.techlogica.dinepoint`
3. File lives at `apps/mobile/host_stand/android/app/google-services.json`
4. Cloud Messaging API should be enabled (Build → Messaging)

### 2. Add a **Web** app (required for website push)

1. Project settings → Your apps → **Add app** → **Web** (`</>`)
2. Nickname: `DinePoint Web`
3. Copy the **appId** (`1:1098827193162:web:...`)
4. Cloud Messaging → **Web Push certificates** → Generate key pair  
   Copy the **Key pair** (VAPID public key)

### 3. Service account (API) — already wired

- File: `apps/api/secrets/firebase-adminsdk.json` (gitignored)
- Env: `GOOGLE_APPLICATION_CREDENTIALS=./secrets/firebase-adminsdk.json`
- Restart Nest after any change

### 4. Optional test from Console

Engage → Messaging → Create campaign → Firebase Notification messages  
Send a test to a device/browser token (from DB `DeviceToken` after login).

---

## B. Nest API

```bash
cd apps/api
# ensure .env has GOOGLE_APPLICATION_CREDENTIALS
npm run start:dev
```

On startup you should see:  
`Firebase Admin initialized from GOOGLE_APPLICATION_CREDENTIALS`

Endpoints:

- `POST /api/device-tokens` `{ token, platform: ANDROID|IOS|WEB }`
- `DELETE /api/device-tokens` `{ token }`

Reservation walk-in / booking events create in-app notifications **and** FCM push.

---

## C. Host Stand (Flutter)

```bash
cd apps/mobile/host_stand
flutter run
```

What happens:

1. App initializes Firebase from `firebase_options.dart` + `google-services.json`
2. Asks for notification permission
3. After login → registers FCM/FID with `POST /api/device-tokens`
4. Logout → unregisters token

Android channel id: `dinepoint_alerts` (matches Nest FCM payload).

---

## D. Website (`apps/web`)

1. Create `apps/web/.env` from `.env.example`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_FIREBASE_API_KEY=AIzaSyBWgi0owmNLcmlxHQw4RjoT3hnGsc97WZc
VITE_FIREBASE_AUTH_DOMAIN=table-reservation-admin.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=table-reservation-admin
VITE_FIREBASE_STORAGE_BUCKET=table-reservation-admin.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1098827193162
VITE_FIREBASE_APP_ID=1:1098827193162:web:d27adb187661c9b04e3fb3
VITE_FIREBASE_VAPID_KEY=<from Firebase Web Push certificates>
```


2. Run:

```bash
cd apps/web
npm install
npm run dev
```

3. Sign in at `http://localhost:5173` → allow notifications  
4. Confirm a `DeviceToken` row with `platform = WEB`

Without `VITE_FIREBASE_APP_ID` + `VITE_FIREBASE_VAPID_KEY`, web push stays disabled (app still works).

---

## E. End-to-end check

| Step | Expect |
|------|--------|
| Sign in Host Stand | Notification permission; token in DB |
| Sign in Web | Browser permission; token in DB |
| Create walk-in / booking | Push on phone + browser (if permitted) |
| Sign out | Token deactivated |

---

## Troubleshooting

- **API log: Firebase Admin not configured** → check `apps/api/secrets` path and restart API from `apps/api`
- **Web: push not configured** → missing web `appId` / VAPID in `.env`
- **Android no banner while app open** → foreground messages are logged; system tray shows when app is backgrounded
- **401 after login** → JWT expired; Host Stand clears session and returns to login
