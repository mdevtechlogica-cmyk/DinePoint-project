import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:host_stand/core/di/injection.dart';
import 'package:host_stand/core/theme.dart';
import 'package:host_stand/features/layout/data/models/table.dart';
import 'package:host_stand/features/layout/presentation/blocs/layout_bloc.dart';
import 'package:host_stand/features/layout/presentation/blocs/layout_event.dart';

/// Owns [LayoutBloc] for the layout shell so go_router rebuilds do not
/// dispose an [InheritedWidget] that still has dependents (the classic
/// `_dependents.isEmpty` assert when adding floors/rooms).
class LayoutBlocScope extends StatefulWidget {
  const LayoutBlocScope({required this.child, super.key});

  final Widget child;

  @override
  State<LayoutBlocScope> createState() => _LayoutBlocScopeState();
}

class _LayoutBlocScopeState extends State<LayoutBlocScope> {
  late final LayoutBloc _bloc = sl<LayoutBloc>();

  @override
  void dispose() {
    _bloc.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) =>
      BlocProvider<LayoutBloc>.value(value: _bloc, child: widget.child);
}

BoxDecoration layoutCardDecoration() => BoxDecoration(
      color: AppColors.white,
      borderRadius: BorderRadius.circular(AppRadii.card - 1),
      boxShadow: AppShadows.soft,
    );

class LayoutHeader extends StatelessWidget {
  const LayoutHeader({
    required this.title,
    this.subtitle,
    this.action,
    super.key,
  });

  final String title;
  final String? subtitle;
  final VoidCallback? action;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 14),
        child: Row(
          children: [
            IconButton(
              onPressed: () => Navigator.maybePop(context),
              icon: const Icon(Icons.arrow_back, size: 28, color: AppColors.ink),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 23,
                      fontWeight: FontWeight.w700,
                      color: AppColors.ink,
                    ),
                  ),
                  if (subtitle != null)
                    Text(
                      subtitle!,
                      style: const TextStyle(fontSize: 15, color: AppColors.muted),
                    ),
                ],
              ),
            ),
            if (action != null)
              FilledButton.icon(
                onPressed: action,
                icon: const Icon(Icons.add),
                label: Text(title == 'Rooms' ? 'Add room' : 'Add table'),
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.green,
                  minimumSize: const Size(0, 52),
                ),
              ),
            const SizedBox(width: 8),
            const CircleAvatar(
              radius: 22,
              backgroundColor: AppColors.deepGreen,
              child: Icon(Icons.person_outline, color: AppColors.white),
            ),
          ],
        ),
      );
}

class LayoutPill extends StatelessWidget {
  const LayoutPill(
    this.text, {
    this.muted = false,
    this.danger = false,
    super.key,
  });

  final String text;
  final bool muted;
  final bool danger;

  @override
  Widget build(BuildContext context) {
    final background = danger
        ? AppColors.rose
        : muted
            ? AppColors.pale
            : AppColors.mint;
    final foreground = danger
        ? AppColors.danger
        : muted
            ? AppColors.muted
            : AppColors.deepGreen;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 6),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w700,
          color: foreground,
        ),
      ),
    );
  }
}

class LayoutSwitchRow extends StatelessWidget {
  const LayoutSwitchRow({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.value,
    required this.onChanged,
    super.key,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) => Row(
        children: [
          Icon(icon, color: AppColors.green, size: 24),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                    color: AppColors.ink,
                  ),
                ),
                Text(
                  subtitle,
                  style: const TextStyle(fontSize: 13, color: AppColors.muted),
                ),
              ],
            ),
          ),
          Switch(
            value: value,
            activeThumbColor: AppColors.green,
            onChanged: onChanged,
          ),
        ],
      );
}

class LayoutLoading extends StatelessWidget {
  const LayoutLoading({super.key});

  @override
  Widget build(BuildContext context) => const Scaffold(
        backgroundColor: AppColors.background,
        body: Center(child: CircularProgressIndicator(color: AppColors.green)),
      );
}

class LayoutFailure extends StatelessWidget {
  const LayoutFailure({required this.message, super.key});

  final String message;

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: AppColors.background,
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(message, style: const TextStyle(color: AppColors.muted)),
              const SizedBox(height: 12),
              FilledButton(
                onPressed: () =>
                    context.read<LayoutBloc>().add(const LayoutStarted()),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
}

class LayoutErrorCard extends StatelessWidget {
  const LayoutErrorCard({super.key});

  @override
  Widget build(BuildContext context) => const Padding(
        padding: EdgeInsets.only(bottom: 12),
        child: Text(
          'Could not load this section. Retry the request.',
          style: TextStyle(color: AppColors.danger),
        ),
      );
}

class LayoutReadOnlyTable extends StatelessWidget {
  const LayoutReadOnlyTable({required this.table, super.key});

  final TableModel table;

  @override
  Widget build(BuildContext context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Table ${table.number}',
                style: const TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: AppColors.ink,
                ),
              ),
              Text('${table.seats} seats'),
              Text('AC: ${table.ac ? 'Yes' : 'No'}'),
              Text('Family: ${table.family ? 'Yes' : 'No'}'),
              Text('Status: ${table.active ? 'Active' : 'Inactive'}'),
              const SizedBox(height: 12),
              const Text(
                'Staff access is view-only.',
                style: TextStyle(color: AppColors.muted),
              ),
            ],
          ),
        ),
      );
}

void showLayoutToast(BuildContext context, String message) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(message)));
}

Future<void> confirmLayoutAction(
  BuildContext context,
  String title,
  String message,
  VoidCallback onYes,
) async {
  final yes = await showDialog<bool>(
    context: context,
    builder: (c) => AlertDialog(
      title: Text(title),
      content: Text(message),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(c, false),
          child: const Text('Keep active'),
        ),
        FilledButton(
          onPressed: () => Navigator.pop(c, true),
          child: const Text('Deactivate'),
        ),
      ],
    ),
  );
  if (yes == true && context.mounted) onYes();
}

/// Returns the trimmed name, or null if dismissed.
Future<String?> showLayoutNameSheet(
  BuildContext context,
  String title,
  String label, {
  String initial = '',
}) {
  return showModalBottomSheet<String>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (ctx) => _LayoutNameSheet(
      title: title,
      label: label,
      initial: initial,
    ),
  );
}

/// Creates a floor with its first room in one step.
Future<({String floorName, String roomName})?> showFloorWithRoomSheet(
  BuildContext context,
) {
  return showModalBottomSheet<({String floorName, String roomName})>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (ctx) => const _FloorWithRoomSheet(),
  );
}

class _LayoutNameSheet extends StatefulWidget {
  const _LayoutNameSheet({
    required this.title,
    required this.label,
    required this.initial,
  });

  final String title;
  final String label;
  final String initial;

  @override
  State<_LayoutNameSheet> createState() => _LayoutNameSheetState();
}

class _LayoutNameSheetState extends State<_LayoutNameSheet> {
  late final TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.initial);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.viewInsetsOf(context).bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(22, 8, 22, bottom + 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            widget.title,
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w700,
              color: AppColors.ink,
            ),
          ),
          const SizedBox(height: 18),
          TextField(
            controller: _controller,
            autofocus: true,
            textInputAction: TextInputAction.done,
            onSubmitted: (_) => _submit(),
            decoration: InputDecoration(
              labelText: widget.label,
              border: const OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: _submit,
              child: const Text('Save'),
            ),
          ),
        ],
      ),
    );
  }

  void _submit() {
    final value = _controller.text.trim();
    if (value.isEmpty) return;
    Navigator.pop(context, value);
  }
}

class _FloorWithRoomSheet extends StatefulWidget {
  const _FloorWithRoomSheet();

  @override
  State<_FloorWithRoomSheet> createState() => _FloorWithRoomSheetState();
}

class _FloorWithRoomSheetState extends State<_FloorWithRoomSheet> {
  late final TextEditingController _floor;
  late final TextEditingController _room;

  @override
  void initState() {
    super.initState();
    _floor = TextEditingController();
    _room = TextEditingController();
  }

  @override
  void dispose() {
    _floor.dispose();
    _room.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.viewInsetsOf(context).bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(22, 8, 22, bottom + 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Add floor & room',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w700,
              color: AppColors.ink,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Create a floor and its first room together, then add tables next.',
            style: TextStyle(color: AppColors.muted, fontSize: 14),
          ),
          const SizedBox(height: 18),
          TextField(
            controller: _floor,
            autofocus: true,
            textInputAction: TextInputAction.next,
            decoration: const InputDecoration(
              labelText: 'Floor name',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 14),
          TextField(
            controller: _room,
            textInputAction: TextInputAction.done,
            onSubmitted: (_) => _submit(),
            decoration: const InputDecoration(
              labelText: 'Room name',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: _submit,
              child: const Text('Create'),
            ),
          ),
        ],
      ),
    );
  }

  void _submit() {
    final floorName = _floor.text.trim();
    final roomName = _room.text.trim();
    if (floorName.isEmpty || roomName.isEmpty) return;
    Navigator.pop(context, (floorName: floorName, roomName: roomName));
  }
}
