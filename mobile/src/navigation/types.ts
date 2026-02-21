export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Dashboard: undefined;
  WishlistDetail: { wishlistId: number; title: string };
  PublicWishlist: { slug: string };
};
