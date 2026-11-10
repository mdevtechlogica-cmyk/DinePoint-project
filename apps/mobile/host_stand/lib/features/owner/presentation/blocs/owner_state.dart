import 'package:equatable/equatable.dart';
import 'package:host_stand/features/owner/data/models/owner_settings_data.dart';

enum OwnerStatus { initial, loading, loaded, saving, success, failure }

class OwnerState extends Equatable {
  final OwnerStatus status;
  final OwnerSettingsData? data;
  final String? error;
  final bool editing, showSignOutConfirm, signedOut;
  final int? openFaqIndex;
  const OwnerState(
      {this.status = OwnerStatus.initial,
      this.data,
      this.error,
      this.editing = false,
      this.showSignOutConfirm = false,
      this.signedOut = false,
      this.openFaqIndex});
  OwnerState copyWith(
          {OwnerStatus? status,
          OwnerSettingsData? data,
          String? error,
          bool? editing,
          bool? showSignOutConfirm,
          bool? signedOut,
          int? openFaqIndex,
          bool clearOpenFaq = false}) =>
      OwnerState(
          status: status ?? this.status,
          data: data ?? this.data,
          error: error,
          editing: editing ?? this.editing,
          showSignOutConfirm: showSignOutConfirm ?? this.showSignOutConfirm,
          signedOut: signedOut ?? this.signedOut,
          openFaqIndex:
              clearOpenFaq ? null : (openFaqIndex ?? this.openFaqIndex));
  @override
  List<Object?> get props => [
        status,
        data,
        error,
        editing,
        showSignOutConfirm,
        signedOut,
        openFaqIndex
      ];
}
