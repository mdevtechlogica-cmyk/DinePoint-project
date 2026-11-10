import 'package:flutter/foundation.dart';

/// Notifies [GoRouter] when login/logout changes so redirects re-run.
class SessionAuthNotifier extends ChangeNotifier {
  void refresh() => notifyListeners();
}
