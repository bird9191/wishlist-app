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
import { authApi } from "@/api/auth";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export const LoginScreen = ({ navigation }: Props) => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    try {
      setLoading(true);
      await login(email.trim(), password);
    } catch (e: any) {
      Alert.alert("Ошибка входа", e?.response?.data?.detail || "Попробуйте снова");
    } finally {
      setLoading(false);
    }
  };

  const showOauthInfo = async (provider: "google" | "github") => {
    try {
      const data =
        provider === "google"
          ? await authApi.getGoogleOAuthInfo()
          : await authApi.getGithubOAuthInfo();
      Alert.alert("OAuth", `${data.message}\n\n${data.instructions}`);
    } catch {
      Alert.alert("OAuth", "Сервис OAuth пока не настроен.");
    }
  };

  return (
    <ScrollView style={ui.page} contentContainerStyle={ui.content}>
      <View style={ui.card}>
        <Text style={ui.title}>Вход</Text>
        <Text style={ui.subtitle}>Социальный вишлист на iOS</Text>
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
          placeholder="Пароль"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={ui.input}
          placeholderTextColor="#9ca3af"
        />
        <Pressable style={ui.button} onPress={onSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={ui.buttonText}>Войти</Text>
          )}
        </Pressable>
        <Pressable onPress={() => navigation.navigate("Register")}>
          <Text style={{ color: "#2563eb", textAlign: "center", fontWeight: "600" }}>
            Нет аккаунта? Регистрация
          </Text>
        </Pressable>
      </View>

      <View style={ui.card}>
        <Text style={{ fontWeight: "700", color: "#111827" }}>OAuth (бэкенд-заглушка)</Text>
        <Pressable style={ui.button} onPress={() => showOauthInfo("google")}>
          <Text style={ui.buttonText}>Google OAuth</Text>
        </Pressable>
        <Pressable style={ui.button} onPress={() => showOauthInfo("github")}>
          <Text style={ui.buttonText}>GitHub OAuth</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};
