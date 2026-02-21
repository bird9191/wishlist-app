class User {
  final int id;
  final String email;
  final String username;
  final bool isActive;

  User({
    required this.id,
    required this.email,
    required this.username,
    required this.isActive,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      email: json['email'],
      username: json['username'],
      isActive: json['is_active'] ?? true,
    );
  }
}

class AuthResponse {
  final String accessToken;
  final User user;

  AuthResponse({required this.accessToken, required this.user});

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      accessToken: json['access_token'],
      user: User.fromJson(json['user']),
    );
  }
}

class Reservation {
  final int id;
  final String reserverName;
  final String? reserverEmail;

  Reservation({required this.id, required this.reserverName, this.reserverEmail});

  factory Reservation.fromJson(Map<String, dynamic> json) {
    return Reservation(
      id: json['id'],
      reserverName: json['reserver_name'] ?? '',
      reserverEmail: json['reserver_email'],
    );
  }
}

class Contribution {
  final int id;
  final String contributorName;
  final double amount;

  Contribution({
    required this.id,
    required this.contributorName,
    required this.amount,
  });

  factory Contribution.fromJson(Map<String, dynamic> json) {
    return Contribution(
      id: json['id'],
      contributorName: json['contributor_name'] ?? '',
      amount: (json['amount'] as num?)?.toDouble() ?? 0,
    );
  }
}

class WishlistItem {
  final int id;
  final String title;
  final String? description;
  final double? price;
  final String currency;
  final bool isReserved;
  final bool isPooling;
  final double? totalContributed;
  final List<Reservation> reservations;
  final List<Contribution> contributions;

  WishlistItem({
    required this.id,
    required this.title,
    this.description,
    this.price,
    required this.currency,
    required this.isReserved,
    required this.isPooling,
    this.totalContributed,
    required this.reservations,
    required this.contributions,
  });

  factory WishlistItem.fromJson(Map<String, dynamic> json) {
    return WishlistItem(
      id: json['id'],
      title: json['title'],
      description: json['description'],
      price: (json['price'] as num?)?.toDouble(),
      currency: json['currency'] ?? 'RUB',
      isReserved: json['is_reserved'] ?? false,
      isPooling: json['is_pooling'] ?? false,
      totalContributed: (json['total_contributed'] as num?)?.toDouble(),
      reservations: (json['reservations'] as List<dynamic>? ?? [])
          .map((e) => Reservation.fromJson(e))
          .toList(),
      contributions: (json['contributions'] as List<dynamic>? ?? [])
          .map((e) => Contribution.fromJson(e))
          .toList(),
    );
  }

  WishlistItem copyWith({
    bool? isReserved,
    double? totalContributed,
  }) {
    return WishlistItem(
      id: id,
      title: title,
      description: description,
      price: price,
      currency: currency,
      isReserved: isReserved ?? this.isReserved,
      isPooling: isPooling,
      totalContributed: totalContributed ?? this.totalContributed,
      reservations: reservations,
      contributions: contributions,
    );
  }
}

class Wishlist {
  final int id;
  final String title;
  final String? description;
  final String slug;
  final List<WishlistItem> items;

  Wishlist({
    required this.id,
    required this.title,
    this.description,
    required this.slug,
    required this.items,
  });

  factory Wishlist.fromJson(Map<String, dynamic> json) {
    return Wishlist(
      id: json['id'],
      title: json['title'],
      description: json['description'],
      slug: json['slug'] ?? '',
      items: (json['items'] as List<dynamic>? ?? [])
          .map((e) => WishlistItem.fromJson(e))
          .toList(),
    );
  }
}
