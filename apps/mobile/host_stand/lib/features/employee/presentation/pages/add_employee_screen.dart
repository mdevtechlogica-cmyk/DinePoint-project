import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:host_stand/core/router/app_routes.dart';
import 'package:host_stand/core/theme.dart';
import 'package:host_stand/features/employee/data/models/employee.dart';
import 'package:host_stand/features/employee/data/models/employee_draft.dart';
import 'package:host_stand/features/employee/presentation/blocs/employee_bloc.dart';
import 'package:host_stand/features/employee/presentation/blocs/employee_event.dart';
import 'package:host_stand/features/employee/presentation/blocs/employee_state.dart';

const bg = AppColors.background;
const ink = AppColors.ink;
const muted = AppColors.muted;
const green = AppColors.green;
const pale = AppColors.pale;
const danger = AppColors.danger;

BoxDecoration card() => BoxDecoration(
      color: AppColors.white,
      borderRadius: BorderRadius.circular(AppRadii.card),
      boxShadow: AppShadows.soft,
    );

class EmployeeFormScreen extends StatefulWidget {
  const EmployeeFormScreen({super.key});
  @override
  State<EmployeeFormScreen> createState() => _EmployeeFormScreenState();
}

class _EmployeeFormScreenState extends State<EmployeeFormScreen> {
  late final TextEditingController name, email, phone, password;
  bool obscure = true;
  @override
  void initState() {
    super.initState();
    final d = context.read<EmployeeBloc>().state.draft;
    name = TextEditingController(text: d.name);
    email = TextEditingController(text: d.email);
    phone = TextEditingController(text: d.phone);
    password = TextEditingController(text: d.password);
  }

  @override
  void dispose() {
    name.dispose();
    email.dispose();
    phone.dispose();
    password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => BlocConsumer<EmployeeBloc,
          EmployeeState>(
      listenWhen: (a, b) =>
          a.page != b.page || a.message != b.message || a.draft != b.draft,
      listener: (c, s) {
        if (name.text != s.draft.name)
          name.value = TextEditingValue(
              text: s.draft.name,
              selection: TextSelection.collapsed(offset: s.draft.name.length));
        if (email.text != s.draft.email)
          email.value = TextEditingValue(
              text: s.draft.email,
              selection: TextSelection.collapsed(offset: s.draft.email.length));
        if (phone.text != s.draft.phone)
          phone.value = TextEditingValue(
              text: s.draft.phone,
              selection: TextSelection.collapsed(offset: s.draft.phone.length));
        if (password.text != s.draft.password)
          password.value = TextEditingValue(
              text: s.draft.password,
              selection:
                  TextSelection.collapsed(offset: s.draft.password.length));
        if (s.page == EmployeePage.list && s.preview == EmployeePreview.saved) {
          if (c.canPop()) c.pop();
        }
        if (s.message != null)
          ScaffoldMessenger.of(c)
              .showSnackBar(SnackBar(content: Text(s.message!)));
      },
      builder: (context, s) {
        final d = s.draft;
        final edit = d.isEdit;
        final saving = s.phase == EmployeePhase.saving;
        void update(EmployeeDraft value) =>
            context.read<EmployeeBloc>().add(DraftChanged(value));
        return Scaffold(
            backgroundColor: bg,
            body: SafeArea(
                child: Column(children: [
              SimpleTopBar(title: edit ? 'Edit Employee' : 'Add Employee'),
              Expanded(
                  child: ListView(
                      padding: const EdgeInsets.fromLTRB(22, 26, 22, 28),
                      children: [
                    Row(children: [
                      const Icon(Icons.arrow_back, size: 27),
                      const SizedBox(width: 18),
                      Expanded(
                          child: Text(edit ? 'Edit employee' : 'Add employee',
                              style: const TextStyle(
                                  fontSize: 23, fontWeight: FontWeight.w700))),
                      const RoleBadge('Admin/Owner')
                    ]),
                    const SizedBox(height: 24),
                    Container(
                        decoration: card(),
                        padding: const EdgeInsets.fromLTRB(22, 26, 22, 24),
                        child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Label('Name', required: true),
                              const SizedBox(height: 10),
                              Input(
                                  controller: name,
                                  hint: 'Full name',
                                  onChanged: (v) =>
                                      update(d.copyWith(name: v))),
                              const SizedBox(height: 28),
                              const Label('Email', required: true),
                              const SizedBox(height: 10),
                              Input(
                                  controller: email,
                                  hint: 'name@restaurant.com',
                                  keyboard: TextInputType.emailAddress,
                                  onChanged: (v) =>
                                      update(d.copyWith(email: v))),
                              const SizedBox(height: 28),
                              Row(children: [
                                const Expanded(child: Label('Phone')),
                                Text('SMS shift updates',
                                    style:
                                        TextStyle(color: muted, fontSize: 13))
                              ]),
                              const SizedBox(height: 10),
                              Input(
                                  controller: phone,
                                  hint: '+91 98XXX XXXXX',
                                  keyboard: TextInputType.phone,
                                  onChanged: (v) =>
                                      update(d.copyWith(phone: v))),
                              const SizedBox(height: 28),
                              const Label('Role'),
                              const SizedBox(height: 10),
                              Container(
                                  padding: const EdgeInsets.all(5),
                                  decoration: BoxDecoration(
                                      color: pale,
                                      borderRadius: BorderRadius.circular(17)),
                                  child: Row(children: [
                                    for (final role in [
                                      EmployeeRole.admin,
                                      EmployeeRole.manager,
                                      EmployeeRole.staff
                                    ])
                                      Expanded(
                                          child: GestureDetector(
                                              onTap: () => update(
                                                  d.copyWith(role: role)),
                                              child: AnimatedContainer(
                                                  duration: const Duration(
                                                      milliseconds: 130),
                                                  padding:
                                                      const EdgeInsets.symmetric(
                                                          vertical: 18),
                                                  decoration: BoxDecoration(
                                                      color: d.role == role
                                                          ? green
                                                          : Colors.transparent,
                                                      borderRadius:
                                                          BorderRadius.circular(
                                                              12),
                                                      border: d.role == role
                                                          ? Border.all(
                                                              color: const Color(0xFF003C29))
                                                          : null),
                                                  child: Center(child: Text(role.label, style: TextStyle(fontWeight: FontWeight.w700, color: d.role == role ? Colors.white : muted, fontSize: 13)))))),
                                  ])),
                              const SizedBox(height: 12),
                              Text(roleDescription(d.role),
                                  style: const TextStyle(
                                      color: muted, fontSize: 13, height: 1.4)),
                              if (!edit) ...[
                                const SizedBox(height: 28),
                                const Label('Password'),
                                const SizedBox(height: 10),
                                TextField(
                                    controller: password,
                                    obscureText: obscure,
                                    onChanged: (v) =>
                                        update(d.copyWith(password: v)),
                                    decoration: InputDecoration(
                                        hintText: 'At least 8 characters',
                                        filled: true,
                                        fillColor: Colors.white,
                                        suffixIcon: IconButton(
                                            onPressed: () => setState(
                                                () => obscure = !obscure),
                                            icon: Icon(obscure
                                                ? Icons.visibility_outlined
                                                : Icons
                                                    .visibility_off_outlined)),
                                        border: OutlineInputBorder(
                                            borderRadius:
                                                BorderRadius.circular(18),
                                            borderSide: BorderSide.none),
                                        enabledBorder: OutlineInputBorder(
                                            borderRadius:
                                                BorderRadius.circular(18),
                                            borderSide: BorderSide.none))),
                              ],
                              const SizedBox(height: 30),
                              Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 18, vertical: 15),
                                  decoration: BoxDecoration(
                                      color: pale,
                                      borderRadius: BorderRadius.circular(18)),
                                  child: Row(children: [
                                    const Expanded(
                                        child: Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                          Text('Active',
                                              style: TextStyle(
                                                  fontSize: 17,
                                                  fontWeight: FontWeight.w700)),
                                          SizedBox(height: 3),
                                          Text(
                                              "Inactive employees can't sign in",
                                              style: TextStyle(
                                                  color: muted, fontSize: 13))
                                        ])),
                                    Switch(
                                        value: d.active,
                                        activeThumbColor: green,
                                        onChanged: (v) =>
                                            update(d.copyWith(active: v))),
                                  ])),
                            ])),
                    if (s.error != null)
                      Container(
                          margin: const EdgeInsets.only(top: 14),
                          padding: const EdgeInsets.all(13),
                          decoration: BoxDecoration(
                              color: const Color(0xFFFBE4E2),
                              borderRadius: BorderRadius.circular(12)),
                          child: Text(s.error!,
                              style: const TextStyle(color: danger))),
                    const SizedBox(height: 24),
                    SizedBox(
                        width: double.infinity,
                        child: FilledButton(
                            onPressed: saving
                                ? null
                                : () => context
                                    .read<EmployeeBloc>()
                                    .add(const EmployeeSaveRequested()),
                            style: FilledButton.styleFrom(
                                backgroundColor: green,
                                minimumSize: const Size.fromHeight(62),
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(18))),
                            child: saving
                                ? const SizedBox(
                                    width: 23,
                                    height: 23,
                                    child: CircularProgressIndicator(
                                        color: Colors.white, strokeWidth: 2))
                                : Text(edit ? 'Save changes' : 'Save',
                                    style: const TextStyle(
                                        fontSize: 18,
                                        fontWeight: FontWeight.w700)))),
                    const SizedBox(height: 18),
                    const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.verified_user_outlined,
                              size: 18, color: muted),
                          SizedBox(width: 8),
                          Text('Access logged by Host Stand Security',
                              style: TextStyle(color: muted, fontSize: 13))
                        ]),
                  ])),
            ])));
      });
}

class TopBar extends StatelessWidget {
  const TopBar({required this.title, this.addLabel, this.onAdd});
  final String title;
  final String? addLabel;
  final VoidCallback? onAdd;
  @override
  Widget build(BuildContext context) => Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 15),
      child: Row(children: [
        IconButton(
            onPressed: () => context.canPop() ? context.pop() : null,
            icon: const Icon(Icons.arrow_back, size: 30)),
        const SizedBox(width: 8),
        Expanded(
            child: Text(title,
                style: const TextStyle(
                    fontSize: 29, fontWeight: FontWeight.w700, color: ink))),
        if (onAdd != null)
          FilledButton.icon(
              onPressed: onAdd,
              icon: const Icon(Icons.add, size: 24),
              label: Text(addLabel ?? 'Add'),
              style: FilledButton.styleFrom(
                  backgroundColor: green,
                  minimumSize: const Size(0, 55),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14)))),
        const SizedBox(width: 10),
        const Avatar(),
      ]));
}

class SimpleTopBar extends StatelessWidget {
  const SimpleTopBar({required this.title});
  final String title;
  @override
  Widget build(BuildContext context) => Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 15),
      child: Row(children: [
        IconButton(
            onPressed: () => context.canPop() ? context.pop() : null,
            icon: const Icon(Icons.arrow_back, size: 28)),
        const SizedBox(width: 8),
        Expanded(
            child: Text(title,
                style: const TextStyle(
                    fontSize: 25, fontWeight: FontWeight.w700))),
        const Avatar()
      ]));
}

class Avatar extends StatelessWidget {
  const Avatar();
  @override
  Widget build(BuildContext context) => const CircleAvatar(
      radius: 22,
      backgroundColor: green,
      child: Icon(Icons.person_outline, color: Colors.white, size: 27));
}

class EmployeeCard extends StatelessWidget {
  const EmployeeCard({required this.employee, required this.onTap});
  final EmployeeModel employee;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => Opacity(
      opacity: employee.active ? 1 : .56,
      child: Material(
          color: Colors.white,
          borderRadius: BorderRadius.circular(25),
          child: InkWell(
              onTap: onTap,
              borderRadius: BorderRadius.circular(25),
              child: Padding(
                  padding: const EdgeInsets.fromLTRB(22, 24, 20, 24),
                  child: Row(children: [
                    Expanded(
                        child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                          Wrap(
                              spacing: 10,
                              runSpacing: 6,
                              crossAxisAlignment: WrapCrossAlignment.center,
                              children: [
                                Text(employee.name,
                                    style: const TextStyle(
                                        fontSize: 20,
                                        fontWeight: FontWeight.w700,
                                        color: ink)),
                                Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 12, vertical: 6),
                                    decoration: BoxDecoration(
                                        color: pale,
                                        borderRadius:
                                            BorderRadius.circular(10)),
                                    child: Text(employee.role.label,
                                        style: const TextStyle(
                                            fontSize: 13, color: muted)))
                              ]),
                          const SizedBox(height: 13),
                          Text(employee.phone,
                              style:
                                  const TextStyle(fontSize: 16, color: muted)),
                          const SizedBox(height: 4),
                          Text(employee.email,
                              style:
                                  const TextStyle(fontSize: 14, color: muted)),
                        ])),
                    const SizedBox(width: 8),
                    Column(mainAxisSize: MainAxisSize.min, children: [
                      Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 7),
                          decoration: BoxDecoration(
                              color: employee.active
                                  ? const Color(0xFFE4ECE7)
                                  : const Color(0xFFE5EAE5),
                              borderRadius: BorderRadius.circular(24)),
                          child: Text(employee.active ? 'Active' : 'Inactive',
                              style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: employee.active ? green : muted))),
                      const SizedBox(height: 8),
                      const Icon(Icons.chevron_right,
                          color: Color(0xFFC1CBC1), size: 27)
                    ]),
                  ])))));
}

class Filter extends StatelessWidget {
  const Filter(this.label, this.active, this.onTap);
  final String label;
  final bool active;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(22),
      child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 25, vertical: 17),
          decoration: BoxDecoration(
              color: active ? green : Colors.white,
              borderRadius: BorderRadius.circular(22),
              boxShadow: [
                if (!active)
                  BoxShadow(
                      color: Colors.black.withValues(alpha: .025),
                      blurRadius: 5,
                      offset: const Offset(0, 2))
              ]),
          child: Text(label,
              style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w600,
                  color: active ? Colors.white : ink))));
}

class Label extends StatelessWidget {
  const Label(this.text, {this.required = false});
  final String text;
  final bool required;
  @override
  Widget build(BuildContext context) => RichText(
          text: TextSpan(
              style: const TextStyle(
                  fontSize: 15, color: ink, fontWeight: FontWeight.w600),
              children: [
            TextSpan(text: text),
            if (required)
              const TextSpan(text: ' *', style: TextStyle(color: danger))
          ]));
}

class Input extends StatelessWidget {
  const Input(
      {required this.controller,
      required this.hint,
      required this.onChanged,
      this.keyboard});
  final TextEditingController controller;
  final String hint;
  final ValueChanged<String> onChanged;
  final TextInputType? keyboard;
  @override
  Widget build(BuildContext context) => TextField(
      controller: controller,
      keyboardType: keyboard,
      onChanged: onChanged,
      decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(color: muted),
          filled: true,
          fillColor: Colors.white,
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 19, vertical: 21),
          border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(19),
              borderSide: BorderSide.none),
          enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(19),
              borderSide: BorderSide.none),
          focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(19),
              borderSide: const BorderSide(color: green, width: 1.5))));
}

class RoleBadge extends StatelessWidget {
  const RoleBadge(this.text);
  final String text;
  @override
  Widget build(BuildContext context) => Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
      decoration: BoxDecoration(
          color: const Color(0xFFE2E8E2),
          borderRadius: BorderRadius.circular(25)),
      child: Row(children: [
        const Icon(Icons.circle, color: green, size: 9),
        const SizedBox(width: 7),
        Text(text, style: const TextStyle(fontSize: 12, color: muted))
      ]));
}

class Empty extends StatelessWidget {
  const Empty({this.onAdd});
  final VoidCallback? onAdd;
  @override
  Widget build(BuildContext context) => Container(
      padding: const EdgeInsets.all(28),
      decoration: card(),
      child: Column(children: [
        const Icon(Icons.person_search_outlined, size: 48, color: muted),
        const SizedBox(height: 12),
        const Text('No employees found',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
        const SizedBox(height: 6),
        const Text('Try another search or filter.',
            style: TextStyle(color: muted)),
        if (onAdd != null) ...[
          const SizedBox(height: 14),
          FilledButton(onPressed: onAdd, child: const Text('Add employee'))
        ]
      ]));
}

class ReadOnly extends StatelessWidget {
  const ReadOnly({required this.employee});
  final EmployeeModel employee;
  @override
  Widget build(BuildContext context) => SafeArea(
      child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(employee.name,
                    style: const TextStyle(
                        fontSize: 22, fontWeight: FontWeight.w700)),
                const SizedBox(height: 12),
                Text(employee.role.label),
                Text(employee.email),
                Text(employee.phone),
                Text(employee.active ? 'Active' : 'Inactive'),
                const SizedBox(height: 14),
                const Text('Staff access is view-only.',
                    style: TextStyle(color: muted))
              ])));
}

class Loading extends StatelessWidget {
  const Loading();
  @override
  Widget build(BuildContext context) => const Scaffold(
      backgroundColor: bg,
      body: Center(child: CircularProgressIndicator(color: green)));
}

class EmployeesError extends StatelessWidget {
  const EmployeesError({required this.message});
  final String message;
  @override
  Widget build(BuildContext context) => Scaffold(
      backgroundColor: bg,
      body: Center(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
        Text(message, style: const TextStyle(color: muted)),
        const SizedBox(height: 12),
        FilledButton(
            onPressed: () =>
                context.read<EmployeeBloc>().add(const EmployeesStarted()),
            child: const Text('Retry'))
      ])));
}

String roleDescription(EmployeeRole role) => switch (role) {
      EmployeeRole.admin =>
        'Can manage employees, rooms, tables, and restaurant settings.',
      EmployeeRole.manager =>
        'Can oversee daily operations, staff coordination, and table assignments.',
      EmployeeRole.staff =>
        'Can seat guests, take orders, and manage active table status.',
      EmployeeRole.owner => 'Full restaurant access and account management.',
    };

void openForm(BuildContext context, {EmployeeModel? employee}) {
  context.read<EmployeeBloc>().add(EmployeeFormOpened(employee: employee));
  context.push(AppRoutes.employeesForm);
}
