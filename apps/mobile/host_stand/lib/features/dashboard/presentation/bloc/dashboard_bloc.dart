import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:host_stand/core/session_cache.dart';

import '../../domain/entities/booking.dart';
import '../../domain/entities/booking_report.dart';
import '../../domain/entities/dashboard_enums.dart';
import '../../domain/entities/restaurant_profile.dart';
import '../../domain/repositories/dashboard_repository.dart';
import '../../domain/usecases/get_booking_history.dart';
import '../../domain/usecases/get_booking_report.dart';
import '../../domain/usecases/get_restaurant_profile.dart';
import '../../domain/usecases/get_today_bookings.dart';
import 'dashboard_event.dart';
import 'dashboard_state.dart';

/// Presentation ViewModel for the host-stand dashboard (MVVM via BLoC).
class DashboardBloc extends Bloc<DashboardEvent, DashboardState> {
  DashboardBloc({
    required GetTodayBookings getTodayBookings,
    required GetBookingHistory getBookingHistory,
    required GetRestaurantProfile getRestaurantProfile,
    required GetBookingReport getBookingReport,
    required ExportBookingReportCsv exportBookingReportCsv,
    required DashboardRepository dashboardRepository,
    required SessionCache session,
  })  : _getTodayBookings = getTodayBookings,
        _getBookingHistory = getBookingHistory,
        _getRestaurantProfile = getRestaurantProfile,
        _getBookingReport = getBookingReport,
        _exportBookingReportCsv = exportBookingReportCsv,
        _dashboardRepository = dashboardRepository,
        _session = session,
        super(DashboardState(role: _roleFromSession(session))) {
    on<DashboardStarted>(_load);
    on<DashboardReloaded>(_load);
    on<PageChanged>((e, emit) => emit(_copy(page: e.page)));
    on<BookingFilterChanged>((e, emit) => emit(_copy(filter: e.filter)));
    on<RoleChanged>(
      (e, emit) => emit(
        _copy(
          role: e.role,
          preview: e.role == AccountRole.owner
              ? DashboardPreview.moreOwner
              : DashboardPreview.moreStaff,
        ),
      ),
    );
    on<PlanChanged>((e, emit) => emit(_copy(plan: e.plan)));
    on<SearchQueryChanged>((e, emit) => emit(_copy(searchQuery: e.query)));
    on<SearchVisibilityChanged>(
      (e, emit) => emit(
        _copy(
          searchVisible: e.visible,
          searchQuery: e.visible ? state.searchQuery : '',
        ),
      ),
    );
    on<HistoryRangeChanged>(_onHistoryRange);
    on<ReportExportRequested>(_onExport);
    on<ReportExportConsumed>(
      (e, emit) => emit(_copy(clearExport: true)),
    );
    on<PreviewChanged>(_preview);
  }

  final GetTodayBookings _getTodayBookings;
  final GetBookingHistory _getBookingHistory;
  final GetRestaurantProfile _getRestaurantProfile;
  final GetBookingReport _getBookingReport;
  final ExportBookingReportCsv _exportBookingReportCsv;
  final DashboardRepository _dashboardRepository;
  final SessionCache _session;

  static AccountRole _roleFromSession(SessionCache session) {
    final role = session.currentUser?.role.toLowerCase() ?? '';
    if (role.contains('owner') || role.contains('admin')) {
      return AccountRole.owner;
    }
    return AccountRole.staff;
  }

  DashboardState _copy({
    DashboardPage? page,
    DashboardLoadStatus? status,
    List<Booking>? today,
    List<Booking>? history,
    RestaurantProfile? profile,
    BookingFilter? filter,
    DashboardPreview? preview,
    AccountRole? role,
    PlanType? plan,
    String? planName,
    int? reportHistoryDays,
    bool? reportsEnabled,
    bool? exportReports,
    bool? employeesEnabled,
    BookingReport? report,
    bool clearReport = false,
    String? exportCsv,
    bool clearExport = false,
    String? searchQuery,
    bool? searchVisible,
    DateTime? historyStart,
    DateTime? historyEnd,
    String? errorMessage,
    bool clearError = false,
  }) =>
      DashboardState(
        page: page ?? state.page,
        status: status ?? state.status,
        today: today ?? state.today,
        history: history ?? state.history,
        profile: profile ?? state.profile,
        filter: filter ?? state.filter,
        preview: preview ?? state.preview,
        role: role ?? state.role,
        plan: plan ?? state.plan,
        planName: planName ?? state.planName,
        reportHistoryDays: reportHistoryDays ?? state.reportHistoryDays,
        reportsEnabled: reportsEnabled ?? state.reportsEnabled,
        exportReports: exportReports ?? state.exportReports,
        employeesEnabled: employeesEnabled ?? state.employeesEnabled,
        report: clearReport ? null : (report ?? state.report),
        exportCsv: clearExport ? null : (exportCsv ?? state.exportCsv),
        searchQuery: searchQuery ?? state.searchQuery,
        searchVisible: searchVisible ?? state.searchVisible,
        historyStart: historyStart ?? state.historyStart,
        historyEnd: historyEnd ?? state.historyEnd,
        errorMessage: clearError ? null : (errorMessage ?? state.errorMessage),
      );

  Future<void> _load(DashboardEvent event, Emitter<DashboardState> emit) async {
    emit(_copy(status: DashboardLoadStatus.loading, clearError: true));
    try {
      final planContext = await _dashboardRepository.getPlanContext();
      final end = DateTime.now();
      final days =
          planContext.reportHistoryDays < 0 ? 30 : planContext.reportHistoryDays;
      final start = end.subtract(Duration(days: days));
      final results = await Future.wait<dynamic>([
        _getTodayBookings(),
        _getBookingHistory(from: start, to: end),
        _getRestaurantProfile(),
        if (planContext.reportsEnabled)
          _getBookingReport(from: start, to: end)
        else
          Future.value(
            BookingReport(
              from: start,
              to: end,
              totals: BookingReportTotals.empty,
            ),
          ),
      ]);
      emit(
        _copy(
          status: DashboardLoadStatus.success,
          today: results[0] as List<Booking>,
          history: results[1] as List<Booking>,
          profile: results[2] as RestaurantProfile,
          report: results[3] as BookingReport,
          plan: planContext.plan,
          planName: planContext.planName,
          reportHistoryDays: planContext.reportHistoryDays,
          reportsEnabled: planContext.reportsEnabled,
          exportReports: planContext.exportReports,
          employeesEnabled: planContext.employeesEnabled,
          role: _roleFromSession(_session),
          historyStart: start,
          historyEnd: end,
          clearError: true,
          clearExport: true,
        ),
      );
      _session.setEmployeesEnabled(planContext.employeesEnabled);
    } catch (_) {
      emit(
        _copy(
          status: DashboardLoadStatus.failure,
          errorMessage:
              'We couldn’t load your data. Check your connection and retry.',
        ),
      );
    }
  }

  Future<void> _onHistoryRange(
    HistoryRangeChanged e,
    Emitter<DashboardState> emit,
  ) async {
    var start = e.start;
    var end = e.end;
    final earliest = state.earliestHistoryDate;
    if (start.isBefore(earliest)) start = earliest;
    if (end.isBefore(start)) end = start;

    emit(
      _copy(
        historyStart: start,
        historyEnd: end,
        status: DashboardLoadStatus.loading,
        clearError: true,
      ),
    );
    try {
      final results = await Future.wait<dynamic>([
        _getBookingHistory(from: start, to: end),
        if (state.reportsEnabled)
          _getBookingReport(from: start, to: end)
        else
          Future.value(
            BookingReport(
              from: start,
              to: end,
              totals: BookingReportTotals.empty,
            ),
          ),
      ]);
      emit(
        _copy(
          status: DashboardLoadStatus.success,
          history: results[0] as List<Booking>,
          report: results[1] as BookingReport,
          historyStart: start,
          historyEnd: end,
          clearError: true,
        ),
      );
    } catch (_) {
      emit(
        _copy(
          status: DashboardLoadStatus.failure,
          errorMessage: 'Could not load that date range. Please retry.',
        ),
      );
    }
  }

  Future<void> _onExport(
    ReportExportRequested e,
    Emitter<DashboardState> emit,
  ) async {
    if (!state.exportReports) {
      emit(
        _copy(
          errorMessage: 'CSV export is not included in your current plan.',
        ),
      );
      return;
    }
    try {
      final csv = await _exportBookingReportCsv(
        from: state.historyStart,
        to: state.historyEnd,
      );
      emit(_copy(exportCsv: csv, clearError: true));
    } catch (ex) {
      emit(
        _copy(
          errorMessage: ex.toString().replaceFirst('Exception: ', ''),
        ),
      );
    }
  }

  void _preview(PreviewChanged e, Emitter<DashboardState> emit) {
    switch (e.preview) {
      case DashboardPreview.todayMixedPaid:
      case DashboardPreview.todaySeated:
      case DashboardPreview.todayEmpty:
      case DashboardPreview.todayLoading:
      case DashboardPreview.todayError:
      case DashboardPreview.todayFree:
        emit(
          _copy(
            page: DashboardPage.today,
            preview: e.preview,
            filter: e.preview == DashboardPreview.todaySeated
                ? BookingFilter.seated
                : BookingFilter.all,
            status: e.preview == DashboardPreview.todayLoading
                ? DashboardLoadStatus.loading
                : e.preview == DashboardPreview.todayError
                    ? DashboardLoadStatus.failure
                    : DashboardLoadStatus.success,
            today: e.preview == DashboardPreview.todayEmpty
                ? const []
                : state.today,
            plan: e.preview == DashboardPreview.todayFree
                ? PlanType.free
                : PlanType.paid,
            errorMessage: e.preview == DashboardPreview.todayError
                ? 'We couldn’t load today’s bookings. Check your connection and retry.'
                : null,
            clearError: true,
          ),
        );
      case DashboardPreview.historyWeek:
      case DashboardPreview.historyEmpty:
      case DashboardPreview.historyLoading:
      case DashboardPreview.historyFree:
      case DashboardPreview.historyPaid:
        emit(
          _copy(
            page: DashboardPage.history,
            preview: e.preview,
            status: e.preview == DashboardPreview.historyLoading
                ? DashboardLoadStatus.loading
                : DashboardLoadStatus.success,
            history: e.preview == DashboardPreview.historyEmpty
                ? const []
                : state.history,
            plan: e.preview == DashboardPreview.historyFree
                ? PlanType.free
                : PlanType.paid,
          ),
        );
      case DashboardPreview.reportsPaid:
      case DashboardPreview.reportsZeros:
      case DashboardPreview.reportsLoading:
      case DashboardPreview.reportsFree:
      case DashboardPreview.reportsPro:
        emit(
          _copy(
            page: DashboardPage.reports,
            preview: e.preview,
            status: e.preview == DashboardPreview.reportsLoading
                ? DashboardLoadStatus.loading
                : DashboardLoadStatus.success,
            plan: e.preview == DashboardPreview.reportsFree
                ? PlanType.free
                : PlanType.paid,
            report: e.preview == DashboardPreview.reportsZeros
                ? BookingReport(
                    from: state.historyStart,
                    to: state.historyEnd,
                    totals: BookingReportTotals.empty,
                  )
                : state.report,
          ),
        );
      case DashboardPreview.moreOwner:
      case DashboardPreview.moreStaff:
        emit(
          _copy(
            page: DashboardPage.more,
            preview: e.preview,
            role: e.preview == DashboardPreview.moreOwner
                ? AccountRole.owner
                : AccountRole.staff,
          ),
        );
    }
  }
}
