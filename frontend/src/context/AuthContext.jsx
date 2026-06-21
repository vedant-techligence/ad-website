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
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get("/auth/me");
        setUser({
          ...res.data.user,
          role: res.data.user.role,
          isProfileComplete: res.data.user.isProfileComplete,
          isBanned: res.data.user.isBanned || false,
          banReason: res.data.user.banReason || "",
        });
      } catch (err) {
        if (err?.response?.status === 401) {
          // Token expired — clear session
          setToken(null);
          setUser(null);
          localStorage.removeItem("token");
        }
        // For network errors etc, keep token and let user retry
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
    localStorage.setItem("token", newToken);

    setUser({
      ...res.data.user,
      role: res.data.role,
      isProfileComplete: res.data.isProfileComplete,
      isBanned: res.data.isBanned || false,
      banReason: res.data.banReason || "",
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