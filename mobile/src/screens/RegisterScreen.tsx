import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types";
import { useAuth } from "@/context/AuthContext";
import { ui } from "@/ui";

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

export const RegisterScreen = ({ navigation }: Props) => {
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (password.length < 6) {
      Alert.alert("Проверка", "Пароль минимум 6 символов.");
      return;
    }
    if (password !== confirm) {
      Alert.alert("Проверка", "Пароли не совпадают.");
      return;
    }
    try {
      setLoading(true);
      await register(email.trim(), username.trim(), password);
    } catch (e: any) {
      Alert.alert("Ошибка регистрации", e?.response?.data?.detail || "Попробуйте снова");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={ui.page} contentContainerStyle={ui.content}>
      <View style={ui.card}>
        <Text style={ui.title}>Регистрация</Text>
        <TextInput
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={ui.input}
          placeholderTextColor="#9ca3af"
        />
        <TextInput
          placeholder="Имя пользователя"
          value={username}
          onChangeText={setUsername}
          style={ui.input}
          placeholderTextColor="#9ca3af"
        />
        <TextInput
          placeholder="Пароль"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={ui.input}
          placeholderTextColor="#9ca3af"
        />
        <TextInput
          placeholder="Повторите пароль"
          secureTextEntry
          value={confirm}
          onChangeText={setConfirm}
          style={ui.input}
          placeholderTextColor="#9ca3af"
        />
        <Pressable style={ui.button} onPress={onSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={ui.buttonText}>Создать аккаунт</Text>
          )}
        </Pressable>
        <Pressable onPress={() => navigation.navigate("Login")}>
          <Text style={{ color: "#2563eb", textAlign: "center", fontWeight: "600" }}>
            Уже есть аккаунт? Войти
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};
