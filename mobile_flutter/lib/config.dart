class AppConfig {
  static const String apiBaseUrl =
      'https://wishlist-app-production-7db1.up.railway.app';

  static String wsBaseUrl() {
    if (apiBaseUrl.startsWith('https://')) {
      return apiBaseUrl.replaceFirst('https://', 'wss://');
    }
    return apiBaseUrl.replaceFirst('http://', 'ws://');
  }
}
