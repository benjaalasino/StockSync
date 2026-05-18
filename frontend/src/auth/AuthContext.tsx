import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authApi } from "@/services/api";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("access_token"));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    authApi
      .me()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem("access_token");
        setToken(null);
      })
      .finally(() => setIsLoading(false));
  }, [token]);

  const login = async (newToken: string) => {
    localStorage.setItem("access_token", newToken);
    setToken(newToken);
    const me = await authApi.me();
    setUser(me);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAdmin: user?.role === "admin",
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
