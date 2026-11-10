import 'dashboard_enums.dart';

class DashboardPlanContext {
  const DashboardPlanContext({
    required this.plan,
    required this.reportHistoryDays,
    required this.reportsEnabled,
    required this.exportReports,
    required this.employeesEnabled,
    required this.planName,
  });

  final PlanType plan;
  final int reportHistoryDays;
  final bool reportsEnabled;
  final bool exportReports;
  final bool employeesEnabled;
  final String planName;
}
