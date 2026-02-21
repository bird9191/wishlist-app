import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types";
import { Wishlist } from "@/api/types";
import { wishlistApi } from "@/api/wishlist";
import { ui } from "@/ui";
import { useAuth } from "@/context/AuthContext";

type Props = NativeStackScreenProps<RootStackParamList, "Dashboard">;

export const DashboardScreen = ({ navigation }: Props) => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [slugInput, setSlugInput] = useState("");

  const loadWishlists = useCallback(async () => {
    try {
      const data = await wishlistApi.getMyWishlists();
      setWishlists(data);
    } catch (e: any) {
      Alert.alert("Ошибка", e?.response?.data?.detail || "Не удалось загрузить вишлисты");
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      await loadWishlists();
      setLoading(false);
    };
    run();
  }, [loadWishlists]);

  const createWishlist = async () => {
    if (!title.trim()) {
      Alert.alert("Проверка", "Введите название вишлиста.");
      return;
    }
    try {
      const created = await wishlistApi.createWishlist({
        title: title.trim(),
        description: description.trim() || undefined,
        is_public: true,
      });
      setTitle("");
      setDescription("");
      setWishlists((prev) => [created, ...prev]);
    } catch (e: any) {
      Alert.alert("Ошибка", e?.response?.data?.detail || "Не удалось создать вишлист");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWishlists();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={[ui.page, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={ui.page}>
      <FlatList
        contentContainerStyle={ui.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        data={wishlists}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <>
            <View style={ui.card}>
              <Text style={ui.title}>Привет, {user?.username}</Text>
              <Text style={ui.subtitle}>Твои вишлисты и публичные ссылки</Text>
              <Pressable style={[ui.button, { backgroundColor: "#111827" }]} onPress={logout}>
                <Text style={ui.buttonText}>Выйти</Text>
              </Pressable>
            </View>

            <View style={ui.card}>
              <Text style={{ fontWeight: "700", color: "#111827" }}>Создать вишлист</Text>
              <TextInput
                placeholder="Название"
                value={title}
                onChangeText={setTitle}
                style={ui.input}
                placeholderTextColor="#9ca3af"
              />
              <TextInput
                placeholder="Описание"
                value={description}
                onChangeText={setDescription}
                style={ui.input}
                placeholderTextColor="#9ca3af"
              />
              <Pressable style={ui.button} onPress={createWishlist}>
                <Text style={ui.buttonText}>Создать</Text>
              </Pressable>
            </View>

            <View style={ui.card}>
              <Text style={{ fontWeight: "700", color: "#111827" }}>Открыть публичный вишлист</Text>
              <TextInput
                placeholder="slug"
                value={slugInput}
                onChangeText={setSlugInput}
                style={ui.input}
                placeholderTextColor="#9ca3af"
              />
              <Pressable
                style={ui.button}
                onPress={() =>
                  slugInput.trim() &&
                  navigation.navigate("PublicWishlist", { slug: slugInput.trim() })
                }
              >
                <Text style={ui.buttonText}>Открыть</Text>
              </Pressable>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <Pressable
            style={ui.card}
            onPress={() =>
              navigation.navigate("WishlistDetail", {
                wishlistId: item.id,
                title: item.title,
              })
            }
          >
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#111827" }}>{item.title}</Text>
            <Text style={ui.subtitle}>{item.description || "Без описания"}</Text>
            <Text style={{ color: "#2563eb", fontWeight: "600" }}>
              Публичная ссылка: /wishlist/{item.slug}
            </Text>
            <Text style={{ color: "#6b7280" }}>Товаров: {item.items?.length || 0}</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={ui.card}>
            <Text style={ui.subtitle}>Пока нет вишлистов. Создай первый.</Text>
          </View>
        }
      />
    </View>
  );
};
