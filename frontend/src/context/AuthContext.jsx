import { createContext, useEffect, useState, useCallback } from "react";
import API, { setAccessToken, setOnRefreshFail } from "../api/axios";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      await API.post("/auth/logout");
    } catch {
      /* non-critical */
    }
    setAccessToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setOnRefreshFail(() => setUser(null));
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await API.post("/auth/refresh");
        setAccessToken(res.data.accessToken);
        setUser({
          role: res.data.role,
          isProfileComplete: res.data.isProfileComplete,
          isBanned: res.data.isBanned,
          banReason: res.data.banReason,
        });
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = async (email, password) => {
    const res = await API.post("/auth/login", { email, password });
    setAccessToken(res.data.accessToken);
    setUser({
      role: res.data.role,
      isProfileComplete: res.data.isProfileComplete,
      isBanned: res.data.isBanned,
      banReason: res.data.banReason,
    });
    return res.data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}