import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

/// Firebase options for Host Stand (`com.techlogica.dinepoint`).
///
/// Defaults match `android/app/google-services.json`. Override with dart-defines
/// if you switch Firebase projects.
class DefaultFirebaseOptions {
  static const _apiKey = String.fromEnvironment(
    'FIREBASE_API_KEY',
    defaultValue: 'AIzaSyB_2Cv_Ku_vba5aF3-1E4VLqkrLi6sTlHI',
  );
  static const _appId = String.fromEnvironment(
    'FIREBASE_APP_ID',
    defaultValue: '1:1098827193162:android:ac4ed383c36b769d4e3fb3',
  );
  static const _messagingSenderId = String.fromEnvironment(
    'FIREBASE_MESSAGING_SENDER_ID',
    defaultValue: '1098827193162',
  );
  static const _projectId = String.fromEnvironment(
    'FIREBASE_PROJECT_ID',
    defaultValue: 'table-reservation-admin',
  );
  static const _storageBucket = String.fromEnvironment(
    'FIREBASE_STORAGE_BUCKET',
    defaultValue: 'table-reservation-admin.firebasestorage.app',
  );

  static bool get isConfigured {
    return _apiKey.isNotEmpty &&
        _appId.isNotEmpty &&
        _messagingSenderId.isNotEmpty &&
        _projectId.isNotEmpty;
  }

  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      throw UnsupportedError('Web Firebase is not configured for Host Stand.');
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      default:
        throw UnsupportedError(
          'Firebase is not supported on this platform for Host Stand.',
        );
    }
  }

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: _apiKey,
    appId: _appId,
    messagingSenderId: _messagingSenderId,
    projectId: _projectId,
    storageBucket: _storageBucket,
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: String.fromEnvironment('FIREBASE_IOS_API_KEY', defaultValue: ''),
    appId: String.fromEnvironment('FIREBASE_IOS_APP_ID', defaultValue: ''),
    messagingSenderId: _messagingSenderId,
    projectId: _projectId,
    storageBucket: _storageBucket,
    iosBundleId: String.fromEnvironment(
      'FIREBASE_IOS_BUNDLE_ID',
      defaultValue: 'com.techlogica.dinepoint',
    ),
  );
}
