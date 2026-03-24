import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface User {
  email: string;
  role: "admin" | "engineer" | "viewer";
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const VALID_CREDENTIALS = { email: "admin@istrac.gov.in", password: "admin123" };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = sessionStorage.getItem("cms_user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (email: string, password: string) => {
    if (email === VALID_CREDENTIALS.email && password === VALID_CREDENTIALS.password) {
      const u: User = { email, role: "admin" };
      setUser(u);
      sessionStorage.setItem("cms_user", JSON.stringify(u));
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem("cms_user");
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
