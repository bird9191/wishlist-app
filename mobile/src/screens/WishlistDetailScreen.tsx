import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types";
import { Wishlist, WishlistItem } from "@/api/types";
import { wishlistApi } from "@/api/wishlist";
import { ui } from "@/ui";

type Props = NativeStackScreenProps<RootStackParamList, "WishlistDetail">;

export const WishlistDetailScreen = ({ route }: Props) => {
  const { wishlistId } = route.params;
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [price, setPrice] = useState("");
  const [isPooling, setIsPooling] = useState(false);
  const [autofillLoading, setAutofillLoading] = useState(false);

  const loadWishlist = useCallback(async () => {
    try {
      const data = await wishlistApi.getWishlistById(wishlistId);
      setWishlist(data);
    } catch (e: any) {
      Alert.alert("Ошибка", e?.response?.data?.detail || "Не удалось открыть вишлист");
    }
  }, [wishlistId]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      await loadWishlist();
      setLoading(false);
    };
    run();
  }, [loadWishlist]);

  const parse = async () => {
    if (!url.trim()) return;
    try {
      setAutofillLoading(true);
      const data = await wishlistApi.parseUrl(url.trim());
      if (data.title && !title) setTitle(data.title);
      if (data.description && !description) setDescription(data.description);
      if (data.price && !price) {
        const numeric = data.price.replace(/[^\d.,]/g, "").replace(",", ".");
        setPrice(numeric);
      }
    } catch (e: any) {
      Alert.alert("Автозаполнение", e?.response?.data?.detail || "Не удалось распарсить URL");
    } finally {
      setAutofillLoading(false);
    }
  };

  const addItem = async () => {
    if (!title.trim()) {
      Alert.alert("Проверка", "Введите название товара.");
      return;
    }
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        url: url.trim() || undefined,
        price: price ? Number(price) : undefined,
        is_pooling: isPooling,
        currency: "RUB",
        priority: 1,
      };
      const created = await wishlistApi.addItem(wishlistId, payload);
      setWishlist((prev) =>
        prev ? { ...prev, items: [created as WishlistItem, ...prev.items] } : prev
      );
      setTitle("");
      setDescription("");
      setUrl("");
      setPrice("");
      setIsPooling(false);
    } catch (e: any) {
      Alert.alert("Ошибка", e?.response?.data?.detail || "Не удалось добавить товар");
    }
  };

  const removeItem = async (item: WishlistItem) => {
    Alert.alert("Удалить товар?", item.title, [
      { text: "Отмена", style: "cancel" },
      {
        text: "Удалить",
        style: "destructive",
        onPress: async () => {
          try {
            await wishlistApi.deleteItem(item.id);
            setWishlist((prev) =>
              prev ? { ...prev, items: prev.items.filter((i) => i.id !== item.id) } : prev
            );
          } catch (e: any) {
            Alert.alert(
              "Удаление запрещено",
              e?.response?.data?.detail || "Не удалось удалить товар"
            );
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[ui.page, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <FlatList
      style={ui.page}
      contentContainerStyle={ui.content}
      data={wishlist?.items || []}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={
        <ScrollView>
          <View style={ui.card}>
            <Text style={ui.title}>{wishlist?.title || "Вишлист"}</Text>
            <Text style={ui.subtitle}>{wishlist?.description || "Без описания"}</Text>
            <Text style={{ color: "#2563eb", fontWeight: "600" }}>
              slug: {wishlist?.slug}
            </Text>
          </View>
          <View style={ui.card}>
            <Text style={{ fontWeight: "700", color: "#111827" }}>Новый товар</Text>
            <TextInput
              placeholder="Ссылка на товар"
              value={url}
              onChangeText={setUrl}
              style={ui.input}
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
            />
            <Pressable
              style={[ui.button, { backgroundColor: "#0f766e" }]}
              onPress={parse}
              disabled={autofillLoading}
            >
              <Text style={ui.buttonText}>
                {autofillLoading ? "Подтягиваю..." : "Автозаполнение по URL"}
              </Text>
            </Pressable>
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
            <TextInput
              placeholder="Цена"
              value={price}
              onChangeText={setPrice}
              style={ui.input}
              keyboardType="decimal-pad"
              placeholderTextColor="#9ca3af"
            />
            <View
              style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
            >
              <Text style={{ color: "#111827", fontWeight: "600" }}>
                Разрешить коллективный сбор
              </Text>
              <Switch value={isPooling} onValueChange={setIsPooling} />
            </View>
            <Pressable style={ui.button} onPress={addItem}>
              <Text style={ui.buttonText}>Добавить товар</Text>
            </Pressable>
          </View>
        </ScrollView>
      }
      renderItem={({ item }) => (
        <View style={ui.card}>
          <Text style={{ fontWeight: "700", color: "#111827", fontSize: 16 }}>{item.title}</Text>
          <Text style={ui.subtitle}>{item.description || "Без описания"}</Text>
          <Text style={{ color: "#6b7280" }}>
            {item.price ? `${item.price} ${item.currency}` : "Цена не указана"}
          </Text>
          <Text style={{ color: item.is_reserved ? "#dc2626" : "#16a34a", fontWeight: "700" }}>
            {item.is_reserved ? "Зарезервирован" : "Свободен"}
          </Text>
          {item.is_pooling && (
            <Text style={{ color: "#2563eb", fontWeight: "700" }}>
              Сбор: {item.total_contributed || 0} / {item.price || 0} {item.currency}
            </Text>
          )}
          <Pressable
            style={[ui.button, { backgroundColor: "#ef4444" }]}
            onPress={() => removeItem(item)}
          >
            <Text style={ui.buttonText}>Удалить</Text>
          </Pressable>
        </View>
      )}
      ListEmptyComponent={
        <View style={ui.card}>
          <Text style={ui.subtitle}>Пока нет товаров в этом вишлисте.</Text>
        </View>
      }
    />
  );
};
