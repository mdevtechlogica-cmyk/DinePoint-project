abstract final class AppRoutes {
  static const login = '/login';
  static const register = '/register';
  static const resetPassword = '/reset-password';
  static const restaurants = '/restaurants';
  static const createRestaurant = '/restaurants/create';
  static const dashboard = '/dashboard';
  static const spotBooking = '/spot-booking';
  static const bookingDetail = '/bookings/:bookingId';
  static const layout = '/layout';
  static const layoutRooms = '/layout/rooms';
  static const layoutTables = '/layout/tables';
  static const layoutTableForm = '/layout/tables/form';
  static const employees = '/employees';
  static const employeesForm = '/employees/form';
  static const notifications = '/notifications';
  static const owner = '/owner';
  static const ownerPlan = '/owner?tab=1';
  static const ownerUpgrade = '/owner?tab=2';
  static const ownerSettings = '/owner?tab=3';

  /// Legacy alias used by older navigation call sites.
  static const today = dashboard;

  static String bookingDetailPath(String bookingId) => '/bookings/$bookingId';

  static String ownerTab(int tab) => '/owner?tab=$tab';
}
