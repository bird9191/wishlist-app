import 'package:flutter/material.dart';
import '../models.dart';
import '../services/wishlist_service.dart';

class WishlistDetailScreen extends StatefulWidget {
  final int wishlistId;
  final String title;
  final WishlistService wishlistService;

  const WishlistDetailScreen({
    super.key,
    required this.wishlistId,
    required this.wishlistService,
    required this.title,
  });

  @override
  State<WishlistDetailScreen> createState() => _WishlistDetailScreenState();
}

class _WishlistDetailScreenState extends State<WishlistDetailScreen> {
  Wishlist? _wishlist;
  bool _loading = true;
  bool _isPooling = false;
  bool _parsing = false;
  final _url = TextEditingController();
  final _itemTitle = TextEditingController();
  final _desc = TextEditingController();
  final _price = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _url.dispose();
    _itemTitle.dispose();
    _desc.dispose();
    _price.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      _wishlist = await widget.wishlistService.getWishlist(widget.wishlistId);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Ошибка загрузки: $e')),
        );
      }
    }
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _parseUrl() async {
    if (_url.text.trim().isEmpty) return;
    setState(() => _parsing = true);
    try {
      final data = await widget.wishlistService.parseUrl(_url.text.trim());
      if ((_itemTitle.text).isEmpty && data['title'] != null) {
        _itemTitle.text = data['title'].toString();
      }
      if ((_desc.text).isEmpty && data['description'] != null) {
        _desc.text = data['description'].toString();
      }
      if ((_price.text).isEmpty && data['price'] != null) {
        _price.text = data['price'].toString().replaceAll(RegExp(r'[^\d.,]'), '').replaceAll(',', '.');
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Не удалось распарсить URL: $e')));
    } finally {
      if (mounted) setState(() => _parsing = false);
    }
  }

  Future<void> _addItem() async {
    if (_itemTitle.text.trim().isEmpty) return;
    try {
      await widget.wishlistService.addItem(
        widget.wishlistId,
        title: _itemTitle.text.trim(),
        description: _desc.text.trim().isEmpty ? null : _desc.text.trim(),
        url: _url.text.trim().isEmpty ? null : _url.text.trim(),
        price: _price.text.trim().isEmpty ? null : double.tryParse(_price.text.trim()),
        isPooling: _isPooling,
      );
      _itemTitle.clear();
      _desc.clear();
      _url.clear();
      _price.clear();
      setState(() => _isPooling = false);
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Ошибка добавления: $e')));
    }
  }

  Future<void> _deleteItem(WishlistItem item) async {
    try {
      await widget.wishlistService.deleteItem(item.id);
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Не удалось удалить (вклады/ограничения): $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    return Scaffold(
      appBar: AppBar(title: Text(widget.title)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                children: [
                  const Align(
                    alignment: Alignment.centerLeft,
                    child: Text('Новый товар', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                  TextField(controller: _url, decoration: const InputDecoration(labelText: 'URL товара')),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _parsing ? null : _parseUrl,
                      child: Text(_parsing ? 'Парсинг...' : 'Автозаполнение по URL'),
                    ),
                  ),
                  TextField(controller: _itemTitle, decoration: const InputDecoration(labelText: 'Название')),
                  TextField(controller: _desc, decoration: const InputDecoration(labelText: 'Описание')),
                  TextField(
                    controller: _price,
                    decoration: const InputDecoration(labelText: 'Цена'),
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  ),
                  SwitchListTile(
                    value: _isPooling,
                    onChanged: (v) => setState(() => _isPooling = v),
                    title: const Text('Коллективный сбор'),
                  ),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(onPressed: _addItem, child: const Text('Добавить товар')),
                  ),
                ],
              ),
            ),
          ),
          ...?_wishlist?.items.map(
            (item) => Card(
              child: ListTile(
                title: Text(item.title),
                subtitle: Text(
                  '${item.description ?? 'Без описания'}\n'
                  'Цена: ${item.price ?? '-'} ${item.currency}\n'
                  '${item.isReserved ? 'Зарезервирован' : 'Свободен'}'
                  '${item.isPooling ? '\nСбор: ${item.totalContributed ?? 0}/${item.price ?? 0}' : ''}',
                ),
                isThreeLine: true,
                trailing: IconButton(
                  icon: const Icon(Icons.delete, color: Colors.red),
                  onPressed: () => _deleteItem(item),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
