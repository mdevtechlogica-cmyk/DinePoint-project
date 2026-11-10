import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:host_stand/core/router/app_routes.dart';
import 'package:host_stand/core/theme/app_theme.dart';
import 'package:host_stand/features/auth/presentation/bloc/register/register_bloc.dart';
import 'package:host_stand/features/auth/presentation/bloc/register/register_event.dart';
import 'package:host_stand/features/auth/presentation/bloc/register/register_state.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});
  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final name = TextEditingController();
  final email = TextEditingController();
  final password = TextEditingController();
  final org = TextEditingController();

  @override
  void dispose() {
    name.dispose(); email.dispose(); password.dispose(); org.dispose();
    super.dispose();
  }

  void sync(TextEditingController c, String v) {
    if (c.text == v) return;
    c.value = TextEditingValue(text: v, selection: TextSelection.collapsed(offset: v.length));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(child: BlocConsumer<RegisterBloc, RegisterState>(
        listenWhen: (a, b) => a.ownerName != b.ownerName || a.email != b.email ||
          a.password != b.password || a.organizationName != b.organizationName ||
          a.status != b.status,
        listener: (context, s) {
          sync(name, s.ownerName); sync(email, s.email);
          sync(password, s.password); sync(org, s.organizationName);
          if (s.status == RegisterStatus.success) {
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(
              backgroundColor: AppColors.green,
              content: Text('Account created for ${s.result?.ownerName ?? 'owner'}'),
            ));
            context.go(AppRoutes.restaurants);
          }
        },
        builder: (context, s) => LayoutBuilder(builder: (context, box) {
          final minHeight = box.hasBoundedHeight
              ? (box.maxHeight - 20).clamp(0.0, double.infinity)
              : 0.0;
          return SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
            child: ConstrainedBox(
              constraints: BoxConstraints(minHeight: minHeight),
              child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                Row(children: [
                  Material(color: AppColors.white, borderRadius: BorderRadius.circular(AppRadii.back),
                    child: InkWell(borderRadius: BorderRadius.circular(AppRadii.back),
                      onTap: () => context.go(AppRoutes.login),
                      child: const SizedBox(width: 64, height: 64,
                        child: Icon(Icons.arrow_back, size: 30, color: AppColors.ink)))),
                  const SizedBox(width: 14),
                  const Expanded(child: Text('STEP 1 OF 3 • ORGANIZATION',
                    style: TextStyle(color: AppColors.muted, fontSize: 13,
                      fontWeight: FontWeight.w700, letterSpacing: .7))),
                ]),
                const SizedBox(height: 26),
                const Padding(padding: EdgeInsets.symmetric(horizontal: 8),
                  child: Text('Create owner account', style: TextStyle(
                    color: AppColors.ink, fontSize: 25, fontWeight: FontWeight.w600, letterSpacing: -.6))),
                const SizedBox(height: 10),
                const Padding(padding: EdgeInsets.symmetric(horizontal: 8),
                  child: Text('Set up your restaurant group. You can add outlets and staff next.',
                    style: TextStyle(color: AppColors.muted, fontSize: 17, height: 1.45))),
                const SizedBox(height: 24),
                Container(
                  padding: const EdgeInsets.fromLTRB(20, 22, 20, 20),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(AppRadii.card),
                    boxShadow: AppShadows.card),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                    _fieldLabel('Owner name', s.errors['ownerName']),
                    const SizedBox(height: 7),
                    _textField(controller: name, hint: 'Your full name', enabled: !s.loading,
                      error: s.errors['ownerName'], action: TextInputAction.next,
                      onChanged: (v) => context.read<RegisterBloc>().add(OwnerNameChanged(v))),
                    const SizedBox(height: 20),
                    _fieldLabel('Email', s.errors['email']),
                    const SizedBox(height: 7),
                    _textField(controller: email, hint: 'you@restaurant.com', enabled: !s.loading,
                      error: s.errors['email'], type: TextInputType.emailAddress, action: TextInputAction.next,
                      onChanged: (v) => context.read<RegisterBloc>().add(EmailChanged(v))),
                    const SizedBox(height: 20),
                    _fieldLabel('Password', s.errors['password']),
                    const SizedBox(height: 7),
                    TextField(controller: password, enabled: !s.loading,
                      obscureText: !s.passwordVisible, textInputAction: TextInputAction.next,
                      onChanged: (v) => context.read<RegisterBloc>().add(PasswordChanged(v)),
                      decoration: InputDecoration(
                        hintText: 'At least 8 characters',
                        border: InputBorder.none, enabledBorder: InputBorder.none, focusedBorder: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                        suffixIcon: IconButton(
                          tooltip: s.passwordVisible ? 'Hide password' : 'Show password',
                          onPressed: s.loading ? null : () => context.read<RegisterBloc>().add(const PasswordVisibilityToggled()),
                          icon: Icon(s.passwordVisible ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                            color: AppColors.muted, size: 24)),
                      ),
                      style: const TextStyle(fontSize: 16, color: AppColors.muted)),
                    if (s.errors['password'] != null)
                      _errorText(s.errors['password']!),
                    const SizedBox(height: 20),
                    Row(children: [
                      Expanded(child: _fieldLabel('Organization name', s.errors['organizationName'])),
                      const SizedBox(width: 8),
                      const Text('Brand or Group', style: TextStyle(color: AppColors.muted,
                        fontSize: 12, fontWeight: FontWeight.w600)),
                    ]),
                    const SizedBox(height: 7),
                    _textField(controller: org, hint: 'e.g. Saffron House', enabled: !s.loading,
                      error: s.errors['organizationName'], action: TextInputAction.done,
                      onChanged: (v) => context.read<RegisterBloc>().add(OrganizationChanged(v)),
                      onSubmitted: (_) => context.read<RegisterBloc>().add(const RegisterSubmitted())),
                    if (s.message != null) ...[
                      const SizedBox(height: 12),
                      Container(padding: const EdgeInsets.all(11),
                        decoration: BoxDecoration(color: AppColors.dangerSoft,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: AppColors.dangerBorder)),
                        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          const Icon(Icons.error_outline, color: AppColors.danger, size: 18),
                          const SizedBox(width: 8),
                          Expanded(child: Text(s.message!, style: const TextStyle(color: AppColors.danger, fontSize: 13))),
                        ])),
                    ],
                    const SizedBox(height: 8),
                    CheckboxListTile(
                      value: s.rememberMe,
                      onChanged: s.loading
                          ? null
                          : (v) => context
                              .read<RegisterBloc>()
                              .add(RememberMeChanged(v ?? false)),
                      controlAffinity: ListTileControlAffinity.leading,
                      contentPadding: EdgeInsets.zero,
                      dense: true,
                      activeColor: AppColors.green,
                      title: const Text(
                        'Remember me',
                        style: TextStyle(fontSize: 15, color: AppColors.ink),
                      ),
                      subtitle: const Text(
                        'Stay signed in after creating your account',
                        style: TextStyle(fontSize: 12, color: AppColors.muted),
                      ),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(height: 54, child: ElevatedButton(
                      onPressed: s.loading ? null : () => context.read<RegisterBloc>().add(const RegisterSubmitted()),
                      style: ElevatedButton.styleFrom(backgroundColor: AppColors.green, foregroundColor: Colors.white,
                        disabledBackgroundColor: AppColors.disabledAlt, elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadii.button),
                          side: const BorderSide(color: AppColors.green))),
                      child: s.loading
                        ? const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                            SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)),
                            SizedBox(width: 10), Text('Creating account…', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                          ])
                        : const Text('Create account', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                    )),
                  ]),
                ),
                const SizedBox(height: 24),
                Wrap(alignment: WrapAlignment.center, crossAxisAlignment: WrapCrossAlignment.center, children: [
                  const Text('Already have an account? ', style: TextStyle(color: AppColors.muted, fontSize: 14)),
                  TextButton(onPressed: () => context.go(AppRoutes.login),
                    style: TextButton.styleFrom(foregroundColor: AppColors.green, padding: const EdgeInsets.symmetric(horizontal: 2, vertical: 4)),
                    child: const Text('Back to sign in', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700))),
                ]),
                const SizedBox(height: 8),
                const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Icon(Icons.point_of_sale_rounded, color: AppColors.caption, size: 17),
                  SizedBox(width: 8),
                  Flexible(child: Text(AppCopy.indiaEdition,
                    textAlign: TextAlign.center, style: TextStyle(color: AppColors.caption, fontSize: 11))),
                ]),
              ]),
            ),
          );
        }),
      )),
    );
  }

}

Widget _fieldLabel(String title, String? error) => Column(
  crossAxisAlignment: CrossAxisAlignment.start, children: [
    Text(title, style: const TextStyle(color: AppColors.ink, fontSize: 14, fontWeight: FontWeight.w500)),
    if (error != null) ...[const SizedBox(height: 4), _errorText(error)],
  ],
);

Widget _errorText(String text) => Text(text, style: const TextStyle(color: AppColors.danger, fontSize: 12));

Widget _textField({
  required TextEditingController controller,
  required String hint,
  required bool enabled,
  required ValueChanged<String> onChanged,
  String? error,
  TextInputType? type,
  TextInputAction? action,
  ValueChanged<String>? onSubmitted,
}) => TextField(
  controller: controller, enabled: enabled, keyboardType: type, textInputAction: action,
  autocorrect: false, onChanged: onChanged, onSubmitted: onSubmitted,
  decoration: InputDecoration(hintText: hint, border: InputBorder.none,
    enabledBorder: InputBorder.none, focusedBorder: InputBorder.none,
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16)),
  style: const TextStyle(fontSize: 16, color: AppColors.muted),
);

