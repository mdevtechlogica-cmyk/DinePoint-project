# Firebase / FCM (Host Stand + Web)

Full checklist (Console + API + Web + Host Stand):

→ **[docs/PUSH_SETUP.md](../../../docs/PUSH_SETUP.md)**

## Quick status

| Piece | Status |
|-------|--------|
| Android `google-services.json` | `android/app/google-services.json` |
| Flutter Firebase options | `lib/core/firebase_options.dart` |
| Foreground banners | `flutter_local_notifications` channel `dinepoint_alerts` |
| API service account | `apps/api/secrets/firebase-adminsdk.json` + `.env` |
| iOS `GoogleService-Info.plist` | **Add manually** (see below) |
| Web push | Needs Web app `appId` + VAPID in `apps/web/.env` |

## iOS setup

1. Firebase Console → Project settings → Add app → **iOS**
2. Bundle ID: `com.techlogica.dinepoint`
3. Download **GoogleService-Info.plist** → place at  
   `apps/mobile/host_stand/ios/Runner/GoogleService-Info.plist`
4. Xcode → Runner → Signing & Capabilities → **Push Notifications**  
   and **Background Modes → Remote notifications**
5. Build with iOS Firebase defines (or fill `firebase_options.dart` iOS keys):

```bash
flutter run \
  --dart-define=FIREBASE_IOS_API_KEY=YOUR_IOS_API_KEY \
  --dart-define=FIREBASE_IOS_APP_ID=1:….ios:… \
  --dart-define=FIREBASE_IOS_BUNDLE_ID=com.techlogica.dinepoint
```

Until iOS keys / plist are present, push initializes on Android only.

## Host Stand run

```bash
cd apps/mobile/host_stand
flutter run
```

Sign in → allow notifications → token registers with Nest.  
Foreground messages show a local notification tray banner.
