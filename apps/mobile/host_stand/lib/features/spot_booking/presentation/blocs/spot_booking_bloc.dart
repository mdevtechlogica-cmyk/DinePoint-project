import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:host_stand/features/spot_booking/data/models/dining_table.dart';
import 'package:host_stand/features/spot_booking/data/models/spot_booking.dart';
import 'package:host_stand/features/spot_booking/data/models/spot_guest.dart';
import 'package:host_stand/features/spot_booking/domain/repositories/spot_booking_repository.dart';
import 'package:host_stand/features/spot_booking/presentation/blocs/spot_booking_event.dart';
import 'package:host_stand/features/spot_booking/presentation/blocs/spot_booking_state.dart';

class SpotBookingBloc extends Bloc<SpotEvent, SpotState> {
  SpotBookingBloc(this.repo) : super(const SpotState()) {
    on<Started>(_load);
    on<PartyChanged>((e, emit) => emit(_copy(
        party: e.value.clamp(1, 12).toInt(),
        selected: null,
        clearValidation: true)));
    on<FloorChanged>((e, emit) => emit(_copy(floor: e.value, selected: null)));
    on<TablePicked>((e, emit) {
      if (e.value.canFit(state.party))
        emit(_copy(selected: e.value, clearValidation: true));
    });
    on<GuestChanged>((e, emit) => emit(_copy(
        name: e.name, phone: e.phone, note: e.note, clearValidation: true)));
    on<GoTable>((e, emit) =>
        emit(_copy(step: SpotStep.chooseTable, status: LoadStatus.ready)));
    on<GoParty>((e, emit) =>
        emit(_copy(step: SpotStep.partySize, status: LoadStatus.ready)));
    on<GoGuest>((e, emit) {
      if (state.canGoGuest)
        emit(_copy(step: SpotStep.guestDetails, status: LoadStatus.ready));
    });
    on<GoBackTable>((e, emit) =>
        emit(_copy(step: SpotStep.chooseTable, status: LoadStatus.ready)));
    on<SeatPressed>(_seat);
    on<CloseFlow>((e, emit) => emit(const SpotState(status: LoadStatus.ready)));
    on<PlanChanged>((e, emit) => emit(_copy(freePlan: e.free)));
    on<UpgradeDismissed>((e, emit) => emit(_copy(showUpgrade: false)));
    on<PreviewChanged>(_preview);
  }
  final SpotBookingRepository repo;
  SpotState _copy(
          {SpotStep? step,
          LoadStatus? status,
          int? party,
          FloorName? floor,
          List<DiningTable>? tables,
          DiningTable? selected,
          bool clearSelected = false,
          String? name,
          String? phone,
          String? note,
          String? validation,
          String? error,
          SpotBooking? booking,
          Preview? preview,
          bool? freePlan,
          bool? showUpgrade,
          bool clearValidation = false,
          bool clearError = false}) =>
      SpotState(
          step: step ?? state.step,
          status: status ?? state.status,
          party: party ?? state.party,
          floor: floor ?? state.floor,
          tables: tables ?? state.tables,
          selected: clearSelected ? null : selected ?? state.selected,
          name: name ?? state.name,
          phone: phone ?? state.phone,
          note: note ?? state.note,
          validation: clearValidation ? null : validation ?? state.validation,
          error: clearError ? null : error ?? state.error,
          booking: booking ?? state.booking,
          preview: preview ?? state.preview,
          freePlan: freePlan ?? state.freePlan,
          showUpgrade: showUpgrade ?? state.showUpgrade);
  Future<void> _load(Started e, Emitter<SpotState> emit) async {
    emit(_copy(status: LoadStatus.loading, clearError: true));
    try {
      emit(_copy(
          tables: await repo.getTables(),
          status: LoadStatus.ready,
          clearError: true));
    } catch (_) {
      emit(_copy(
          status: LoadStatus.failure,
          error: 'We couldn’t load tables. Check your connection and retry.'));
    }
  }

  Future<void> _seat(SeatPressed e, Emitter<SpotState> emit) async {
    if (!state.validGuest) {
      emit(_copy(
          validation:
              'Enter a guest name and a valid 10-digit Indian mobile number.'));
      return;
    }
    final t = state.selected;
    if (t == null || !t.canFit(state.party)) {
      emit(_copy(validation: 'Choose a free table with enough seats.'));
      return;
    }
    emit(_copy(
        status: LoadStatus.seating, clearValidation: true, clearError: true));
    try {
      final b = await repo.seatGuest(
          guest: SpotGuest(
              name: state.name.trim(),
              phone: '+91 ${state.phone.trim()}',
              note: state.note.trim()),
          partySize: state.party,
          table: t);
      emit(_copy(
          step: SpotStep.success,
          status: LoadStatus.ready,
          booking: b,
          tables: await repo.getTables(),
          showUpgrade: true,
          clearError: true));
    } catch (_) {
      emit(_copy(
          status: LoadStatus.ready,
          error:
              'We couldn’t seat this guest. The table may have become busy. Please try again.'));
    }
  }

  void _preview(PreviewChanged e, Emitter<SpotState> emit) {
    final p = e.value;
    switch (p) {
      case Preview.partyDefault:
        emit(_copy(
            step: SpotStep.partySize,
            party: 2,
            status: LoadStatus.ready,
            preview: p));
        break;
      case Preview.partyEight:
        emit(_copy(
            step: SpotStep.partySize,
            party: 8,
            status: LoadStatus.ready,
            preview: p));
        break;
      case Preview.partyDisabled:
        emit(_copy(
            step: SpotStep.partySize,
            party: 0,
            status: LoadStatus.ready,
            preview: p));
        break;
      case Preview.tableDefault:
        emit(_copy(
            step: SpotStep.chooseTable,
            party: 4,
            floor: FloorName.ground,
            status: LoadStatus.ready,
            preview: p));
        break;
      case Preview.tableFour:
        emit(_copy(
            step: SpotStep.chooseTable,
            party: 4,
            floor: FloorName.ground,
            selected: _findTable(state.tables, 't4'),
            status: LoadStatus.ready,
            preview: p));
        break;
      case Preview.tableAllBusy:
        emit(_copy(
            step: SpotStep.chooseTable,
            tables: state.tables
                .map((t) => DiningTable(
                    id: t.id,
                    number: t.number,
                    seats: t.seats,
                    floor: t.floor,
                    room: t.room,
                    availability: TableAvailability.busy,
                    hasAc: t.hasAc,
                    family: t.family,
                    tag: t.tag,
                    busyNote: 'In use'))
                .toList(),
            selected: null,
            status: LoadStatus.ready,
            preview: p));
        break;
      case Preview.tableEmpty:
        emit(_copy(
            step: SpotStep.chooseTable,
            tables: const [],
            selected: null,
            status: LoadStatus.ready,
            preview: p));
        break;
      case Preview.tableLoading:
        emit(_copy(
            step: SpotStep.chooseTable,
            status: LoadStatus.loading,
            preview: p));
        break;
      case Preview.guestEmpty:
        emit(_copy(
            step: SpotStep.guestDetails,
            name: '',
            phone: '',
            note: '',
            status: LoadStatus.ready,
            preview: p,
            clearValidation: true));
        break;
      case Preview.guestFilled:
        emit(_copy(
            step: SpotStep.guestDetails,
            name: 'Deepa Krishnan',
            phone: '9846021034',
            note: 'Birthday',
            status: LoadStatus.ready,
            preview: p,
            clearValidation: true));
        break;
      case Preview.guestValidation:
        emit(_copy(
            step: SpotStep.guestDetails,
            name: 'D',
            phone: '123',
            status: LoadStatus.ready,
            preview: p,
            validation:
                'Enter a valid guest name and 10-digit Indian phone number.'));
        break;
      case Preview.guestSeating:
        emit(_copy(
            step: SpotStep.guestDetails,
            status: LoadStatus.seating,
            name: 'Deepa Krishnan',
            phone: '9846021034',
            preview: p));
        break;
      case Preview.successFree:
      case Preview.successPaid:
        final t = _findTable(state.tables, 't4') ??
            const DiningTable(
                id: 't4',
                number: 4,
                seats: 4,
                floor: FloorName.ground,
                room: 'AC Hall',
                availability: TableAvailability.busy,
                hasAc: true,
                tag: 'WINDOW');
        emit(_copy(
            step: SpotStep.success,
            status: LoadStatus.ready,
            booking: SpotBooking(
                id: 'demo',
                guest: const SpotGuest(
                    name: 'Deepa Krishnan', phone: '+91 98460 21034'),
                partySize: 4,
                table: t,
                seatedAt: DateTime(2026, 10, 26, 19, 30)),
            freePlan: p == Preview.successFree,
            showUpgrade: true,
            preview: p));
        break;
    }
  }
}

DiningTable? _findTable(List<DiningTable> tables, String id) {
  for (final table in tables) {
    if (table.id == id) return table;
  }
  return null;
}
