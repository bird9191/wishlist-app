export interface User {
  id: number;
  email: string;
  username: string;
  is_active: boolean;
  avatar_url?: string;
  created_at: string;
  oauth_provider?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Reservation {
  id: number;
  item_id: number;
  reserver_name: string;
  reserver_email?: string;
  message?: string;
  created_at: string;
}

export interface Contribution {
  id: number;
  item_id: number;
  contributor_name: string;
  contributor_email?: string;
  amount: number;
  message?: string;
  created_at: string;
}

export interface WishlistItem {
  id: number;
  title: string;
  description?: string;
  url?: string;
  image_url?: string;
  price?: number;
  currency: string;
  priority: number;
  is_reserved: boolean;
  is_pooling: boolean;
  wishlist_id: number;
  created_at: string;
  updated_at?: string;
  reservations?: Reservation[];
  contributions?: Contribution[];
  total_contributed?: number;
}

export interface Wishlist {
  id: number;
  title: string;
  description?: string;
  slug: string;
  items: WishlistItem[];
  created_at: string;
}

export interface URLMetadata {
  title?: string;
  description?: string;
  image_url?: string;
  price?: string;
  currency?: string;
}

export interface WSMessage {
  type: string;
  wishlist_id: number;
  item_id?: number;
  data: Record<string, unknown>;
}
