import 'package:equatable/equatable.dart';

import '../../domain/entities/dashboard_enums.dart';

sealed class DashboardEvent extends Equatable {
  const DashboardEvent();

  @override
  List<Object?> get props => [];
}

class DashboardStarted extends DashboardEvent {
  const DashboardStarted();
}

class DashboardReloaded extends DashboardEvent {
  const DashboardReloaded();
}

class PageChanged extends DashboardEvent {
  const PageChanged(this.page);

  final DashboardPage page;

  @override
  List<Object?> get props => [page];
}

class BookingFilterChanged extends DashboardEvent {
  const BookingFilterChanged(this.filter);

  final BookingFilter filter;

  @override
  List<Object?> get props => [filter];
}

class PreviewChanged extends DashboardEvent {
  const PreviewChanged(this.preview);

  final DashboardPreview preview;

  @override
  List<Object?> get props => [preview];
}

class RoleChanged extends DashboardEvent {
  const RoleChanged(this.role);

  final AccountRole role;

  @override
  List<Object?> get props => [role];
}

class PlanChanged extends DashboardEvent {
  const PlanChanged(this.plan);

  final PlanType plan;

  @override
  List<Object?> get props => [plan];
}

class SearchQueryChanged extends DashboardEvent {
  const SearchQueryChanged(this.query);

  final String query;

  @override
  List<Object?> get props => [query];
}

class SearchVisibilityChanged extends DashboardEvent {
  const SearchVisibilityChanged(this.visible);

  final bool visible;

  @override
  List<Object?> get props => [visible];
}

class HistoryRangeChanged extends DashboardEvent {
  const HistoryRangeChanged({required this.start, required this.end});

  final DateTime start;
  final DateTime end;

  @override
  List<Object?> get props => [start, end];
}

class ReportExportRequested extends DashboardEvent {
  const ReportExportRequested();
}

class ReportExportConsumed extends DashboardEvent {
  const ReportExportConsumed();
}
