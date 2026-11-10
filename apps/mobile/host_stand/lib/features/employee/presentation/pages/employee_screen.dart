import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:host_stand/features/employee/presentation/blocs/employee_bloc.dart';
import 'package:host_stand/features/employee/presentation/blocs/employee_event.dart';
import 'package:host_stand/features/employee/presentation/blocs/employee_state.dart';
import 'package:host_stand/features/employee/presentation/pages/add_employee_screen.dart';

class EmployeesScreen extends StatefulWidget {
  const EmployeesScreen({super.key});
  @override
  State<EmployeesScreen> createState() => _EmployeesScreenState();
}

class _EmployeesScreenState extends State<EmployeesScreen> {
  final search = TextEditingController();
  @override
  void dispose() {
    search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => BlocConsumer<EmployeeBloc,
          EmployeeState>(
      listenWhen: (a, b) => a.message != b.message,
      listener: (c, s) {
        if (s.message != null)
          ScaffoldMessenger.of(c)
              .showSnackBar(SnackBar(content: Text(s.message!)));
      },
      builder: (context, s) {
        if (s.phase == EmployeePhase.initial ||
            s.phase == EmployeePhase.loading) return const Loading();
        if (s.phase == EmployeePhase.failure && s.items.isEmpty) {
          return EmployeesError(
              message: s.error ?? 'Could not load employees.');
        }
        final list = s.visibleItems;
        return Scaffold(
            backgroundColor: bg,
            body: SafeArea(
                child: Column(children: [
              TopBar(
                  title: 'Employees',
                  addLabel: 'Add',
                  onAdd: () => openForm(context)),
              Expanded(
                  child: ListView(
                      padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
                      children: [
                    Container(
                        decoration: card(),
                        padding: const EdgeInsets.symmetric(horizontal: 17),
                        child: TextField(
                            controller: search,
                            onChanged: (v) => context
                                .read<EmployeeBloc>()
                                .add(SearchChanged(v)),
                            decoration: const InputDecoration(
                                border: InputBorder.none,
                                icon: Icon(Icons.search, size: 30),
                                hintText: 'Search by name, phone or email'))),
                    const SizedBox(height: 22),
                    Wrap(spacing: 12, runSpacing: 10, children: [
                      Filter(
                          'All',
                          s.filter == EmployeeFilter.all,
                          () => context
                              .read<EmployeeBloc>()
                              .add(const FilterChanged(EmployeeFilter.all))),
                      Filter(
                          'Active',
                          s.filter == EmployeeFilter.active,
                          () => context
                              .read<EmployeeBloc>()
                              .add(const FilterChanged(EmployeeFilter.active))),
                      Filter(
                          'Inactive',
                          s.filter == EmployeeFilter.inactive,
                          () => context.read<EmployeeBloc>().add(
                              const FilterChanged(EmployeeFilter.inactive))),
                    ]),
                    const SizedBox(height: 28),
                    if (list.isEmpty) Empty(onAdd: () => openForm(context)),
                    ...list.map((e) => Padding(
                        padding: const EdgeInsets.only(bottom: 14),
                        child: EmployeeCard(
                            employee: e,
                            onTap: () => openForm(context, employee: e)))),
                  ])),
            ])));
      });
}
