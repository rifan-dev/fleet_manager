import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { useGetMe, User } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("elite_drive_token"));
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useGetMe({ 
    query: { 
      enabled: !!token, 
      retry: false 
    } 
  });

  useEffect(() => {
    if (error) {
      localStorage.removeItem("elite_drive_token");
      setToken(null);
      queryClient.clear();
    }
  }, [error, queryClient]);

  const login = (newToken: string) => {
    localStorage.setItem("elite_drive_token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("elite_drive_token");
    setToken(null);
    queryClient.clear();
  };

  return (
    <AuthContext.Provider value={{ user: user ?? null, isLoading: isLoading && !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};