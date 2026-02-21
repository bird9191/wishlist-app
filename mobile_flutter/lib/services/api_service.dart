import 'package:dio/dio.dart';
import '../config.dart';
import 'storage_service.dart';

class ApiService {
  final Dio dio;
  final StorageService _storage;

  ApiService(this._storage)
      : dio = Dio(BaseOptions(
          baseUrl: AppConfig.apiBaseUrl,
          headers: {'Content-Type': 'application/json'},
        )) {
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.getToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
      ),
    );
  }
}
