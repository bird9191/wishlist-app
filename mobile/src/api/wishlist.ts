import { api } from "@/api/client";
import {
  Contribution,
  Reservation,
  URLMetadata,
  Wishlist,
  WishlistItem,
} from "@/api/types";

export const wishlistApi = {
  async getMyWishlists(): Promise<Wishlist[]> {
    const response = await api.get<Wishlist[]>("/api/wishlists");
    return response.data;
  },

  async createWishlist(payload: {
    title: string;
    description?: string;
    is_public?: boolean;
  }): Promise<Wishlist> {
    const response = await api.post<Wishlist>("/api/wishlists", payload);
    return response.data;
  },

  async getWishlistById(wishlistId: number): Promise<Wishlist> {
    const response = await api.get<Wishlist>(`/api/wishlists/${wishlistId}`);
    return response.data;
  },

  async addItem(
    wishlistId: number,
    payload: {
      title: string;
      description?: string;
      url?: string;
      image_url?: string;
      price?: number;
      currency?: string;
      priority?: number;
      is_pooling?: boolean;
    }
  ): Promise<WishlistItem> {
    const response = await api.post<WishlistItem>(
      `/api/wishlists/${wishlistId}/items`,
      payload
    );
    return response.data;
  },

  async updateItem(
    itemId: number,
    payload: Partial<{
      title: string;
      description?: string;
      url?: string;
      image_url?: string;
      price?: number;
      currency?: string;
      priority?: number;
      is_pooling?: boolean;
    }>
  ): Promise<WishlistItem> {
    const response = await api.put<WishlistItem>(`/api/items/${itemId}`, payload);
    return response.data;
  },

  async deleteItem(itemId: number): Promise<void> {
    await api.delete(`/api/items/${itemId}`);
  },

  async parseUrl(url: string): Promise<URLMetadata> {
    const response = await api.post<URLMetadata>("/api/url/parse", `"${url}"`, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  },

  async getPublicWishlist(slug: string): Promise<Wishlist> {
    const response = await api.get<Wishlist>(`/api/wishlists/public/${slug}`);
    return response.data;
  },

  async reserveItem(
    itemId: number,
    payload: {
      reserver_name: string;
      reserver_email?: string;
      message?: string;
    }
  ): Promise<Reservation> {
    const response = await api.post<Reservation>(`/api/items/${itemId}/reserve`, payload);
    return response.data;
  },

  async cancelReservation(itemId: number, reserver_email: string): Promise<void> {
    await api.delete(`/api/items/${itemId}/reserve`, {
      data: { reserver_email },
    });
  },

  async contribute(
    itemId: number,
    payload: {
      contributor_name: string;
      contributor_email?: string;
      amount: number;
      message?: string;
    }
  ): Promise<Contribution> {
    const response = await api.post<Contribution>(`/api/items/${itemId}/contribute`, payload);
    return response.data;
  },
};
