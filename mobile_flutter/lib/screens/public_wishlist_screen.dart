import 'dart:async';
import 'package:flutter/material.dart';
import '../models.dart';
import '../services/wishlist_service.dart';
import '../services/ws_service.dart';

class PublicWishlistScreen extends StatefulWidget {
  final String slug;
  final WishlistService wishlistService;

  const PublicWishlistScreen({
    super.key,
    required this.slug,
    required this.wishlistService,
  });

  @override
  State<PublicWishlistScreen> createState() => _PublicWishlistScreenState();
}

class _PublicWishlistScreenState extends State<PublicWishlistScreen> {
  Wishlist? _wishlist;
  bool _loading = true;
  bool _connected = false;
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _message = TextEditingController();
  final _amountByItem = <int, TextEditingController>{};
  final WsService _ws = WsService();
  Timer? _reconnectTimer;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _ws.disconnect();
    _reconnectTimer?.cancel();
    for (final c in _amountByItem.values) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      _wishlist = await widget.wishlistService.getPublicWishlist(widget.slug);
      _connectWs();
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  void _connectWs() {
    final wishlistId = _wishlist?.id;
    if (wishlistId == null) return;

    _ws.disconnect();
    _ws.connect(
      wishlistId: wishlistId,
      onMessage: (data) {
        if (!mounted || _wishlist == null) return;
        final type = data['type']?.toString();
        final itemId = data['item_id'] as int?;
        if (itemId == null) return;

        final updatedItems = _wishlist!.items.map((item) {
          if (item.id != itemId) return item;
          if (type == 'reservation' || type == 'reservation_cancelled') {
            final isReserved = (data['data'] as Map?)?['is_reserved'] == true;
            return item.copyWith(isReserved: isReserved);
          }
          if (type == 'contribution') {
            final d = data['data'] as Map? ?? {};
            final total = (d['total_contributed'] as num?)?.toDouble();
            final isReserved = d['is_reserved'] == true;
            return item.copyWith(
              totalContributed: total ?? item.totalContributed ?? 0,
              isReserved: isReserved,
            );
          }
          return item;
        }).where((item) {
          if (type == 'item_deleted' && item.id == itemId) return false;
          return true;
        }).toList();

        setState(() {
          _wishlist = Wishlist(
            id: _wishlist!.id,
            title: _wishlist!.title,
            description: _wishlist!.description,
            slug: _wishlist!.slug,
            items: updatedItems,
          );
        });
      },
      onDisconnected: () {
        if (!mounted) return;
        setState(() => _connected = false);
        _reconnectTimer?.cancel();
        _reconnectTimer = Timer(const Duration(seconds: 3), _connectWs);
      },
    );
    setState(() => _connected = true);
  }

  Future<void> _reserve(WishlistItem item) async {
    if (_name.text.trim().isEmpty) return;
    try {
      await widget.wishlistService.reserveItem(
        item.id,
        name: _name.text.trim(),
        email: _email.text.trim().isEmpty ? null : _email.text.trim(),
        message: _message.text.trim().isEmpty ? null : _message.text.trim(),
      );
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Ошибка: $e')));
    }
  }

  Future<void> _contribute(WishlistItem item) async {
    final controller = _amountByItem.putIfAbsent(item.id, () => TextEditingController());
    final amount = double.tryParse(controller.text.trim().replaceAll(',', '.'));
    if (_name.text.trim().isEmpty || amount == null || amount <= 0) return;

    try {
      await widget.wishlistService.contribute(
        item.id,
        name: _name.text.trim(),
        email: _email.text.trim().isEmpty ? null : _email.text.trim(),
        amount: amount,
        message: _message.text.trim().isEmpty ? null : _message.text.trim(),
      );
      controller.clear();
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Ошибка: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    return Scaffold(
      appBar: AppBar(title: Text(_wishlist?.title ?? 'Публичный вишлист')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                children: [
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text(_wishlist?.description ?? 'Публичный просмотр'),
                  ),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      _connected ? 'Real-time: connected' : 'Real-time: reconnecting...',
                      style: TextStyle(
                        color: _connected ? Colors.green : Colors.orange,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  TextField(controller: _name, decoration: const InputDecoration(labelText: 'Ваше имя')),
                  TextField(controller: _email, decoration: const InputDecoration(labelText: 'Ваш email')),
                  TextField(controller: _message, decoration: const InputDecoration(labelText: 'Комментарий')),
                ],
              ),
            ),
          ),
          ...?_wishlist?.items.map((item) {
            final controller = _amountByItem.putIfAbsent(item.id, () => TextEditingController());
            final total = item.totalContributed ?? 0;
            final goal = item.price ?? 0;
            final fullyFunded = item.isPooling && goal > 0 && total >= goal;
            return Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(item.title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    Text(item.description ?? 'Без описания'),
                    Text('Цена: ${item.price ?? '-'} ${item.currency}'),
                    if (item.isPooling) ...[
                      Text('Собрано: $total / $goal ${item.currency}'),
                      TextField(
                        controller: controller,
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        decoration: const InputDecoration(labelText: 'Сумма вклада'),
                      ),
                      const SizedBox(height: 8),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: fullyFunded ? null : () => _contribute(item),
                          child: Text(fullyFunded ? 'Сбор закрыт' : 'Скинуться'),
                        ),
                      ),
                    ] else ...[
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: item.isReserved ? null : () => _reserve(item),
                          child: Text(item.isReserved ? 'Уже зарезервирован' : 'Зарезервировать'),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            );
          }),
        ],
      ),
    );
  }
}
