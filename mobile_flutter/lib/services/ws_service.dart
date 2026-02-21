import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../config.dart';

class WsService {
  WebSocketChannel? _channel;
  bool _active = false;

  void connect({
    required int wishlistId,
    required void Function(Map<String, dynamic>) onMessage,
    required void Function() onDisconnected,
  }) {
    _active = true;
    final uri = Uri.parse('${AppConfig.wsBaseUrl()}/api/items/ws/$wishlistId');
    _channel = WebSocketChannel.connect(uri);

    _channel!.stream.listen(
      (event) {
        try {
          final decoded = jsonDecode(event as String) as Map<String, dynamic>;
          onMessage(decoded);
        } catch (_) {}
      },
      onDone: () {
        if (_active) {
          onDisconnected();
        }
      },
      onError: (_) {
        if (_active) {
          onDisconnected();
        }
      },
      cancelOnError: true,
    );
  }

  void disconnect() {
    _active = false;
    _channel?.sink.close();
    _channel = null;
  }
}
