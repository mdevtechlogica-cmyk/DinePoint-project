import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:host_stand/core/api_exception.dart';
import 'package:host_stand/features/layout/data/models/layout.dart';
import 'package:host_stand/features/layout/data/models/table_draft.dart';
import 'package:host_stand/features/layout/domain/repositories/layout_repository.dart';
import 'package:host_stand/features/layout/presentation/blocs/layout_event.dart';
import 'package:host_stand/features/layout/presentation/blocs/layout_state.dart';

class LayoutBloc extends Bloc<LayoutEvent, LayoutState> {
  LayoutBloc(this.repo) : super(const LayoutState()) {
    on<LayoutStarted>(_load);
    on<SelectFloor>((e, emit) {
      final f = state.data!.floors.firstWhere((x) => x.id == e.id);
      emit(
        state.copyWith(
          data: LayoutData(
            floors: state.data!.floors,
            selectedFloorId: f.id,
            selectedRoomId: f.rooms.isEmpty ? '' : f.rooms.first.id,
          ),
          page: LayoutPage.rooms,
          preview: PreviewState.owner,
        ),
      );
    });
    on<SelectRoom>(
      (e, emit) => emit(
        state.copyWith(
          data: LayoutData(
            floors: state.data!.floors,
            selectedFloorId: e.floorId ?? state.data!.selectedFloorId,
            selectedRoomId: e.id,
          ),
          page: LayoutPage.tables,
          preview: PreviewState.owner,
        ),
      ),
    );
    on<OpenTableForm>(
      (e, emit) => emit(
        state.copyWith(
          page: LayoutPage.form,
          preview:
              e.table == null ? PreviewState.addEmpty : PreviewState.edit,
          draft: e.table == null
              ? const TableDraft()
              : TableDraft(
                  id: e.table!.id,
                  numberText: '${e.table!.number}',
                  seats: e.table!.seats,
                  ac: e.table!.ac,
                  family: e.table!.family,
                  active: e.table!.active,
                ),
          clearError: true,
        ),
      ),
    );
    on<DraftChanged>(
      (e, emit) => emit(state.copyWith(draft: e.draft, clearError: true)),
    );
    on<SaveTable>(_save);
    on<CreateFloorRequested>(_createFloor);
    on<CreateFloorWithRoomRequested>(_createFloorWithRoom);
    on<RenameFloorRequested>(_renameFloor);
    on<DeactivateFloor>(_deactivateFloor);
    on<CreateRoomRequested>(_createRoom);
    on<RenameRoomRequested>(_renameRoom);
    on<DeactivateRoom>(_deactivateRoom);
  }

  final LayoutRepository repo;

  Future<void> _load(LayoutStarted e, Emitter<LayoutState> emit) async {
    emit(state.copyWith(phase: LoadPhase.loading, clearError: true));
    try {
      emit(
        state.copyWith(
          phase: LoadPhase.ready,
          data: await repo.getLayout(),
          clearError: true,
        ),
      );
    } catch (_) {
      emit(
        state.copyWith(
          phase: LoadPhase.failed,
          error: 'Could not load layout. Please retry.',
        ),
      );
    }
  }

  Future<void> _save(SaveTable e, Emitter<LayoutState> emit) async {
    final d = state.data!;
    emit(
      state.copyWith(
        phase: LoadPhase.saving,
        preview: PreviewState.saving,
        clearError: true,
      ),
    );
    try {
      final updated = await repo.saveTable(
        d.selectedFloorId,
        d.selectedRoomId,
        state.draft,
      );
      emit(
        state.copyWith(
          phase: LoadPhase.ready,
          data: updated,
          page: LayoutPage.tables,
          preview: PreviewState.saved,
          message: 'Table saved successfully.',
          clearError: true,
        ),
      );
    } catch (ex) {
      emit(
        state.copyWith(
          phase: LoadPhase.ready,
          preview: PreviewState.validation,
          error: _err(ex),
        ),
      );
    }
  }

  Future<void> _createFloor(
    CreateFloorRequested e,
    Emitter<LayoutState> emit,
  ) async {
    emit(
      state.copyWith(
        phase: LoadPhase.saving,
        clearError: true,
        clearMessage: true,
      ),
    );
    try {
      emit(
        state.copyWith(
          phase: LoadPhase.ready,
          data: await repo.createFloor(e.name),
          message: 'Floor created.',
          clearError: true,
        ),
      );
    } catch (ex) {
      emit(state.copyWith(phase: LoadPhase.ready, error: _err(ex)));
    }
  }

  Future<void> _createFloorWithRoom(
    CreateFloorWithRoomRequested e,
    Emitter<LayoutState> emit,
  ) async {
    emit(
      state.copyWith(
        phase: LoadPhase.saving,
        clearError: true,
        clearMessage: true,
      ),
    );
    try {
      emit(
        state.copyWith(
          phase: LoadPhase.ready,
          data: await repo.createFloorWithRoom(
            floorName: e.floorName,
            roomName: e.roomName,
          ),
          message: 'Floor and room created.',
          clearError: true,
        ),
      );
    } catch (ex) {
      emit(state.copyWith(phase: LoadPhase.ready, error: _err(ex)));
    }
  }

  Future<void> _renameFloor(
    RenameFloorRequested e,
    Emitter<LayoutState> emit,
  ) async {
    emit(state.copyWith(phase: LoadPhase.saving, clearError: true));
    try {
      emit(
        state.copyWith(
          phase: LoadPhase.ready,
          data: await repo.renameFloor(e.floorId, e.name),
          message: 'Floor renamed.',
          clearError: true,
        ),
      );
    } catch (ex) {
      emit(state.copyWith(phase: LoadPhase.ready, error: _err(ex)));
    }
  }

  Future<void> _deactivateFloor(
    DeactivateFloor e,
    Emitter<LayoutState> emit,
  ) async {
    emit(state.copyWith(phase: LoadPhase.saving));
    try {
      emit(
        state.copyWith(
          phase: LoadPhase.ready,
          data: await repo.deactivateFloor(e.floorId),
          preview: PreviewState.owner,
          message: 'Floor deactivated.',
        ),
      );
    } catch (ex) {
      emit(state.copyWith(phase: LoadPhase.ready, error: _err(ex)));
    }
  }

  Future<void> _createRoom(
    CreateRoomRequested e,
    Emitter<LayoutState> emit,
  ) async {
    final d = state.data!;
    final floorId = e.floorId ?? d.selectedFloorId;
    if (floorId.isEmpty) {
      emit(state.copyWith(phase: LoadPhase.ready, error: 'Select a floor first.'));
      return;
    }
    emit(
      state.copyWith(
        phase: LoadPhase.saving,
        clearError: true,
        clearMessage: true,
      ),
    );
    try {
      emit(
        state.copyWith(
          phase: LoadPhase.ready,
          data: await repo.createRoom(floorId, e.name),
          message: 'Room created.',
          clearError: true,
        ),
      );
    } catch (ex) {
      emit(state.copyWith(phase: LoadPhase.ready, error: _err(ex)));
    }
  }

  Future<void> _renameRoom(
    RenameRoomRequested e,
    Emitter<LayoutState> emit,
  ) async {
    final d = state.data!;
    final floorId = e.floorId ?? d.selectedFloorId;
    emit(state.copyWith(phase: LoadPhase.saving, clearError: true));
    try {
      emit(
        state.copyWith(
          phase: LoadPhase.ready,
          data: await repo.renameRoom(floorId, e.roomId, e.name),
          message: 'Room renamed.',
          clearError: true,
        ),
      );
    } catch (ex) {
      emit(state.copyWith(phase: LoadPhase.ready, error: _err(ex)));
    }
  }

  Future<void> _deactivateRoom(
    DeactivateRoom e,
    Emitter<LayoutState> emit,
  ) async {
    final d = state.data!;
    final floorId = e.floorId ?? d.selectedFloorId;
    emit(state.copyWith(phase: LoadPhase.saving));
    try {
      emit(
        state.copyWith(
          phase: LoadPhase.ready,
          data: await repo.deactivateRoom(floorId, e.roomId),
          preview: PreviewState.owner,
          message: 'Room deactivated.',
        ),
      );
    } catch (ex) {
      emit(state.copyWith(phase: LoadPhase.ready, error: _err(ex)));
    }
  }

  String _err(Object ex) {
    if (ex is ApiException) return ex.message;
    return ex.toString().replaceFirst('Exception: ', '');
  }
}
