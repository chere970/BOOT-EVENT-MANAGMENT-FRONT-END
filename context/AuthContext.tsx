"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

export interface User {
  id?: string | number;
  userId?: string | number;
  sub?: string | number;
  email?: string;
  fullName?: string;
  name?: string;
  phone?: string;
  role?: string;
  userRole?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEYS = ["token", "access_token", "authToken"];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadAuthFromStorage = useCallback(() => {
    if (typeof window === "undefined") return;

    let storedToken: string | null = null;
    for (const key of TOKEN_KEYS) {
      const val = localStorage.getItem(key);
      if (val) {
        storedToken = val;
        break;
      }
    }

    const rawUser = localStorage.getItem("user");
    let parsedUser: User | null = null;
    if (rawUser) {
      try {
        parsedUser = JSON.parse(rawUser);
      } catch (err) {
        console.error("Failed to parse user from localStorage", err);
      }
    }

    setToken(storedToken);
    setUser(parsedUser);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadAuthFromStorage();
  }, [loadAuthFromStorage]);

  const login = useCallback((newToken: string, newUser: User) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    TOKEN_KEYS.forEach((key) => localStorage.removeItem(key));
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        refreshAuth: loadAuthFromStorage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useRequireAuth(allowedRoles?: string[], redirectTo = "/login") {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    if (!token || !user) {
      router.push(`${redirectTo}?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (allowedRoles && allowedRoles.length > 0) {
      const role = (user.role || user.userRole || "").toString().toUpperCase();
      const normalizedAllowed = allowedRoles.map((r) => r.toUpperCase());
      if (!normalizedAllowed.includes(role)) {
        if (role === "VOLUNTEER") {
          router.push("/organizer/tasks");
        } else if (role === "MEMBER") {
          router.push("/member");
        } else {
          router.push("/dashbord");
        }
      }
    }
  }, [isLoading, token, user, allowedRoles, redirectTo, router, pathname]);

  return { user, token, isLoading };
}
