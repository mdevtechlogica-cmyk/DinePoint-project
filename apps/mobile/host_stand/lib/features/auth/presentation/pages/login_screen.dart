import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:host_stand/core/di/injection.dart';
import 'package:host_stand/features/auth/domain/repositories/auth_repository.dart';

import '../../../../core/router/app_routes.dart';
import '../../../../core/theme/app_theme.dart';
import '../bloc/login/login_bloc.dart';
import '../bloc/login/login_event.dart';
import '../bloc/login/login_state.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  late final TextEditingController _emailController;
  late final TextEditingController _passwordController;

  @override
  void initState() {
    super.initState();
    _emailController = TextEditingController();
    _passwordController = TextEditingController();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: BlocConsumer<LoginBloc, LoginState>(
          listenWhen: (previous, current) =>
              previous.email != current.email ||
              previous.password != current.password ||
              previous.status != current.status,
          listener: (context, state) {
            if (_emailController.text != state.email) {
              _emailController.value = TextEditingValue(
                text: state.email,
                selection: TextSelection.collapsed(offset: state.email.length),
              );
            }
            if (_passwordController.text != state.password) {
              _passwordController.value = TextEditingValue(
                text: state.password,
                selection:
                    TextSelection.collapsed(offset: state.password.length),
              );
            }
            if (state.status == LoginStatus.success) {
              context.go(AppRoutes.restaurants);
            }
          },
          builder: (context, state) {
            return LayoutBuilder(
              builder: (context, constraints) {
                final minHeight = constraints.hasBoundedHeight
                    ? (constraints.maxHeight - 36).clamp(0.0, double.infinity)
                    : 0.0;
                return SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                  child: ConstrainedBox(
                    constraints: BoxConstraints(minHeight: minHeight),
                    child: Column(
                      children: [
                        Container(
                          width: 76,
                          height: 76,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: AppColors.green,
                            borderRadius: BorderRadius.circular(25),
                            boxShadow: const [
                              BoxShadow(
                                color: Color(0x18000000),
                                blurRadius: 4,
                                offset: Offset(0, 2),
                              ),
                            ],
                          ),
                          child: const Text(
                            'DP',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 30,
                              fontWeight: FontWeight.w700,
                              letterSpacing: -1,
                            ),
                          ),
                        ),
                        const SizedBox(height: 25),
                        const Text(
                          AppCopy.appName,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: AppColors.ink,
                            fontSize: 24,
                            fontWeight: FontWeight.w600,
                            letterSpacing: -0.7,
                          ),
                        ),
                        const SizedBox(height: 7),
                        const Text(
                          AppCopy.staffSignIn,
                          style: TextStyle(
                            color: AppColors.muted,
                            fontSize: 17,
                          ),
                        ),
                        const SizedBox(height: 34),
                        _LoginFormCard(
                          state: state,
                          emailController: _emailController,
                          passwordController: _passwordController,
                        ),
                        const SizedBox(height: 25),
                        Wrap(
                          alignment: WrapAlignment.center,
                          crossAxisAlignment: WrapCrossAlignment.center,
                          children: [
                            const Text(
                              'New restaurant owner? ',
                              style: TextStyle(
                                color: AppColors.muted,
                                fontSize: 15,
                              ),
                            ),
                            TextButton(
                              onPressed: () => context.push(AppRoutes.register),
                              style: TextButton.styleFrom(
                                foregroundColor: AppColors.green,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 2,
                                  vertical: 4,
                                ),
                              ),
                              child: const Text(
                                'Register',
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 7),
                        const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.point_of_sale_rounded,
                              color: AppColors.caption,
                              size: 18,
                            ),
                            SizedBox(width: 8),
                            Flexible(
                              child: Text(
                                AppCopy.posEdition,
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  color: AppColors.caption,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  letterSpacing: .2,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }

}

class _LoginFormCard extends StatelessWidget {
  const _LoginFormCard({
    required this.state,
    required this.emailController,
    required this.passwordController,
  });

  final LoginState state;
  final TextEditingController emailController;
  final TextEditingController passwordController;

  @override
  Widget build(BuildContext context) {
    final bloc = context.read<LoginBloc>();

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(22, 24, 22, 22),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: const [
          BoxShadow(
            color: Color(0x08000000),
            blurRadius: 4,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const Text(
                'Email',
                style: TextStyle(color: AppColors.ink, fontSize: 16),
              ),
              const Spacer(),
              Text(
                'Host Terminal',
                style: TextStyle(
                  color: AppColors.muted,
                  fontSize: 12,
                  letterSpacing: .6,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          TextField(
            key: const Key('login-email'),
            controller: emailController,
            enabled: !state.isLoading,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.next,
            autofillHints: const [AutofillHints.username, AutofillHints.email],
            autocorrect: false,
            onChanged: (value) => bloc.add(LoginEmailChanged(value)),
            decoration: const InputDecoration(
              hintText: 'you@restaurant.com',
              border: InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
              contentPadding: EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 16,
              ),
            ),
            style: const TextStyle(fontSize: 16, color: AppColors.muted),
          ),
          const SizedBox(height: 22),
          Row(
            children: [
              const Text(
                'Password',
                style: TextStyle(color: AppColors.ink, fontSize: 16),
              ),
              const Spacer(),
              TextButton(
                onPressed: state.isLoading
                    ? null
                    : () => _showForgotPassword(context),
                style: TextButton.styleFrom(
                  foregroundColor: AppColors.green,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 0,
                    vertical: 8,
                  ),
                ),
                child: const Text(
                  'Forgot PIN?',
                  style: TextStyle(fontSize: 13, letterSpacing: .2),
                ),
              ),
            ],
          ),
          const SizedBox(height: 2),
          TextField(
            key: const Key('login-password'),
            controller: passwordController,
            enabled: !state.isLoading,
            obscureText: !state.isPasswordVisible,
            textInputAction: TextInputAction.done,
            autofillHints: const [AutofillHints.password],
            onChanged: (value) => bloc.add(LoginPasswordChanged(value)),
            onSubmitted: (_) {
              if (state.canSubmit) bloc.add(const LoginSubmitted());
            },
            decoration: InputDecoration(
              hintText: 'Your password',
              border: InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 16,
              ),
              suffixIcon: IconButton(
                key: const Key('toggle-password-visibility'),
                tooltip: state.isPasswordVisible
                    ? 'Hide password'
                    : 'Show password',
                onPressed: state.isLoading
                    ? null
                    : () => bloc.add(
                          const LoginPasswordVisibilityToggled(),
                        ),
                icon: Icon(
                  state.isPasswordVisible
                      ? Icons.visibility_outlined
                      : Icons.visibility_off_outlined,
                  color: AppColors.muted,
                  size: 24,
                ),
              ),
            ),
            style: const TextStyle(fontSize: 16, color: AppColors.muted),
          ),
          if (state.errorMessage != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(11),
              decoration: BoxDecoration(
                color: AppColors.dangerSoft,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.dangerBorder),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(
                    Icons.error_outline,
                    color: AppColors.danger,
                    size: 18,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      state.errorMessage!,
                      style: const TextStyle(
                        color: AppColors.danger,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 8),
          CheckboxListTile(
            value: state.rememberMe,
            onChanged: state.isLoading
                ? null
                : (v) => bloc.add(LoginRememberMeChanged(v ?? false)),
            controlAffinity: ListTileControlAffinity.leading,
            contentPadding: EdgeInsets.zero,
            dense: true,
            activeColor: AppColors.green,
            title: const Text(
              'Remember me',
              style: TextStyle(fontSize: 15, color: AppColors.ink),
            ),
            subtitle: const Text(
              'Stay signed in on this device',
              style: TextStyle(fontSize: 12, color: AppColors.muted),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 54,
            child: ElevatedButton(
              key: const Key('login-submit'),
              onPressed: state.canSubmit
                  ? () => bloc.add(const LoginSubmitted())
                  : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.green,
                foregroundColor: Colors.white,
                disabledBackgroundColor: AppColors.disabledAlt,
                disabledForegroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                  side: const BorderSide(color: AppColors.green),
                ),
              ),
              child: state.isLoading
                  ? const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        ),
                        SizedBox(width: 10),
                        Text(
                          'Signing in…',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    )
                  : const Text(
                      'Sign in',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
            ),
          ),
          const SizedBox(height: 13),
          Container(
            height: 44,
            decoration: BoxDecoration(
              color: AppColors.paleGreen,
              borderRadius: BorderRadius.circular(11),
            ),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.circle, color: AppColors.green, size: 10),
                SizedBox(width: 8),
                Text(
                  AppCopy.terminalLunch,
                  style: TextStyle(
                    color: AppColors.muted,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    letterSpacing: .2,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showForgotPassword(BuildContext context) {
    final emailController = TextEditingController(
      text: context.read<LoginBloc>().state.email,
    );
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Reset password'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Enter the email for your Host Stand account. We’ll send reset instructions if it exists.',
            ),
            const SizedBox(height: 14),
            TextField(
              controller: emailController,
              keyboardType: TextInputType.emailAddress,
              autofillHints: const [AutofillHints.email],
              decoration: const InputDecoration(
                labelText: 'Email',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () async {
              final email = emailController.text.trim();
              Navigator.pop(ctx);
              try {
                final message = await sl<AuthRepository>()
                    .requestPasswordReset(email: email);
                if (!context.mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text(message)),
                );
                context.push(AppRoutes.resetPassword);
              } catch (error) {
                if (!context.mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      error.toString().replaceFirst('Exception: ', ''),
                    ),
                  ),
                );
              }
            },
            child: const Text('Send link'),
          ),
        ],
      ),
    );
  }
}

