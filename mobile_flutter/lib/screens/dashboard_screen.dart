import 'package:flutter/material.dart';
import '../models.dart';
import '../services/auth_service.dart';
import '../services/wishlist_service.dart';
import 'public_wishlist_screen.dart';
import 'wishlist_detail_screen.dart';

class DashboardScreen extends StatefulWidget {
  final WishlistService wishlistService;
  final AuthService authService;
  final VoidCallback onLogout;

  const DashboardScreen({
    super.key,
    required this.wishlistService,
    required this.authService,
    required this.onLogout,
  });

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  List<Wishlist> _wishlists = [];
  bool _loading = true;
  final _title = TextEditingController();
  final _description = TextEditingController();
  final _slug = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      _wishlists = await widget.wishlistService.getMyWishlists();
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _createWishlist() async {
    if (_title.text.trim().isEmpty) return;
    try {
      final created = await widget.wishlistService
          .createWishlist(_title.text.trim(), _description.text.trim().isEmpty ? null : _description.text.trim());
      setState(() {
        _wishlists = [created, ..._wishlists];
        _title.clear();
        _description.clear();
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Ошибка: $e')));
    }
  }

  Future<void> _logout() async {
    await widget.authService.logout();
    widget.onLogout();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    return Scaffold(
      appBar: AppBar(
        title: const Text('Мои вишлисты'),
        actions: [IconButton(onPressed: _logout, icon: const Icon(Icons.logout))],
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  children: [
                    const Align(
                        alignment: Alignment.centerLeft,
                        child: Text('Создать вишлист', style: TextStyle(fontWeight: FontWeight.bold))),
                    TextField(controller: _title, decoration: const InputDecoration(labelText: 'Название')),
                    TextField(controller: _description, decoration: const InputDecoration(labelText: 'Описание')),
                    const SizedBox(height: 8),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(onPressed: _createWishlist, child: const Text('Создать')),
                    ),
                  ],
                ),
              ),
            ),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  children: [
                    const Align(
                      alignment: Alignment.centerLeft,
                      child: Text('Открыть публичный вишлист', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                    TextField(controller: _slug, decoration: const InputDecoration(labelText: 'Slug')),
                    const SizedBox(height: 8),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () {
                          if (_slug.text.trim().isEmpty) return;
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => PublicWishlistScreen(
                                slug: _slug.text.trim(),
                                wishlistService: widget.wishlistService,
                              ),
                            ),
                          );
                        },
                        child: const Text('Открыть'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            ..._wishlists.map(
              (w) => Card(
                child: ListTile(
                  title: Text(w.title),
                  subtitle: Text('Товаров: ${w.items.length}\nSlug: ${w.slug}'),
                  isThreeLine: true,
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => WishlistDetailScreen(
                          wishlistId: w.id,
                          wishlistService: widget.wishlistService,
                          title: w.title,
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
