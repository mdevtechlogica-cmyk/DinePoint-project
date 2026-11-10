import 'package:flutter_test/flutter_test.dart';
import 'package:host_stand/core/di/injection.dart';
import 'package:host_stand/core/router/app_router.dart';
import 'package:host_stand/core/theme.dart';
import 'package:host_stand/main.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    await sl.reset();
    await configureDependencies();
  });

  tearDown(() async {
    await sl.reset();
  });

  testWidgets('app launches on login screen', (WidgetTester tester) async {
    await tester.pumpWidget(DinePointApp(router: createAppRouter()));
    await tester.pumpAndSettle();

    expect(find.text(AppCopy.appName), findsOneWidget);
    expect(find.text(AppCopy.staffSignIn), findsOneWidget);
    expect(find.text('Sign in'), findsOneWidget);
    expect(find.text('Remember me'), findsOneWidget);
  });
}
