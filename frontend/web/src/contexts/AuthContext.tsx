import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import type {
  LoginPayload,
  RegisterPayload,
  Role,
  User,
} from "../types";
import {
  AUTH_UNAUTHORIZED_EVENT,
  clearSession,
  getStoredUser,
  getToken,
  setStoredUser,
  setToken,
} from "../lib/storage";
import { isForbidden, isUnauthorized } from "../lib/errors";
import { useToast } from "./ToastContext";
import { LoadingScreen } from "../components/ui/LoadingScreen";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  initializing: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<string>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  hasRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [initializing, setInitializing] = useState(() => Boolean(getToken()));

  useEffect(() => {
    let active = true;
    const currentToken = getToken();

    if (!currentToken) {
      setInitializing(false);
      return;
    }

    authService
      .me()
      .then((response) => {
        if (!active) return;
        setUser(response.user);
        setStoredUser(response.user);
        setTokenState(currentToken);
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (isUnauthorized(error) || isForbidden(error)) {
          clearSession();
          setUser(null);
          setTokenState(null);
        } else if (!getStoredUser()) {
          clearSession();
          setUser(null);
          setTokenState(null);
        }
      })
      .finally(() => {
        if (active) setInitializing(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string }>).detail;
      setUser(null);
      setTokenState(null);
      toast.error(
        "Sesi berakhir",
        detail?.message ?? "Silakan masuk kembali untuk melanjutkan.",
      );
      if (location.pathname !== "/login") {
        navigate("/login?expired=1", { replace: true });
      }
    };

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handler);
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handler);
  }, [navigate, location.pathname, toast]);

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await authService.login(payload);
    setToken(response.token);
    setTokenState(response.token);
    setStoredUser(response.user);
    setUser(response.user);
    return response.user;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await authService.register(payload);
    return response.message;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setTokenState(null);
    toast.info("Berhasil keluar", "Sesi kamu telah diakhiri dengan aman.");
    navigate("/login", { replace: true });
  }, [navigate, toast]);

  const refreshProfile = useCallback(async () => {
    const response = await authService.me();
    setUser(response.user);
    setStoredUser(response.user);
  }, []);

  const hasRole = useCallback(
    (...roles: Role[]) => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      initializing,
      isAuthenticated: Boolean(user && token),
      login,
      register,
      logout,
      refreshProfile,
      hasRole,
    }),
    [user, token, initializing, login, register, logout, refreshProfile, hasRole],
  );

  if (initializing) {
    return <LoadingScreen label="Memverifikasi sesi kamu…" />;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth harus dipakai di dalam AuthProvider");
  }
  return context;
}
