import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import api, { setAccessToken, setOnRefreshFail } from "../api/axios";

export const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync axios + local state
  useEffect(() => {
    setAccessToken(token);
  }, [token]);

  useEffect(() => {
    setOnRefreshFail(() => {
      setToken(null);
      setUser(null);
      localStorage.removeItem("token");
    });
  }, []);

  // Restore session on load
  useEffect(() => {
    const restoreSession = async () => {
      try {
        if (!token) {
          setLoading(false);
          return;
        }

        const res = await api.post("/auth/refresh");

        const newToken = res.data.accessToken;

        setToken(newToken);
        setAccessToken(newToken);

        setUser({
          role: res.data.role,
          isProfileComplete: res.data.isProfileComplete,
          isBanned: res.data.isBanned,
          banReason: res.data.banReason,
        });
      } catch {
        setToken(null);
        setUser(null);
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post("/auth/login", { email, password });

    const newToken = res.data.accessToken;

    setToken(newToken);
    setAccessToken(newToken);

    setUser({
      role: res.data.role,
      isProfileComplete: res.data.isProfileComplete,
      isBanned: res.data.isBanned,
      banReason: res.data.banReason,
    });

    return res.data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore
    }

    setToken(null);
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem("token");
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      logout,
      isAuthenticated: !!token,
    }),
    [user, token, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}