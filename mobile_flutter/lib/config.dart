class AppConfig {
  static const String apiBaseUrl =
      'http://localhost:8000';

  static String wsBaseUrl() {
    if (apiBaseUrl.startsWith('https://')) {
      return apiBaseUrl.replaceFirst('https://', 'wss://');
    }
    return apiBaseUrl.replaceFirst('http://', 'ws://');
  }
}
