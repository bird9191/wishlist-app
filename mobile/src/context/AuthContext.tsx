import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "@/api/auth";
import { User } from "@/api/types";
import { tokenStorage } from "@/storage/token";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const token = await tokenStorage.getToken();
        if (!token) {
          setLoading(false);
          return;
        }
        const me = await authApi.me();
        setUser(me);
      } catch {
        await tokenStorage.clearToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      login: async (email, password) => {
        const data = await authApi.login(email, password);
        await tokenStorage.setToken(data.access_token);
        setUser(data.user);
      },
      register: async (email, username, password) => {
        const data = await authApi.register(email, username, password);
        await tokenStorage.setToken(data.access_token);
        setUser(data.user);
      },
      logout: async () => {
        await tokenStorage.clearToken();
        setUser(null);
      },
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
