import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:host_stand/core/router/app_routes.dart';
import 'package:host_stand/core/theme.dart';
import 'package:host_stand/features/layout/data/models/layout.dart';
import 'package:host_stand/features/layout/data/models/table.dart';
import 'package:host_stand/features/layout/data/models/table_draft.dart';
import 'package:host_stand/features/layout/presentation/blocs/layout_bloc.dart';
import 'package:host_stand/features/layout/presentation/blocs/layout_event.dart';
import 'package:host_stand/features/layout/presentation/blocs/layout_state.dart';
import 'package:host_stand/features/layout/presentation/widgets/layout_widgets.dart';

class TableFormScreen extends StatefulWidget {
  const TableFormScreen({super.key});

  @override
  State<TableFormScreen> createState() => _TableFormScreenState();
}

class _TableFormScreenState extends State<TableFormScreen> {
  late final TextEditingController number;

  @override
  void initState() {
    super.initState();
    number = TextEditingController(
      text: context.read<LayoutBloc>().state.draft.numberText,
    );
  }

  @override
  void dispose() {
    number.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) =>
      BlocConsumer<LayoutBloc, LayoutState>(
        listener: (c, s) {
          if (s.page == LayoutPage.tables && s.preview == PreviewState.saved) {
            if (c.canPop()) {
              c.pop();
            } else {
              c.go(AppRoutes.layoutTables);
            }
          }
          if (s.message != null) showLayoutToast(c, s.message!);
        },
        builder: (context, s) {
          final f = s.data!.floor;
          final r = s.data!.room;
          final d = s.draft;
          final editing = d.isEdit;
          final loading = s.phase == LoadPhase.saving;

          void change(TableDraft x) =>
              context.read<LayoutBloc>().add(DraftChanged(x));

          if (number.text != d.numberText &&
              number.selection.baseOffset == number.text.length) {
            number.value = TextEditingValue(
              text: d.numberText,
              selection: TextSelection.collapsed(offset: d.numberText.length),
            );
          }

          return Scaffold(
            backgroundColor: AppColors.background,
            body: SafeArea(
              child: Column(
                children: [
                  LayoutHeader(
                    title: editing ? 'Edit table' : 'Add table',
                    subtitle: '${f.name} · ${r.name}',
                  ),
                  Expanded(
                    child: ListView(
                      padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
                      children: [
                        Row(
                          children: [
                            const Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Table details',
                                    style: TextStyle(
                                      fontSize: 22,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.ink,
                                    ),
                                  ),
                                  Text(
                                    'Owner access only',
                                    style: TextStyle(color: AppColors.muted),
                                  ),
                                ],
                              ),
                            ),
                            const LayoutPill('OWNER ONLY'),
                          ],
                        ),
                        const SizedBox(height: 18),
                        Container(
                          padding: const EdgeInsets.all(22),
                          decoration: layoutCardDecoration(),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Row(
                                children: [
                                  Text(
                                    'Table number',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.ink,
                                    ),
                                  ),
                                  Spacer(),
                                  Text(
                                    'Host Display ID',
                                    style: TextStyle(
                                      color: AppColors.muted,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              TextField(
                                controller: number,
                                keyboardType: TextInputType.number,
                                onChanged: (v) =>
                                    change(d.copyWith(numberText: v)),
                                decoration: const InputDecoration(
                                  prefixIcon: Icon(Icons.tag),
                                  hintText: 'e.g. 5',
                                  filled: true,
                                  fillColor: AppColors.white,
                                  border: OutlineInputBorder(
                                    borderRadius:
                                        BorderRadius.all(Radius.circular(15)),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 24),
                              Row(
                                children: [
                                  const Text(
                                    'Seats',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.ink,
                                    ),
                                  ),
                                  const Spacer(),
                                  LayoutPill(
                                    d.seats == 0 ? 'Unset' : '${d.seats} seats',
                                    danger: d.seats == 0,
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              Container(
                                height: 66,
                                decoration: BoxDecoration(
                                  border: Border.all(
                                    color: AppColors.lineSoft,
                                    width: 1.4,
                                  ),
                                  borderRadius: BorderRadius.circular(15),
                                ),
                                child: Row(
                                  children: [
                                    IconButton.filledTonal(
                                      onPressed: d.seats > 0
                                          ? () => change(
                                                d.copyWith(seats: d.seats - 1),
                                              )
                                          : null,
                                      icon: const Icon(Icons.remove),
                                    ),
                                    Expanded(
                                      child: Center(
                                        child: Text(
                                          d.seats == 0 ? 'e.g. 4' : '${d.seats}',
                                          style: const TextStyle(
                                            fontSize: 20,
                                            fontWeight: FontWeight.w700,
                                            color: AppColors.ink,
                                          ),
                                        ),
                                      ),
                                    ),
                                    IconButton.filledTonal(
                                      onPressed: d.seats < 20
                                          ? () => change(
                                                d.copyWith(seats: d.seats + 1),
                                              )
                                          : null,
                                      icon: const Icon(Icons.add),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 22),
                              LayoutSwitchRow(
                                icon: Icons.ac_unit,
                                title: 'AC',
                                subtitle:
                                    'This table is in an air-conditioned area',
                                value: d.ac,
                                onChanged: (v) => change(d.copyWith(ac: v)),
                              ),
                              const Divider(height: 24),
                              LayoutSwitchRow(
                                icon: Icons.family_restroom,
                                title: 'Family',
                                subtitle: 'Suitable for families',
                                value: d.family,
                                onChanged: (v) =>
                                    change(d.copyWith(family: v)),
                              ),
                              const Divider(height: 24),
                              LayoutSwitchRow(
                                icon: Icons.event_seat_outlined,
                                title: 'Active',
                                subtitle:
                                    'Inactive tables are hidden from seating',
                                value: d.active,
                                onChanged: (v) =>
                                    change(d.copyWith(active: v)),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 18),
                        const Row(
                          children: [
                            Icon(Icons.info_outline,
                                color: AppColors.green, size: 20),
                            SizedBox(width: 9),
                            Expanded(
                              child: Text(
                                'Immediate sync with Captain Tablet and Billing Terminal',
                                style: TextStyle(
                                  color: AppColors.muted,
                                  fontSize: 13,
                                ),
                              ),
                            ),
                          ],
                        ),
                        if (s.error != null)
                          Container(
                            margin: const EdgeInsets.only(top: 14),
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: AppColors.dangerSoft,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              s.error!,
                              style: const TextStyle(color: AppColors.danger),
                            ),
                          ),
                        const SizedBox(height: 24),
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton(
                                onPressed: loading
                                    ? null
                                    : () => Navigator.maybePop(context),
                                style: OutlinedButton.styleFrom(
                                  minimumSize: const Size.fromHeight(58),
                                  side: const BorderSide(
                                    color: AppColors.lineSoft,
                                  ),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                ),
                                child: const Text(
                                  'Cancel',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.ink,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: FilledButton(
                                onPressed: loading
                                    ? null
                                    : () => context
                                        .read<LayoutBloc>()
                                        .add(const SaveTable()),
                                style: FilledButton.styleFrom(
                                  backgroundColor: AppColors.green,
                                  minimumSize: const Size.fromHeight(58),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                ),
                                child: loading
                                    ? const SizedBox(
                                        height: 22,
                                        width: 22,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                          color: AppColors.white,
                                        ),
                                      )
                                    : const Text(
                                        'Save',
                                        style: TextStyle(
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                              ),
                            ),
                          ],
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

void openTableForm(BuildContext context, {TableModel? table}) {
  context.read<LayoutBloc>().add(OpenTableForm(table: table));
  context.push(AppRoutes.layoutTableForm);
}
