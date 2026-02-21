import 'package:dio/dio.dart';

import '../models.dart';
import 'api_service.dart';
import 'storage_service.dart';

class AuthService {
  final ApiService _api;
  final StorageService _storage;

  AuthService(this._api, this._storage);

  Future<AuthResponse> login(String email, String password) async {
    final response = await _api.dio.post(
      '/api/auth/login/json',
      data: {'email': email, 'password': password},
    );
    final auth = AuthResponse.fromJson(response.data);
    await _storage.saveToken(auth.accessToken);
    return auth;
  }

  Future<AuthResponse> register(String email, String username, String password) async {
    final response = await _api.dio.post(
      '/api/auth/register',
      data: {'email': email, 'username': username, 'password': password},
    );
    final auth = AuthResponse.fromJson(response.data);
    await _storage.saveToken(auth.accessToken);
    return auth;
  }

  Future<User> me() async {
    final response = await _api.dio.get('/api/auth/me');
    return User.fromJson(response.data);
  }

  Future<String> oauthInfo(String provider) async {
    try {
      final response = await _api.dio.get('/api/auth/$provider');
      return response.data['message']?.toString() ?? 'OAuth not configured';
    } on DioException catch (e) {
      return e.response?.data?.toString() ?? 'OAuth not configured';
    }
  }

  Future<void> logout() async {
    await _storage.clearToken();
  }
}
