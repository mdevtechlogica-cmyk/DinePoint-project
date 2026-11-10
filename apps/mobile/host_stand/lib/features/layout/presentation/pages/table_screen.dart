import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:host_stand/core/theme.dart';
import 'package:host_stand/features/layout/presentation/blocs/layout_bloc.dart';
import 'package:host_stand/features/layout/presentation/blocs/layout_state.dart';
import 'package:host_stand/features/layout/presentation/pages/table_form_screen.dart';
import 'package:host_stand/features/layout/presentation/widgets/layout_widgets.dart';

class TablesScreen extends StatelessWidget {
  const TablesScreen({super.key});

  @override
  Widget build(BuildContext context) =>
      BlocConsumer<LayoutBloc, LayoutState>(
        listener: (c, s) {
          final m = s.error ?? s.message;
          if (m != null) showLayoutToast(c, m);
        },
        builder: (context, s) {
          if (s.data == null || s.phase == LoadPhase.loading) {
            return const LayoutLoading();
          }
          final f = s.data!.floor;
          final r = s.data!.room;
          final tables = r.tables;

          return Scaffold(
            backgroundColor: AppColors.background,
            body: SafeArea(
              child: Column(
                children: [
                  LayoutHeader(
                    title: 'Tables',
                    subtitle: '${f.name} · ${r.name}',
                    action: () => openTableForm(context),
                  ),
                  Expanded(
                    child: ListView(
                      padding: const EdgeInsets.all(20),
                      children: [
                        Row(
                          children: [
                            const CircleAvatar(
                              backgroundColor: AppColors.zoneSoft,
                              child: Icon(
                                Icons.meeting_room_outlined,
                                color: AppColors.muted,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '${f.name} · ${r.name}',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w700,
                                      fontSize: 17,
                                      color: AppColors.ink,
                                    ),
                                  ),
                                  const Text(
                                    'Table management & capacity control',
                                    style: TextStyle(
                                      color: AppColors.muted,
                                      fontSize: 13,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            LayoutPill('${tables.length} Tables'),
                          ],
                        ),
                        const SizedBox(height: 18),
                        if (tables.isEmpty)
                          Container(
                            padding: const EdgeInsets.all(24),
                            decoration: layoutCardDecoration(),
                            child: Column(
                              children: [
                                const Icon(
                                  Icons.table_restaurant_outlined,
                                  size: 42,
                                  color: AppColors.muted,
                                ),
                                const SizedBox(height: 10),
                                const Text(
                                  'No tables yet',
                                  style: TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.ink,
                                  ),
                                ),
                                const Text(
                                  'Add a table to start seating guests in this room.',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(color: AppColors.muted),
                                ),
                                TextButton(
                                  onPressed: () => openTableForm(context),
                                  child: const Text('Add table'),
                                ),
                              ],
                            ),
                          ),
                        ...tables.map(
                          (t) => Padding(
                            padding: const EdgeInsets.only(bottom: 13),
                            child: Material(
                              color: AppColors.white,
                              borderRadius: BorderRadius.circular(18),
                              child: InkWell(
                                borderRadius: BorderRadius.circular(18),
                                onTap: () =>
                                    openTableForm(context, table: t),
                                child: Padding(
                                  padding: const EdgeInsets.all(18),
                                  child: Row(
                                    children: [
                                      Container(
                                        width: 54,
                                        height: 54,
                                        alignment: Alignment.center,
                                        decoration: BoxDecoration(
                                          color: AppColors.zoneSoft,
                                          borderRadius:
                                              BorderRadius.circular(13),
                                        ),
                                        child: Text(
                                          '${t.number}',
                                          style: const TextStyle(
                                            fontSize: 21,
                                            fontWeight: FontWeight.w800,
                                            color: AppColors.deepGreen,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 14),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Wrap(
                                              spacing: 8,
                                              crossAxisAlignment:
                                                  WrapCrossAlignment.center,
                                              children: [
                                                Text(
                                                  'Table ${t.number}',
                                                  style: const TextStyle(
                                                    fontSize: 19,
                                                    fontWeight: FontWeight.w700,
                                                    color: AppColors.ink,
                                                  ),
                                                ),
                                                LayoutPill(
                                                  t.active
                                                      ? 'Active'
                                                      : 'Inactive',
                                                  muted: !t.active,
                                                ),
                                              ],
                                            ),
                                            const SizedBox(height: 7),
                                            Wrap(
                                              spacing: 8,
                                              crossAxisAlignment:
                                                  WrapCrossAlignment.center,
                                              children: [
                                                const Icon(
                                                  Icons.people_outline,
                                                  size: 17,
                                                  color: AppColors.muted,
                                                ),
                                                Text(
                                                  '${t.seats} seats',
                                                  style: const TextStyle(
                                                    color: AppColors.muted,
                                                    fontSize: 13,
                                                  ),
                                                ),
                                                if (t.ac)
                                                  const LayoutPill(
                                                    'AC',
                                                    muted: true,
                                                  ),
                                                if (t.family)
                                                  const LayoutPill(
                                                    'Family',
                                                    muted: true,
                                                  ),
                                              ],
                                            ),
                                          ],
                                        ),
                                      ),
                                      const Icon(
                                        Icons.chevron_right,
                                        size: 26,
                                        color: AppColors.muted,
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
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
