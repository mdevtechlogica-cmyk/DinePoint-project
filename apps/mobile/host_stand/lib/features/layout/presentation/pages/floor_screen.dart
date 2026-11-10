import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:host_stand/core/plan_limit_ui.dart';
import 'package:host_stand/core/router/app_routes.dart';
import 'package:host_stand/core/theme.dart';
import 'package:host_stand/features/layout/data/models/floor.dart';
import 'package:host_stand/features/layout/data/models/room.dart';
import 'package:host_stand/features/layout/presentation/blocs/layout_bloc.dart';
import 'package:host_stand/features/layout/presentation/blocs/layout_event.dart';
import 'package:host_stand/features/layout/presentation/blocs/layout_state.dart';
import 'package:host_stand/features/layout/presentation/widgets/layout_widgets.dart';

/// Screen 1 of layout: manage floors and rooms together.
/// Tap a room to open screen 2 (tables).
class FloorsScreen extends StatelessWidget {
  const FloorsScreen({super.key});

  @override
  Widget build(BuildContext context) =>
      BlocConsumer<LayoutBloc, LayoutState>(
        listenWhen: (p, c) => p.error != c.error || p.message != c.message,
        listener: (c, s) {
          if (s.error != null) {
            showPlanLimitOrError(c, Exception(s.error));
            return;
          }
          if (s.message != null && c.mounted) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (c.mounted) showLayoutToast(c, s.message!);
            });
          }
        },
        builder: (context, s) {
          if (s.phase == LoadPhase.initial || s.phase == LoadPhase.loading) {
            return const LayoutLoading();
          }
          if (s.data == null) {
            return LayoutFailure(message: s.error ?? 'Could not load layout');
          }

          final data = s.data!;
          final busy = s.phase == LoadPhase.saving;

          return Scaffold(
            backgroundColor: AppColors.background,
            body: SafeArea(
              child: Column(
                children: [
                  const LayoutHeader(title: 'Floors & rooms'),
                  Expanded(
                    child: ListView(
                      padding: const EdgeInsets.all(20),
                      children: [
                        Row(
                          children: [
                            const Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Seating layout',
                                    style: TextStyle(
                                      fontSize: 19,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.ink,
                                    ),
                                  ),
                                  Text(
                                    'Add a floor with a room, then open tables.',
                                    style: TextStyle(
                                      color: AppColors.muted,
                                      fontSize: 13,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            FilledButton.icon(
                              onPressed: busy
                                  ? null
                                  : () async {
                                      final created =
                                          await showFloorWithRoomSheet(
                                        context,
                                      );
                                      if (created == null ||
                                          !context.mounted) {
                                        return;
                                      }
                                      context.read<LayoutBloc>().add(
                                            CreateFloorWithRoomRequested(
                                              floorName: created.floorName,
                                              roomName: created.roomName,
                                            ),
                                          );
                                    },
                              icon: const Icon(Icons.add),
                              label: const Text('Add floor'),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),
                        if (data.floors.isEmpty)
                          _EmptyLayoutCard(
                            onAdd: () async {
                              final created =
                                  await showFloorWithRoomSheet(context);
                              if (created == null || !context.mounted) return;
                              context.read<LayoutBloc>().add(
                                    CreateFloorWithRoomRequested(
                                      floorName: created.floorName,
                                      roomName: created.roomName,
                                    ),
                                  );
                            },
                          )
                        else
                          ...data.floors.map(
                            (f) => Padding(
                              padding: const EdgeInsets.only(bottom: 14),
                              child: _FloorCard(floor: f, busy: busy),
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      );
}

class _EmptyLayoutCard extends StatelessWidget {
  const _EmptyLayoutCard({required this.onAdd});

  final VoidCallback onAdd;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(24),
        decoration: layoutCardDecoration(),
        child: Column(
          children: [
            const Icon(Icons.layers_outlined, size: 42, color: AppColors.muted),
            const SizedBox(height: 10),
            const Text(
              'No floors yet',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: AppColors.ink,
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'Create a floor and its first room to start seating.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.muted),
            ),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: onAdd,
              icon: const Icon(Icons.add),
              label: const Text('Add floor & room'),
            ),
          ],
        ),
      );
}

class _FloorCard extends StatelessWidget {
  const _FloorCard({
    required this.floor,
    required this.busy,
  });

  final FloorModel floor;
  final bool busy;

  @override
  Widget build(BuildContext context) => Container(
        decoration: layoutCardDecoration(),
        padding: const EdgeInsets.all(17),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const CircleAvatar(
                  backgroundColor: AppColors.zoneSoft,
                  child: Icon(
                    Icons.layers_outlined,
                    color: AppColors.deepGreen,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Wrap(
                        spacing: 8,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          Text(
                            floor.name,
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w700,
                              color: AppColors.ink,
                            ),
                          ),
                          LayoutPill(
                            floor.active ? 'Active' : 'Inactive',
                            muted: !floor.active,
                          ),
                        ],
                      ),
                      Text(
                        '${floor.rooms.length} rooms · ${floor.tableCount} tables',
                        style: const TextStyle(color: AppColors.muted),
                      ),
                    ],
                  ),
                ),
                PopupMenuButton<String>(
                  onSelected: (v) async {
                    if (v == 'rename') {
                      final name = await showLayoutNameSheet(
                        context,
                        'Rename floor',
                        'Floor name',
                        initial: floor.name,
                      );
                      if (name == null || !context.mounted) return;
                      context.read<LayoutBloc>().add(
                            RenameFloorRequested(
                              floorId: floor.id,
                              name: name,
                            ),
                          );
                      return;
                    }
                    if (v == 'add-room') {
                      final name = await showLayoutNameSheet(
                        context,
                        'Add room',
                        'Room name',
                      );
                      if (name == null || !context.mounted) return;
                      context.read<LayoutBloc>().add(
                            CreateRoomRequested(
                              name,
                              floorId: floor.id,
                            ),
                          );
                      return;
                    }
                    await confirmLayoutAction(
                      context,
                      'Deactivate ${floor.name}?',
                      'This floor will be hidden from seating.',
                      () => context
                          .read<LayoutBloc>()
                          .add(DeactivateFloor(floor.id)),
                    );
                  },
                  itemBuilder: (_) => const [
                    PopupMenuItem(
                      value: 'add-room',
                      child: Text('Add room'),
                    ),
                    PopupMenuItem(
                      value: 'rename',
                      child: Text('Rename floor'),
                    ),
                    PopupMenuItem(
                      value: 'deactivate',
                      child: Text('Deactivate floor'),
                    ),
                  ],
                ),
              ],
            ),
            const Divider(height: 25),
            if (floor.rooms.isEmpty)
              Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Row(
                  children: [
                    const Expanded(
                      child: Text(
                        'No rooms on this floor yet.',
                        style: TextStyle(color: AppColors.muted),
                      ),
                    ),
                    TextButton(
                      onPressed: busy
                          ? null
                          : () async {
                              final name = await showLayoutNameSheet(
                                context,
                                'Add room',
                                'Room name',
                              );
                              if (name == null || !context.mounted) return;
                              context.read<LayoutBloc>().add(
                                    CreateRoomRequested(
                                      name,
                                      floorId: floor.id,
                                    ),
                                  );
                            },
                      child: const Text('Add room'),
                    ),
                  ],
                ),
              )
            else
              ...floor.rooms.map(
                (r) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: _RoomRow(floor: floor, room: r),
                ),
              ),
            if (floor.rooms.isNotEmpty)
              Align(
                alignment: Alignment.centerLeft,
                child: TextButton.icon(
                  onPressed: busy
                      ? null
                      : () async {
                          final name = await showLayoutNameSheet(
                            context,
                            'Add room',
                            'Room name',
                          );
                          if (name == null || !context.mounted) return;
                          context.read<LayoutBloc>().add(
                                CreateRoomRequested(
                                  name,
                                  floorId: floor.id,
                                ),
                              );
                        },
                  icon: const Icon(Icons.add, size: 18),
                  label: const Text('Add room'),
                ),
              ),
          ],
        ),
      );
}

class _RoomRow extends StatelessWidget {
  const _RoomRow({
    required this.floor,
    required this.room,
  });

  final FloorModel floor;
  final RoomModel room;

  @override
  Widget build(BuildContext context) => Material(
        color: AppColors.zoneSoft,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: () {
            context.read<LayoutBloc>().add(
                  SelectRoom(room.id, floorId: floor.id),
                );
            context.push(AppRoutes.layoutTables);
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            child: Row(
              children: [
                const Icon(
                  Icons.meeting_room_outlined,
                  color: AppColors.deepGreen,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Wrap(
                        spacing: 8,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          Text(
                            room.name,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: AppColors.ink,
                            ),
                          ),
                          LayoutPill(
                            room.active ? 'Active' : 'Inactive',
                            muted: !room.active,
                          ),
                        ],
                      ),
                      Text(
                        '${room.tables.length} tables',
                        style: const TextStyle(
                          color: AppColors.muted,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
                PopupMenuButton<String>(
                  onSelected: (v) async {
                    if (v == 'rename') {
                      final name = await showLayoutNameSheet(
                        context,
                        'Rename room',
                        'Room name',
                        initial: room.name,
                      );
                      if (name == null || !context.mounted) return;
                      context.read<LayoutBloc>().add(
                            RenameRoomRequested(
                              roomId: room.id,
                              name: name,
                              floorId: floor.id,
                            ),
                          );
                      return;
                    }
                    await confirmLayoutAction(
                      context,
                      'Deactivate ${room.name}?',
                      'This room will be hidden from seating.',
                      () => context.read<LayoutBloc>().add(
                            DeactivateRoom(room.id, floorId: floor.id),
                          ),
                    );
                  },
                  itemBuilder: (_) => const [
                    PopupMenuItem(
                      value: 'rename',
                      child: Text('Rename'),
                    ),
                    PopupMenuItem(
                      value: 'deactivate',
                      child: Text('Deactivate'),
                    ),
                  ],
                ),
                const Icon(Icons.chevron_right, color: AppColors.muted),
              ],
            ),
          ),
        ),
      );
}
