import 'package:dio/dio.dart';
import '../models.dart';
import 'api_service.dart';

class WishlistService {
  final ApiService _api;

  WishlistService(this._api);

  Future<List<Wishlist>> getMyWishlists() async {
    final response = await _api.dio.get('/api/wishlists');
    return (response.data as List<dynamic>)
        .map((e) => Wishlist.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Wishlist> createWishlist(String title, String? description) async {
    final response = await _api.dio.post(
      '/api/wishlists',
      data: {'title': title, 'description': description, 'is_public': true},
    );
    return Wishlist.fromJson(response.data);
  }

  Future<Wishlist> getWishlist(int id) async {
    final response = await _api.dio.get('/api/wishlists/$id');
    return Wishlist.fromJson(response.data);
  }

  Future<Wishlist> getPublicWishlist(String slug) async {
    final response = await _api.dio.get('/api/wishlists/public/$slug');
    return Wishlist.fromJson(response.data);
  }

  Future<WishlistItem> addItem(
    int wishlistId, {
    required String title,
    String? description,
    String? url,
    double? price,
    bool isPooling = false,
  }) async {
    final response = await _api.dio.post(
      '/api/wishlists/$wishlistId/items',
      data: {
        'title': title,
        'description': description,
        'url': url,
        'price': price,
        'currency': 'RUB',
        'priority': 1,
        'is_pooling': isPooling,
      },
    );
    return WishlistItem.fromJson(response.data);
  }

  Future<Map<String, dynamic>> parseUrl(String url) async {
    final response = await _api.dio.post(
      '/api/url/parse',
      data: '"$url"',
      options: Options(headers: {'Content-Type': 'application/json'}),
    );
    return Map<String, dynamic>.from(response.data as Map);
  }

  Future<void> deleteItem(int itemId) async {
    await _api.dio.delete('/api/items/$itemId');
  }

  Future<void> reserveItem(
    int itemId, {
    required String name,
    String? email,
    String? message,
  }) async {
    await _api.dio.post(
      '/api/items/$itemId/reserve',
      data: {
        'reserver_name': name,
        'reserver_email': email,
        'message': message,
      },
    );
  }

  Future<void> contribute(
    int itemId, {
    required String name,
    String? email,
    required double amount,
    String? message,
  }) async {
    await _api.dio.post(
      '/api/items/$itemId/contribute',
      data: {
        'contributor_name': name,
        'contributor_email': email,
        'amount': amount,
        'message': message,
      },
    );
  }
}
