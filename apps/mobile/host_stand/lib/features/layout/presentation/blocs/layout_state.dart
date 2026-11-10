import 'package:equatable/equatable.dart';
import 'package:host_stand/features/layout/data/models/layout.dart';
import 'package:host_stand/features/layout/data/models/table_draft.dart';

enum LoadPhase { initial, loading, ready, saving, failed }

class LayoutState extends Equatable {
  const LayoutState(
      {this.phase = LoadPhase.initial,
      this.data,
      this.page = LayoutPage.floors,
      this.preview = PreviewState.owner,
      this.draft = const TableDraft(),
      this.error,
      this.message});
  final LoadPhase phase;
  final LayoutData? data;
  final LayoutPage page;
  final PreviewState preview;
  final TableDraft draft;
  final String? error, message;
  LayoutState copyWith(
          {LoadPhase? phase,
          LayoutData? data,
          LayoutPage? page,
          PreviewState? preview,
          TableDraft? draft,
          String? error,
          String? message,
          bool clearError = false,
          bool clearMessage = false}) =>
      LayoutState(
          phase: phase ?? this.phase,
          data: data ?? this.data,
          page: page ?? this.page,
          preview: preview ?? this.preview,
          draft: draft ?? this.draft,
          error: clearError ? null : error ?? this.error,
          message: clearMessage ? null : message ?? this.message);
  @override
  List<Object?> get props =>
      [phase, data, page, preview, draft, error, message];
}
