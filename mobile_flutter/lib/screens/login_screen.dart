import 'package:flutter/material.dart';
import '../services/auth_service.dart';

class LoginScreen extends StatefulWidget {
  final AuthService authService;
  final void Function() onAuthenticated;
  final VoidCallback openRegister;

  const LoginScreen({
    super.key,
    required this.authService,
    required this.onAuthenticated,
    required this.openRegister,
  });

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _loading = false;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _loading = true);
    try {
      await widget.authService.login(_email.text.trim(), _password.text);
      widget.onAuthenticated();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Ошибка входа: $e')),
      );
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _showOauth(String provider) async {
    final info = await widget.authService.oauthInfo(provider);
    if (!mounted) return;
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('OAuth'),
        content: Text(info),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('OK')),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Вход')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(
              controller: _email,
              decoration: const InputDecoration(labelText: 'Email'),
              keyboardType: TextInputType.emailAddress,
            ),
            TextField(
              controller: _password,
              decoration: const InputDecoration(labelText: 'Пароль'),
              obscureText: true,
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _loading ? null : _submit,
                child: _loading
                    ? const CircularProgressIndicator()
                    : const Text('Войти'),
              ),
            ),
            TextButton(
              onPressed: widget.openRegister,
              child: const Text('Нет аккаунта? Регистрация'),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => _showOauth('google'),
              child: const Text('Google OAuth (info)'),
            ),
            ElevatedButton(
              onPressed: () => _showOauth('github'),
              child: const Text('GitHub OAuth (info)'),
            ),
          ],
        ),
      ),
    );
  }
}
