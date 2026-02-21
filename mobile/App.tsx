import "react-native-gesture-handler";
import React from "react";
import { NavigationContainer, LinkingOptions } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";
import * as Linking from "expo-linking";
import { RootStackParamList } from "@/navigation/types";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { LoginScreen } from "@/screens/LoginScreen";
import { RegisterScreen } from "@/screens/RegisterScreen";
import { DashboardScreen } from "@/screens/DashboardScreen";
import { WishlistDetailScreen } from "@/screens/WishlistDetailScreen";
import { PublicWishlistScreen } from "@/screens/PublicWishlistScreen";
import { ui } from "@/ui";

const Stack = createNativeStackNavigator<RootStackParamList>();

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL("/"), "wishlistmobile://", "https://wishlist-app-production-5549.up.railway.app"],
  config: {
    screens: {
      Login: "login",
      Register: "register",
      Dashboard: "dashboard",
      WishlistDetail: "wishlist/:wishlistId",
      PublicWishlist: "public/:slug",
    },
  },
};

const RootNavigator = () => {
  const { loading, isAuthenticated } = useAuth();
  if (loading) {
    return (
      <View style={[ui.page, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Stack.Navigator>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ title: "Вход" }} />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ title: "Регистрация" }}
          />
          <Stack.Screen
            name="PublicWishlist"
            component={PublicWishlistScreen}
            options={{ title: "Публичный вишлист" }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{ title: "Мои вишлисты" }}
          />
          <Stack.Screen
            name="WishlistDetail"
            component={WishlistDetailScreen}
            options={({ route }) => ({ title: route.params.title })}
          />
          <Stack.Screen
            name="PublicWishlist"
            component={PublicWishlistScreen}
            options={{ title: "Публичный вишлист" }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer linking={linking}>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
