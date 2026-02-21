import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types";
import { Wishlist, WishlistItem, WSMessage } from "@/api/types";
import { wishlistApi } from "@/api/wishlist";
import { ui } from "@/ui";
import { useWishlistSocket } from "@/hooks/useWishlistSocket";

type Props = NativeStackScreenProps<RootStackParamList, "PublicWishlist">;

export const PublicWishlistScreen = ({ route }: Props) => {
  const { slug } = route.params;
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [amountByItem, setAmountByItem] = useState<Record<number, string>>({});

  const load = useCallback(async () => {
    try {
      const data = await wishlistApi.getPublicWishlist(slug);
      setWishlist(data);
    } catch (e: any) {
      Alert.alert("Ошибка", e?.response?.data?.detail || "Вишлист не найден");
    }
  }, [slug]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      await load();
      setLoading(false);
    };
    run();
  }, [load]);

  const onSocketMessage = useCallback((msg: WSMessage) => {
    setWishlist((prev) => {
      if (!prev || prev.id !== msg.wishlist_id) return prev;
      if (!msg.item_id) return prev;

      const updatedItems = prev.items.map((item) => {
        if (item.id !== msg.item_id) return item;
        if (msg.type === "reservation" || msg.type === "reservation_cancelled") {
          return { ...item, is_reserved: Boolean((msg.data as any).is_reserved) };
        }
        if (msg.type === "contribution") {
          return {
            ...item,
            total_contributed: Number((msg.data as any).total_contributed || item.total_contributed || 0),
            is_reserved: Boolean((msg.data as any).is_reserved),
          };
        }
        if (msg.type === "item_deleted") {
          return item;
        }
        return item;
      });

      const filtered =
        msg.type === "item_deleted"
          ? updatedItems.filter((i) => i.id !== msg.item_id)
          : updatedItems;

      return { ...prev, items: filtered };
    });
  }, []);

  const { connected } = useWishlistSocket(wishlist?.id || null, onSocketMessage);

  const reserve = async (item: WishlistItem) => {
    if (!name.trim()) {
      Alert.alert("Проверка", "Введите имя.");
      return;
    }
    try {
      await wishlistApi.reserveItem(item.id, {
        reserver_name: name.trim(),
        reserver_email: email.trim() || undefined,
        message: message.trim() || undefined,
      });
      Alert.alert("Успех", "Подарок зарезервирован.");
      await load();
    } catch (e: any) {
      Alert.alert("Ошибка", e?.response?.data?.detail || "Не удалось зарезервировать");
    }
  };

  const contribute = async (item: WishlistItem) => {
    const raw = amountByItem[item.id];
    const amount = Number((raw || "").replace(",", "."));
    if (!name.trim() || !amount || amount <= 0) {
      Alert.alert("Проверка", "Введите имя и сумму вклада > 0.");
      return;
    }
    try {
      await wishlistApi.contribute(item.id, {
        contributor_name: name.trim(),
        contributor_email: email.trim() || undefined,
        amount,
        message: message.trim() || undefined,
      });
      Alert.alert("Успех", "Вклад принят.");
      await load();
    } catch (e: any) {
      Alert.alert("Ошибка", e?.response?.data?.detail || "Не удалось внести вклад");
    }
  };

  const guestIntro = useMemo(
    () => (
      <View style={ui.card}>
        <Text style={ui.title}>{wishlist?.title || "Вишлист"}</Text>
        <Text style={ui.subtitle}>{wishlist?.description || "Публичный просмотр"}</Text>
        <Text style={{ color: connected ? "#16a34a" : "#f59e0b", fontWeight: "700" }}>
          Real-time: {connected ? "подключено" : "переподключение..."}
        </Text>
        <TextInput
          placeholder="Ваше имя"
          value={name}
          onChangeText={setName}
          style={ui.input}
          placeholderTextColor="#9ca3af"
        />
        <TextInput
          placeholder="Ваш email (нужно для отмены резерва)"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={ui.input}
          placeholderTextColor="#9ca3af"
        />
        <TextInput
          placeholder="Комментарий"
          value={message}
          onChangeText={setMessage}
          style={ui.input}
          placeholderTextColor="#9ca3af"
        />
      </View>
    ),
    [wishlist, connected, name, email, message]
  );

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
      ListHeaderComponent={guestIntro}
      renderItem={({ item }) => {
        const total = item.total_contributed || 0;
        const goal = item.price || 0;
        const progress = goal > 0 ? Math.min(100, Math.round((total / goal) * 100)) : 0;
        const fullyFunded = !!(item.is_pooling && goal > 0 && total >= goal);

        return (
          <View style={ui.card}>
            <Text style={{ fontWeight: "700", color: "#111827", fontSize: 16 }}>{item.title}</Text>
            <Text style={ui.subtitle}>{item.description || "Без описания"}</Text>
            <Text style={{ color: "#6b7280" }}>
              {item.price ? `${item.price} ${item.currency}` : "Цена не указана"}
            </Text>

            {item.is_pooling ? (
              <>
                <Text style={{ color: "#2563eb", fontWeight: "700" }}>
                  Собрано: {total} / {goal} {item.currency} ({progress}%)
                </Text>
                <TextInput
                  placeholder="Сумма вклада"
                  value={amountByItem[item.id] || ""}
                  onChangeText={(v) => setAmountByItem((prev) => ({ ...prev, [item.id]: v }))}
                  keyboardType="decimal-pad"
                  style={ui.input}
                  placeholderTextColor="#9ca3af"
                />
                <Pressable
                  style={[ui.button, fullyFunded && { backgroundColor: "#9ca3af" }]}
                  disabled={fullyFunded}
                  onPress={() => contribute(item)}
                >
                  <Text style={ui.buttonText}>
                    {fullyFunded ? "Сбор закрыт" : "Скинуться на подарок"}
                  </Text>
                </Pressable>
              </>
            ) : (
              <Pressable
                style={[ui.button, item.is_reserved && { backgroundColor: "#9ca3af" }]}
                disabled={item.is_reserved}
                onPress={() => reserve(item)}
              >
                <Text style={ui.buttonText}>
                  {item.is_reserved ? "Уже зарезервирован" : "Зарезервировать"}
                </Text>
              </Pressable>
            )}
          </View>
        );
      }}
      ListEmptyComponent={
        <View style={ui.card}>
          <Text style={ui.subtitle}>Пока в этом вишлисте нет товаров.</Text>
        </View>
      }
    />
  );
};
