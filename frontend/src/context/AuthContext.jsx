/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hydrate = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me");
        setUser(response.data.user);
      } catch {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    hydrate();
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      setSession(nextToken, nextUser) {
        if (nextToken) {
          localStorage.setItem("token", nextToken);
        } else {
          localStorage.removeItem("token");
        }
        setToken(nextToken);
        setUser(nextUser || null);
      },
      async refreshProfile() {
        const response = await api.get("/auth/me");
        setUser(response.data.user);
      },
      logout() {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      },
    }),
    [loading, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
