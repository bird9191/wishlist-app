import 'package:flutter/material.dart';
import 'models.dart';
import 'screens/dashboard_screen.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'services/api_service.dart';
import 'services/auth_service.dart';
import 'services/storage_service.dart';
import 'services/wishlist_service.dart';

void main() {
  runApp(const WishlistApp());
}

class WishlistApp extends StatefulWidget {
  const WishlistApp({super.key});

  @override
  State<WishlistApp> createState() => _WishlistAppState();
}

class _WishlistAppState extends State<WishlistApp> {
  late final StorageService _storage;
  late final ApiService _api;
  late final AuthService _authService;
  late final WishlistService _wishlistService;

  User? _user;
  bool _loading = true;
  bool _registerMode = false;

  @override
  void initState() {
    super.initState();
    _storage = StorageService();
    _api = ApiService(_storage);
    _authService = AuthService(_api, _storage);
    _wishlistService = WishlistService(_api);
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    try {
      final token = await _storage.getToken();
      if (token != null && token.isNotEmpty) {
        _user = await _authService.me();
      }
    } catch (_) {
      await _storage.clearToken();
      _user = null;
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _refreshUser() async {
    try {
      final user = await _authService.me();
      if (mounted) setState(() => _user = user);
    } catch (_) {
      await _storage.clearToken();
    }
  }

  Future<void> _logout() async {
    await _authService.logout();
    if (mounted) {
      setState(() {
        _user = null;
        _registerMode = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Wishlist Flutter',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(colorSchemeSeed: Colors.blue, useMaterial3: true),
      home: _loading
          ? const Scaffold(body: Center(child: CircularProgressIndicator()))
          : (_user == null
              ? (_registerMode
                  ? RegisterScreen(
                      authService: _authService,
                      onAuthenticated: _refreshUser,
                      backToLogin: () => setState(() => _registerMode = false),
                    )
                  : LoginScreen(
                      authService: _authService,
                      onAuthenticated: _refreshUser,
                      openRegister: () => setState(() => _registerMode = true),
                    ))
              : DashboardScreen(
                  wishlistService: _wishlistService,
                  authService: _authService,
                  onLogout: _logout,
                )),
    );
  }
}
