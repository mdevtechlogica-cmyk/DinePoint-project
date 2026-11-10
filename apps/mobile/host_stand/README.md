# Host Stand (Flutter)

Reception / floor tablet app for DinePoint: today’s bookings, walk-ins, layout, staff, reports, and owner plan limits.

Package: `com.techlogica.dinepoint`

## Prerequisites

- Flutter 3.24+ / Dart 3.5+
- Nest API running (`apps/api`, default `http://10.0.2.2:3000/api` from Android emulator)
- Applied Prisma migrations (`pnpm db:migrate` from repo root)

## Run

```bash
cd apps/mobile/host_stand
flutter pub get
flutter run
```

Override API base URL:

```bash
flutter run --dart-define=API_BASE_URL=http://192.168.x.x:3000/api
```

### Physical Android device (USB)

```bash
# Terminal 1 — Nest API
cd apps/api
npm run start:dev

# Terminal 2 — phone reaches PC via USB
adb reverse tcp:3000 tcp:3000
cd apps/mobile/host_stand
flutter run -d <device-id> --dart-define=API_BASE_URL=http://127.0.0.1:3000/api
```

Close heavy apps first if Gradle fails (low RAM). Keep USB connected while testing.

### API debug logs

In **debug** builds, every Host Stand HTTP call is printed with the `ApiClient` tag (method, URL, status, timing, redacted body). Watch:

- Android Studio / VS Code **Run / Debug Console**
- Or: `adb logcat | findstr ApiClient`

Passwords and tokens are redacted as `***`.

## Features wired to Nest

- Auth: login, register, remember me, refresh token, forgot/reset password
- Restaurants, floors / rooms / tables, employees (plan-gated)
- Today / history / reports, spot booking, booking detail
- Opening hours (Settings)
- Plan entitlements + SMS/WhatsApp quota (Twilio if configured, else device share)
- Android FCM push (+ foreground local notification banners)

## Firebase

See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) and [docs/PUSH_SETUP.md](../../../docs/PUSH_SETUP.md).

### iOS (required for iOS push)

1. Firebase Console → add iOS app with bundle `com.techlogica.dinepoint`
2. Download `GoogleService-Info.plist` → `ios/Runner/GoogleService-Info.plist`
3. Pass keys when building, or fill `lib/core/firebase_options.dart` iOS defaults:

```bash
flutter run \
  --dart-define=FIREBASE_IOS_API_KEY=... \
  --dart-define=FIREBASE_IOS_APP_ID=... \
  --dart-define=FIREBASE_IOS_BUNDLE_ID=com.techlogica.dinepoint
```

4. Enable Push Notifications + Background Modes (Remote notifications) in Xcode

## Password reset deep link

Android intent: `dinepoint://reset-password?token=...`  
In-app route: `/reset-password?token=...`

Configure API `PASSWORD_RESET_APP_URL` and optional SMTP in `.env` (see repo `.env.example`).

## Optional Nest providers

| Env | Purpose |
|-----|---------|
| `SMTP_*` | Email password-reset links |
| `TWILIO_*` | Server-side SMS / WhatsApp instead of device share |
| `EXPOSE_PASSWORD_RESET_TOKEN=true` | Dev-only: return token in API JSON |
